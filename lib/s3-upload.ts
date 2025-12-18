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
  // Step 1: Get presigned URL from server
  console.log(`[v0] Requesting presigned URL for ${type} file: ${file.name}`)
  console.log(`[v0] File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

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
  console.log(`[v0] Got presigned URL, uploading directly to S3: ${s3Key}`)
  console.log(`[v0] Presigned URL host: ${new URL(presignedUrl).host}`)

  // Step 2: Upload directly to S3 using presigned URL
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastProgressTime = Date.now()
    let lastProgressBytes = 0

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const now = Date.now()
        const timeDiff = (now - lastProgressTime) / 1000 // seconds
        const bytesDiff = event.loaded - lastProgressBytes
        const speed = timeDiff > 0 ? (bytesDiff / timeDiff / 1024 / 1024).toFixed(2) : 0 // MB/s

        const percentComplete = Math.round((event.loaded / event.total) * 100)
        console.log(
          `[v0] S3 direct upload progress: ${percentComplete}% (${(event.loaded / 1024 / 1024).toFixed(2)}/${(event.total / 1024 / 1024).toFixed(2)} MB) - ${speed} MB/s`,
        )

        lastProgressTime = now
        lastProgressBytes = event.loaded

        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percentage: percentComplete,
        })
      } else {
        console.log(`[v0] S3 upload progress: ${event.loaded} bytes (total unknown)`)
      }
    })

    // Handle completion
    xhr.addEventListener("load", () => {
      console.log(`[v0] S3 direct upload completed with status: ${xhr.status}`)
      console.log(`[v0] Response headers: ${xhr.getAllResponseHeaders()}`)
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`[v0] Upload successful! File uploaded to: ${s3Key}`)
        resolve({
          s3Key,
          bucket,
          region,
          size: file.size,
          contentType: file.type,
        })
      } else {
        console.error(`[v0] S3 upload failed with status: ${xhr.status}`)
        console.error(`[v0] Response: ${xhr.responseText}`)
        reject(new Error(`S3 upload failed with status ${xhr.status}`))
      }
    })

    // Handle errors
    xhr.addEventListener("error", (event) => {
      console.error("[v0] S3 upload network error:", event)
      console.error("[v0] XHR status:", xhr.status)
      console.error("[v0] XHR readyState:", xhr.readyState)
      reject(new Error("Network error during S3 upload"))
    })

    // Handle abort
    xhr.addEventListener("abort", () => {
      console.log("[v0] S3 upload was aborted")
      reject(new Error("S3 upload aborted"))
    })

    xhr.addEventListener("readystatechange", () => {
      console.log(`[v0] XHR readyState changed to: ${xhr.readyState}`)
    })

    // Upload to S3 with PUT method
    console.log(`[v0] Starting XHR PUT request to S3...`)
    xhr.open("PUT", presignedUrl)
    xhr.setRequestHeader("Content-Type", file.type || (type === "dem" ? "application/octet-stream" : "video/mp4"))
    xhr.send(file)
    console.log(`[v0] XHR request sent, waiting for response...`)
  })
}

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks
const MAX_CONCURRENT_UPLOADS = 8 // Upload 8 parts at a time

async function uploadWithMultipart(
  file: File,
  type: "dem" | "video",
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  console.log(`[v0] Starting multipart upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

  // Step 1: Initiate multipart upload
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
  console.log(`[v0] Multipart upload initiated: ${uploadId}`)

  // Step 2: Upload parts in parallel
  const totalParts = Math.ceil(file.size / CHUNK_SIZE)
  console.log(`[v0] Uploading ${totalParts} parts with ${MAX_CONCURRENT_UPLOADS} concurrent uploads...`)

  const parts: Array<{ ETag: string; PartNumber: number }> = []
  const uploadedBytes = 0
  const progressLock = { value: 0 }

  const uploadPart = async (partNumber: number) => {
    const start = (partNumber - 1) * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    console.log(`[v0] Uploading part ${partNumber}/${totalParts} (${(chunk.size / 1024 / 1024).toFixed(2)} MB)`)

    // Get presigned URL for this part
    const signResponse = await fetch("/api/upload/multipart-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, s3Key, partNumber }),
    })

    if (!signResponse.ok) {
      const errorData = await signResponse.json()
      console.error(`[v0] Failed to sign part ${partNumber}:`, errorData)
      throw new Error(`Failed to sign part ${partNumber}: ${errorData.error}`)
    }

    const { presignedUrl } = await signResponse.json()

    // Upload the part
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: chunk,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error(`[v0] S3 returned error for part ${partNumber}:`, errorText)
      throw new Error(`Failed to upload part ${partNumber}: Status ${uploadResponse.status}`)
    }

    const etag = uploadResponse.headers.get("ETag")
    if (!etag) {
      throw new Error(`No ETag returned for part ${partNumber}`)
    }

    console.log(`[v0] Part ${partNumber} uploaded successfully`)

    // Update progress (thread-safe)
    progressLock.value += chunk.size
    const currentProgress = progressLock.value
    const percentage = Math.round((currentProgress / file.size) * 100)

    console.log(
      `[v0] Progress: ${percentage}% (${(currentProgress / 1024 / 1024).toFixed(2)}/${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    )

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
    console.error(`[v0] Multipart upload failed:`, error)
    throw error
  }

  // Sort parts by part number (they may have completed out of order)
  parts.sort((a, b) => a.PartNumber - b.PartNumber)

  // Step 3: Complete multipart upload
  console.log("[v0] Completing multipart upload...")
  const completeResponse = await fetch("/api/upload/multipart-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId, s3Key, parts }),
  })

  if (!completeResponse.ok) {
    throw new Error("Failed to complete multipart upload")
  }

  console.log("[v0] Multipart upload completed successfully!")

  return {
    s3Key,
    bucket,
    region,
    size: file.size,
    contentType: file.type,
  }
}

/**
 * Compress file using gzip compression
 * @param file - File to compress
 * @param onProgress - Callback for compression progress
 * @returns Compressed blob and compression ratio
 */
async function compressFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ compressed: Blob; originalSize: number; compressedSize: number; ratio: number }> {
  console.log(`[v0] Starting compression of ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer()

  // Use CompressionStream API (available in modern browsers)
  const stream = new Blob([arrayBuffer]).stream()
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"))

  // Read compressed data
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

        // Estimate progress (compressed size vs original)
        const progress = Math.min(Math.round((totalCompressed / file.size) * 100), 99)
        onProgress?.(progress)
      }
    }

    onProgress?.(100)

    // Combine chunks into single blob
    const compressedBlob = new Blob(chunks, { type: "application/gzip" })
    const ratio = ((1 - compressedBlob.size / file.size) * 100).toFixed(1)

    console.log(
      `[v0] Compression complete: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB (${ratio}% reduction)`,
    )

    return {
      compressed: compressedBlob,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
      ratio: Number.parseFloat(ratio),
    }
  } catch (error) {
    console.error("[v0] Compression failed:", error)
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
