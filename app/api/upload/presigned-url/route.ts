import { NextResponse } from "next/server"

const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || "",
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  sessionToken: process.env.AWS_SESSION_TOKEN,
}

// AWS Signature V4 signing helpers using Web Crypto API
async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  return await crypto.subtle.digest("SHA-256", data)
}

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const data = encoder.encode(message)
  return await crypto.subtle.sign("HMAC", cryptoKey, data)
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function generateSignature(
  stringToSign: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const kDate = await hmacSha256(encoder.encode("AWS4" + S3_CONFIG.secretAccessKey), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, "aws4_request")
  const signature = await hmacSha256(kSigning, stringToSign)
  return toHex(signature)
}

function generateS3Key(fileName: string, fileType: "dem" | "video"): string {
  const timestamp = Date.now()
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50)
    .replace(/^\.+/, "")

  return `uploads/${fileType}/${timestamp}-${sanitizedName}`
}

export async function POST(request: Request) {
  try {
    // Validate configuration
    if (!S3_CONFIG.bucket || !S3_CONFIG.accessKeyId || !S3_CONFIG.secretAccessKey) {
      console.error("[Server] S3 configuration missing")
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

    if (!fileName || !fileType || (fileType !== "dem" && fileType !== "video")) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    const s3Key = generateS3Key(fileName, fileType)
    const bucket = S3_CONFIG.bucket
    const region = S3_CONFIG.region
    const service = "s3"

    // Generate presigned URL
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = amzDate.substring(0, 8)
    const expiresIn = 3600 // 1 hour

    const host = `${bucket}.s3.${region}.amazonaws.com`
    const canonicalUri = `/${s3Key}`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const credential = `${S3_CONFIG.accessKeyId}/${credentialScope}`

    // Build canonical query string
    const params = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": credential,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": expiresIn.toString(),
      "X-Amz-SignedHeaders": "host",
    })

    if (S3_CONFIG.sessionToken) {
      params.set("X-Amz-Security-Token", S3_CONFIG.sessionToken)
    }

    const canonicalQueryString = params.toString()

    // Create canonical request
    const canonicalHeaders = `host:${host}\n`
    const signedHeaders = "host"
    const payloadHash = "UNSIGNED-PAYLOAD"

    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    // Create string to sign
    const canonicalRequestHash = toHex(await sha256(canonicalRequest))
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

    // Generate signature
    const signature = await generateSignature(stringToSign, dateStamp, region, service)

    // Build final URL
    const presignedUrl = `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`

    console.log(`[Server] Generated presigned URL for: ${s3Key}`)

    return NextResponse.json({
      success: true,
      presignedUrl,
      s3Key,
      bucket,
      region,
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
