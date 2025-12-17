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
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    console.log(`[v0] Starting secure S3 upload via server - Type: ${type}, Size: ${file.size}`)

    // Track upload progress
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

    // Handle completion
    xhr.addEventListener("load", () => {
      console.log(`[v0] Server upload completed with status: ${xhr.status}`)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          console.log("[v0] Upload response:", response)

          if (response.success) {
            resolve({
              s3Key: response.s3Key,
              bucket: response.bucket,
              region: response.region,
              size: response.size,
              contentType: response.contentType,
            })
          } else {
            reject(new Error(response.error || "Upload failed"))
          }
        } catch (error) {
          console.error("[v0] Error parsing upload response:", error)
          reject(new Error("Error parsing server response"))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    // Handle errors
    xhr.addEventListener("error", () => {
      console.error("[v0] Upload error occurred")
      reject(new Error("Network error during upload"))
    })

    // Handle abort
    xhr.addEventListener("abort", () => {
      console.log("[v0] Upload was aborted")
      reject(new Error("Upload aborted"))
    })

    // Start upload with appropriate timeout
    const timeout = type === "video" ? 900000 : 600000 // 15 min for video, 10 min for DEM
    xhr.open("POST", "/api/upload/s3")
    xhr.timeout = timeout
    xhr.send(formData)
  })
}

/**
 * Upload file directly to S3 using presigned URL (no size limit)
 * @param file - File to upload
 * @param type - Type of file (dem or video)
 * @param onProgress - Callback for progress updates
 * @returns Upload result with S3 location information
 */
export async function uploadToS3Direct(
  file: File,
  type: "dem" | "video",
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`[v0] Starting direct S3 upload - Type: ${type}, Size: ${file.size}`)

      const presignedResponse = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: type,
          contentType: file.type || (type === "dem" ? "application/octet-stream" : "video/mp4"),
        }),
      })

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json()
        throw new Error(error.error || "Failed to get presigned URL")
      }

      const { presignedUrl, s3Key, bucket, region } = await presignedResponse.json()

      console.log(`[v0] Got presigned URL, uploading directly to S3: ${s3Key}`)

      const xhr = new XMLHttpRequest()

      // Track upload progress
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

      // Handle completion
      xhr.addEventListener("load", () => {
        console.log(`[v0] Direct S3 upload completed with status: ${xhr.status}`)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            s3Key,
            bucket,
            region,
            size: file.size,
            contentType: file.type,
          })
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        console.error("[v0] S3 upload error occurred")
        reject(new Error("Network error during S3 upload"))
      })

      // Handle abort
      xhr.addEventListener("abort", () => {
        console.log("[v0] S3 upload was aborted")
        reject(new Error("S3 upload aborted"))
      })

      // Start upload with PUT method to presigned URL
      xhr.open("PUT", presignedUrl)
      xhr.setRequestHeader("Content-Type", file.type || (type === "dem" ? "application/octet-stream" : "video/mp4"))
      xhr.send(file)
    } catch (error) {
      console.error("[v0] Error in direct S3 upload:", error)
      reject(error)
    }
  })
}

/**
 * Upload DEM file to S3 via secure server endpoint
 */
export async function uploadDemToS3Server(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3(file, "dem", onProgress)
}

/**
 * Upload video file to S3 via secure server endpoint
 */
export async function uploadVideoToS3Server(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3(file, "video", onProgress)
}

/**
 * Upload DEM file directly to S3 using presigned URL
 */
export async function uploadDemToS3Direct(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3Direct(file, "dem", onProgress)
}

/**
 * Upload video file directly to S3 using presigned URL
 */
export async function uploadVideoToS3Direct(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3Direct(file, "video", onProgress)
}

/**
 * Upload DEM file to S3 (uses direct upload with presigned URL)
 */
export async function uploadDemToS3(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3Direct(file, "dem", onProgress)
}

/**
 * Upload video file to S3 (uses direct upload with presigned URL)
 */
export async function uploadVideoToS3(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3Direct(file, "video", onProgress)
}
