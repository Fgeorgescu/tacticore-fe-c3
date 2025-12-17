export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import https from "https"
import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "https://54.163.64.8:8443"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

async function handleRequest(req: NextRequest, method: string) {
  try {
    const { pathname, search } = new URL(req.url)
    const path = pathname.replace("/api/proxy", "")
    const backendUrl = `${BACKEND_URL}${path}${search}`

    console.log(`[v0] Proxy ${method} request to: ${backendUrl}`)

    const headers: Record<string, string> = {
      Accept: "*/*",
      "User-Agent": "curl/8.7.1",
    }

    const contentType = req.headers.get("content-type")
    if (contentType) {
      headers["Content-Type"] = contentType
    }

    const options: RequestInit = {
      method,
      headers,
      // @ts-ignore - Node.js fetch acepta agent
      agent: httpsAgent,
    }

    if (method !== "GET" && method !== "HEAD") {
      const body = await req.text()
      if (body) {
        options.body = body
        console.log(`[v0] Request body:`, body.substring(0, 200))
      }
    }

    console.log(`[v0] Request headers:`, headers)

    const response = await fetch(backendUrl, options)

    console.log(`[v0] Backend response status: ${response.status}`)

    const responseText = await response.text()
    console.log(`[v0] Backend response body:`, responseText.substring(0, 200))

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    return NextResponse.json(responseData, { status: response.status })
  } catch (error: any) {
    console.error(`[v0] Proxy ${method} error:`, {
      type: error?.constructor?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.split("\n").slice(0, 3),
    })
    return NextResponse.json({ error: "Proxy request failed", details: error?.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req, "GET")
}

export async function POST(req: NextRequest) {
  return handleRequest(req, "POST")
}

export async function PUT(req: NextRequest) {
  return handleRequest(req, "PUT")
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req, "DELETE")
}

export async function PATCH(req: NextRequest) {
  return handleRequest(req, "PATCH")
}
