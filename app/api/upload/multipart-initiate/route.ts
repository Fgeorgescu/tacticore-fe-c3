import { type NextRequest, NextResponse } from "next/server"

// Manual implementation of multipart upload initiation using AWS Signature V4

async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return await crypto.subtle.digest("SHA-256", encoder.encode(message))
}

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const encoder = new TextEncoder()
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message))
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  return await hmacSha256(kService, "aws4_request")
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, contentType } = await request.json()

    const bucket = process.env.AWS_S3_BUCKET!
    const region = process.env.AWS_REGION!
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID!
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!
    const sessionToken = process.env.AWS_SESSION_TOKEN

    const timestamp = Date.now()
    const s3Key = `uploads/${fileType}/${timestamp}-${fileName}`

    console.log("[v0] Initiating multipart upload for:", s3Key)

    // AWS Signature V4
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)

    const method = "POST"
    const service = "s3"
    const host = `${bucket}.s3.${region}.amazonaws.com`
    const canonicalUri = `/${encodeURIComponent(s3Key).replace(/%2F/g, "/")}`
    const canonicalQuerystring = "uploads="

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n${sessionToken ? `x-amz-security-token:${sessionToken}\n` : ""}`
    const signedHeaders = sessionToken
      ? "host;x-amz-content-sha256;x-amz-date;x-amz-security-token"
      : "host;x-amz-content-sha256;x-amz-date"

    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const hashedCanonicalRequest = toHex(await sha256(canonicalRequest))
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashedCanonicalRequest}`

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = toHex(await hmacSha256(signingKey, stringToSign))

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    // Make request to S3
    const url = `https://${host}${canonicalUri}?uploads=`
    const headers: Record<string, string> = {
      "x-amz-date": amzDate,
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      Authorization: authorizationHeader,
    }
    if (sessionToken) {
      headers["x-amz-security-token"] = sessionToken
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 responded with ${response.status}: ${errorText}`)
    }

    const xmlText = await response.text()
    const uploadIdMatch = xmlText.match(/<UploadId>([^<]+)<\/UploadId>/)
    const uploadId = uploadIdMatch ? uploadIdMatch[1] : null

    if (!uploadId) {
      throw new Error("Failed to parse UploadId from S3 response")
    }

    console.log("[v0] Multipart upload initiated:", uploadId)

    return NextResponse.json({
      uploadId,
      s3Key,
      bucket,
      region,
    })
  } catch (error: any) {
    console.error("[Server] Failed to initiate multipart upload:", error.message)
    return NextResponse.json({ error: error.message || "Failed to initiate multipart upload" }, { status: 500 })
  }
}
