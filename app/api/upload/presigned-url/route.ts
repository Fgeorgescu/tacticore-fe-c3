import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
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

    const body = await request.json()
    const { fileName, fileType, contentType } = body

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 })
    }

    if (fileType !== "dem" && fileType !== "video") {
      return NextResponse.json({ error: "Invalid file type. Must be 'dem' or 'video'" }, { status: 400 })
    }

    console.log(`[Server] Generating presigned URL - File: ${fileName}, Type: ${fileType}`)

    const s3Key = generateS3Key(fileName, fileType)
    const s3Client = createS3Client()

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: s3Key,
      ContentType: contentType || (fileType === "dem" ? "application/octet-stream" : "video/mp4"),
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        fileType: fileType,
      },
    })

    // Generate presigned URL valid for 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    console.log(`[Server] Presigned URL generated - Key: ${s3Key}`)

    return NextResponse.json({
      success: true,
      presignedUrl,
      s3Key,
      bucket: S3_CONFIG.bucket,
      region: S3_CONFIG.region,
    })
  } catch (error) {
    console.error("[Server] Failed to generate presigned URL:", error)
    return NextResponse.json(
      {
        error: "Failed to generate presigned URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
