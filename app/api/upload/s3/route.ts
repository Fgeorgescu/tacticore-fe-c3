import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { type NextRequest, NextResponse } from "next/server"

const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || "",
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  sessionToken: process.env.AWS_SESSION_TOKEN,
}

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

function generateS3Key(fileName: string, fileType: "dem" | "video"): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50)
    .replace(/^\.+/, "")

  return `uploads/${fileType}/${timestamp}-${randomString}-${sanitizedName}`
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    if (!S3_CONFIG.bucket || !S3_CONFIG.accessKeyId || !S3_CONFIG.secretAccessKey) {
      return NextResponse.json(
        {
          error: "S3 configuration missing",
          details: "Server is not properly configured for S3 uploads",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileType = formData.get("type") as "dem" | "video" | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!fileType || (fileType !== "dem" && fileType !== "video")) {
      return NextResponse.json({ error: "Invalid file type. Must be 'dem' or 'video'" }, { status: 400 })
    }

    console.log(`[Server] Starting S3 upload - File: ${file.name}, Type: ${fileType}, Size: ${file.size}`)

    const maxSize = fileType === "video" ? 5 * 1024 * 1024 * 1024 : 2 * 1024 * 1024 * 1024 // 5GB video, 2GB DEM
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large",
          details: `Maximum file size is ${maxSize / (1024 * 1024 * 1024)}GB for ${fileType} files`,
        },
        { status: 413 },
      )
    }

    const s3Key = generateS3Key(file.name, fileType)
    const s3Client = createS3Client()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || (fileType === "dem" ? "application/octet-stream" : "video/mp4"),
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        fileType: fileType,
      },
    })

    await s3Client.send(command)

    console.log(`[Server] S3 upload completed - Key: ${s3Key}`)

    return NextResponse.json({
      success: true,
      s3Key,
      bucket: S3_CONFIG.bucket,
      region: S3_CONFIG.region,
      size: file.size,
      contentType: file.type,
    })
  } catch (error) {
    console.error("[Server] S3 upload failed:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
