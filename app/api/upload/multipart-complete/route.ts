import { type NextRequest, NextResponse } from "next/server"
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3"

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
    const { uploadId, s3Key, parts } = await request.json()

    console.log("[v0] Completing multipart upload:", uploadId)
    console.log("[v0] Parts:", parts.length)

    // Complete the multipart upload
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    const response = await s3Client.send(command)

    console.log("[v0] Multipart upload completed successfully")

    return NextResponse.json({
      success: true,
      location: response.Location,
      etag: response.ETag,
    })
  } catch (error: any) {
    console.error("[Server] Failed to complete multipart upload:", error.message)
    return NextResponse.json({ error: error.message || "Failed to complete multipart upload" }, { status: 500 })
  }
}
