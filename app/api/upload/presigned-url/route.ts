import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || "",
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  sessionToken: process.env.AWS_SESSION_TOKEN,
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

function generatePresignedUrl(
  bucket: string,
  key: string,
  region: string,
  contentType: string,
  expiresIn = 3600,
): string {
  const { accessKeyId, secretAccessKey, sessionToken } = S3_CONFIG

  const date = new Date()
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  const host = `${bucket}.s3.${region}.amazonaws.com`
  const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, "/")}`

  // Build query parameters
  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${dateStamp}/${region}/s3/aws4_request`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "host",
  }

  if (sessionToken) {
    queryParams["X-Amz-Security-Token"] = sessionToken
  }

  // Sort and encode query string
  const sortedKeys = Object.keys(queryParams).sort()
  const canonicalQueryString = sortedKeys.map((key) => `${key}=${encodeURIComponent(queryParams[key])}`).join("&")

  // Create canonical request
  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = "host"
  const payloadHash = "UNSIGNED-PAYLOAD"

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  // Create string to sign
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const canonicalRequestHash = crypto.createHash("sha256").update(canonicalRequest).digest("hex")

  const stringToSign = [algorithm, amzDate, credentialScope, canonicalRequestHash].join("\n")

  // Calculate signature
  const kDate = crypto.createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest()
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest()
  const kService = crypto.createHmac("sha256", kRegion).update("s3").digest()
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest()
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex")

  // Build final URL
  const finalQueryString = `${canonicalQueryString}&X-Amz-Signature=${signature}`
  return `https://${host}${canonicalUri}?${finalQueryString}`
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
    const finalContentType = contentType || (fileType === "dem" ? "application/octet-stream" : "video/mp4")

    const presignedUrl = generatePresignedUrl(S3_CONFIG.bucket, s3Key, S3_CONFIG.region, finalContentType, 3600)

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
