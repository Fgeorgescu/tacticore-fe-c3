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

    console.log(`[v0] Starting S3 upload via server - Type: ${type}, Size: ${file.size}`)

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        console.log(`[v0] Upload progress: ${percentComplete}%`)
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

    // Start upload with appropriate timeout (increased for large files)
    const timeout = type === "video" ? 1800000 : 1200000 // 30 min for video, 20 min for DEM
    xhr.open("POST", "/api/upload/s3")
    xhr.timeout = timeout
    xhr.send(formData)
  })
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
