import { type NextRequest, NextResponse } from "next/server"

// Manual presigned URL generation for multipart upload parts

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
    const { uploadId, s3Key, partNumber } = await request.json()

    const bucket = process.env.AWS_S3_BUCKET!
    const region = process.env.AWS_REGION!
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID!
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!
    const sessionToken = process.env.AWS_SESSION_TOKEN

    console.log(`[v0] Signing part ${partNumber} for upload:`, uploadId)

    // AWS Signature V4 for presigned URL
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)
    const expiresIn = 3600

    const method = "PUT"
    const service = "s3"
    const host = `${bucket}.s3.${region}.amazonaws.com`
    const canonicalUri = `/${encodeURIComponent(s3Key).replace(/%2F/g, "/")}`

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const credential = `${accessKeyId}/${credentialScope}`

    const queryParams = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": credential,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": expiresIn.toString(),
      "X-Amz-SignedHeaders": "host",
      partNumber: partNumber.toString(),
      uploadId: uploadId,
    })

    if (sessionToken) {
      queryParams.set("X-Amz-Security-Token", sessionToken)
    }

    const canonicalQuerystring = queryParams.toString()
    const canonicalHeaders = `host:${host}\n`
    const signedHeaders = "host"

    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`

    const hashedCanonicalRequest = toHex(await sha256(canonicalRequest))
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashedCanonicalRequest}`

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = toHex(await hmacSha256(signingKey, stringToSign))

    const presignedUrl = `https://${host}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`

    return NextResponse.json({ presignedUrl })
  } catch (error: any) {
    console.error("[Server] Failed to sign part:", error.message)
    return NextResponse.json({ error: error.message || "Failed to sign part" }, { status: 500 })
  }
}
