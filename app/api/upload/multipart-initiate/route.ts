import { type NextRequest, NextResponse } from "next/server"
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, contentType } = await request.json()

    // Generate S3 key
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const s3Key = `uploads/${fileType}/${timestamp}-${randomId}-${fileName}`

    console.log("[v0] Initiating multipart upload for:", s3Key)

    // Initiate multipart upload
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      ContentType: contentType,
    })

    const response = await s3Client.send(command)

    console.log("[v0] Multipart upload initiated:", response.UploadId)

    return NextResponse.json({
      uploadId: response.UploadId,
      s3Key,
      bucket: process.env.AWS_S3_BUCKET!,
      region: process.env.AWS_REGION!,
    })
  } catch (error: any) {
    console.error("[Server] Failed to initiate multipart upload:", error.message)
    return NextResponse.json({ error: error.message || "Failed to initiate multipart upload" }, { status: 500 })
  }
}
