export interface S3UploadProgress {
  loaded: number
  total: number
  percentage: number
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
  // Use multipart upload for files larger than 50MB
  if (file.size > 50 * 1024 * 1024) {
    console.log("[v0] File is large, using multipart upload")
    return uploadWithMultipart(file, type, onProgress)
  } else {
    console.log("[v0] File is small, using single presigned URL")
    return uploadWithPresignedUrl(file, type, onProgress)
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

  // Step 2: Upload parts
  const totalParts = Math.ceil(file.size / CHUNK_SIZE)
  console.log(`[v0] Uploading ${totalParts} parts...`)

  const parts: Array<{ ETag: string; PartNumber: number }> = []
  let uploadedBytes = 0

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
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
      throw new Error(`Failed to sign part ${partNumber}`)
    }

    const { presignedUrl } = await signResponse.json()

    // Upload the part
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: chunk,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload part ${partNumber}`)
    }

    const etag = uploadResponse.headers.get("ETag")
    if (!etag) {
      throw new Error(`No ETag returned for part ${partNumber}`)
    }

    parts.push({ ETag: etag, PartNumber: partNumber })
    uploadedBytes += chunk.size

    // Report progress
    const percentage = Math.round((uploadedBytes / file.size) * 100)
    console.log(
      `[v0] Progress: ${percentage}% (${(uploadedBytes / 1024 / 1024).toFixed(2)}/${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    )

    onProgress?.({
      loaded: uploadedBytes,
      total: file.size,
      percentage,
    })
  }

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
