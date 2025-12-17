import { type NextRequest, NextResponse } from "next/server"
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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
    const { uploadId, s3Key, partNumber } = await request.json()

    console.log(`[v0] Signing part ${partNumber} for upload:`, uploadId)

    // Generate presigned URL for this part
    const command = new UploadPartCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({ presignedUrl })
  } catch (error: any) {
    console.error("[Server] Failed to sign part:", error.message)
    return NextResponse.json({ error: error.message || "Failed to sign part" }, { status: 500 })
  }
}
