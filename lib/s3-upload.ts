import { S3Client } from "@aws-sdk/client-s3"

// Configuration from environment variables
const S3_CONFIG = {
  bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET || "",
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  sessionToken: process.env.NEXT_PUBLIC_AWS_SESSION_TOKEN,
}

// Create S3 client with credentials
function createS3Client(): S3Client {
  const credentials = S3_CONFIG.sessionToken
    ? {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey,
        sessionToken: S3_CONFIG.sessionToken,
      }
    : {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey,
      }

  return new S3Client({
    region: S3_CONFIG.region,
    credentials,
  })
}

// Generate unique file path in S3
function generateS3Key(file: File, type: "dem" | "video"): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const extension = file.name.split(".").pop() || (type === "dem" ? "dem" : "mp4")
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50)
    .replace(/^\.+/, "")

  return `uploads/${type}/${timestamp}-${randomString}-${sanitizedName}`
}

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
 * Upload DEM file to S3 via secure server endpoint
 */
export async function uploadDemToS3(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3(file, "dem", onProgress)
}

/**
 * Upload video file to S3 via secure server endpoint
 */
export async function uploadVideoToS3(
  file: File,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return uploadToS3(file, "video", onProgress)
}
