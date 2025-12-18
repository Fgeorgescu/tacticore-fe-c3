export interface S3UploadProgress {
  loaded: number
  total: number
  percentage: number
  isCompressing?: boolean
  compressionProgress?: number
}

export interface S3UploadResult {
  s3Key: string
  bucket: string
  region: string
  size: number
  contentType: string
}

/**
 * Upload file to S3 via secure server endpoint with progress tracking
 * @param file - File to upload
 * @param type - Type of file (dem or video)
 * @param onProgress - Callback for progress updates
 * @returns Upload result with S3 location information
 */
export async function uploadToS3(
  file: File,
  type: "dem" | "video",
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  // Compress file before uploading
  onProgress?.({
    loaded: 0,
    total: file.size,
    percentage: 0,
    isCompressing: true,
    compressionProgress: 0,
  })

  const { compressed, originalSize, compressedSize } = await compressFile(file, (compressionProgress) => {
    onProgress?.({
      loaded: 0,
      total: file.size,
      percentage: 0,
      isCompressing: true,
      compressionProgress,
    })
  })

  // Create a File object from the compressed blob with .gz extension
  const compressedFile = new File([compressed], `${file.name}.gz`, {
    type: "application/gzip",
  })

  // Update progress callback to account for compression
  const wrappedProgress = (progress: S3UploadProgress) => {
    onProgress?.({
      ...progress,
      isCompressing: false,
    })
  }

  // Use multipart upload for files larger than 50MB (after compression)
  if (compressedFile.size > 50 * 1024 * 1024) {
    return uploadWithMultipart(compressedFile, type, wrappedProgress)
  } else {
    return uploadWithPresignedUrl(compressedFile, type, wrappedProgress)
  }
}

async function uploadWithPresignedUrl(
  file: File,
  type: "dem" | "video",
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  const response = await fetch("/api/upload/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: type,
      contentType: file.type || (type === "dem" ? "application/octet-stream" : "video/mp4"),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to get presigned URL")
  }

  const { presignedUrl, s3Key, bucket, region } = await response.json()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percentage: percentComplete,
        })
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          s3Key,
          bucket,
          region,
          size: file.size,
          contentType: file.type,
        })
      } else {
        console.error(`S3 upload failed with status: ${xhr.status}`)
        reject(new Error(`S3 upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener("error", () => {
      console.error("S3 upload network error")
      reject(new Error("Network error during S3 upload"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("S3 upload aborted"))
    })

    xhr.open("PUT", presignedUrl)
    xhr.setRequestHeader("Content-Type", file.type || (type === "dem" ? "application/octet-stream" : "video/mp4"))
    xhr.send(file)
  })
}

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks
const MAX_CONCURRENT_UPLOADS = 8 // Upload 8 parts at a time

async function uploadWithMultipart(
  file: File,
  type: "dem" | "video",
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  const initiateResponse = await fetch("/api/upload/multipart-initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: type,
      contentType: file.type || (type === "dem" ? "application/octet-stream" : "video/mp4"),
    }),
  })

  if (!initiateResponse.ok) {
    throw new Error("Failed to initiate multipart upload")
  }

  const { uploadId, s3Key, bucket, region } = await initiateResponse.json()

  const totalParts = Math.ceil(file.size / CHUNK_SIZE)
  const parts: Array<{ ETag: string; PartNumber: number }> = []
  const progressLock = { value: 0 }

  const uploadPart = async (partNumber: number) => {
    const start = (partNumber - 1) * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const signResponse = await fetch("/api/upload/multipart-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, s3Key, partNumber }),
    })

    if (!signResponse.ok) {
      const errorData = await signResponse.json()
      throw new Error(`Failed to sign part ${partNumber}: ${errorData.error}`)
    }

    const { presignedUrl } = await signResponse.json()

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: chunk,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload part ${partNumber}: Status ${uploadResponse.status}`)
    }

    const etag = uploadResponse.headers.get("ETag")
    if (!etag) {
      throw new Error(`No ETag returned for part ${partNumber}`)
    }

    progressLock.value += chunk.size
    const currentProgress = progressLock.value
    const percentage = Math.round((currentProgress / file.size) * 100)

    onProgress?.({
      loaded: currentProgress,
      total: file.size,
      percentage,
    })

    return { ETag: etag, PartNumber: partNumber }
  }

  try {
    for (let i = 0; i < totalParts; i += MAX_CONCURRENT_UPLOADS) {
      const batch = []
      for (let j = 0; j < MAX_CONCURRENT_UPLOADS && i + j < totalParts; j++) {
        batch.push(uploadPart(i + j + 1))
      }
      const batchResults = await Promise.all(batch)
      parts.push(...batchResults)
    }
  } catch (error: any) {
    console.error(`Multipart upload failed:`, error)
    throw error
  }

  parts.sort((a, b) => a.PartNumber - b.PartNumber)

  const completeResponse = await fetch("/api/upload/multipart-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId, s3Key, parts }),
  })

  if (!completeResponse.ok) {
    throw new Error("Failed to complete multipart upload")
  }

  return {
    s3Key,
    bucket,
    region,
    size: file.size,
    contentType: file.type,
  }
}

async function compressFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ compressed: Blob; originalSize: number; compressedSize: number; ratio: number }> {
  const arrayBuffer = await file.arrayBuffer()
  const stream = new Blob([arrayBuffer]).stream()
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"))

  const chunks: Uint8Array[] = []
  const reader = compressedStream.getReader()
  let totalCompressed = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      if (value) {
        chunks.push(value)
        totalCompressed += value.length

        const progress = Math.min(Math.round((totalCompressed / file.size) * 100), 99)
        onProgress?.(progress)
      }
    }

    onProgress?.(100)

    const compressedBlob = new Blob(chunks, { type: "application/gzip" })
    const ratio = ((1 - compressedBlob.size / file.size) * 100).toFixed(1)

    return {
      compressed: compressedBlob,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
      ratio: Number.parseFloat(ratio),
    }
  } catch (error) {
    console.error("Compression failed:", error)
    throw new Error("Failed to compress file")
  }
}

/**
 * Upload DEM file to S3
 */
export async function uploadDemToS3(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3(file, "dem", onProgress)
}

/**
 * Upload video file to S3
 */
export async function uploadVideoToS3(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3(file, "video", onProgress)
}
