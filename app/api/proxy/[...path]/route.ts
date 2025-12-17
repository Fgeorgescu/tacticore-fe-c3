export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import https from "node:https"

const BACKEND_HOST = "54.163.64.8"
const BACKEND_PORT = 8443

async function makeHttpsRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ status: number; data: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path,
      method,
      headers,
      rejectUnauthorized: false, // Acepta certificados auto-firmados
    }

    console.log(`[v0] Making HTTPS request to: https://${BACKEND_HOST}:${BACKEND_PORT}${path}`)
    console.log(`[v0] Request options:`, { method, headers })

    const req = https.request(options, (res) => {
      console.log(`[v0] Backend response status: ${res.statusCode}`)
      console.log(`[v0] Backend response headers:`, res.headers)

      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        console.log(`[v0] Backend response body:`, data.substring(0, 500))
        resolve({
          status: res.statusCode || 500,
          data,
          headers: res.headers as Record<string, string>,
        })
      })
    })

    req.on("error", (error) => {
      console.error(`[v0] HTTPS request error:`, {
        type: error?.constructor?.name,
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
        syscall: (error as any).syscall,
      })
      reject(error)
    })

    req.on("timeout", () => {
      console.error(`[v0] Request timeout`)
      req.destroy()
      reject(new Error("Request timeout"))
    })

    req.setTimeout(30000) // 30 segundos timeout

    if (body) {
      console.log(`[v0] Writing request body:`, body.substring(0, 200))
      req.write(body)
    }

    req.end()
  })
}

async function handleRequest(req: NextRequest, method: string) {
  try {
    const { pathname, search } = new URL(req.url)
    const path = pathname.replace("/api/proxy", "") + search

    console.log(`[v0] Proxy ${method} request - Path: ${path}`)

    const headers: Record<string, string> = {
      Accept: "*/*",
      "User-Agent": "curl/8.7.1",
      Host: `${BACKEND_HOST}:${BACKEND_PORT}`,
    }

    const contentType = req.headers.get("content-type")
    if (contentType) {
      headers["Content-Type"] = contentType
    }

    let body: string | undefined
    if (method !== "GET" && method !== "HEAD") {
      body = await req.text()
      if (body) {
        headers["Content-Length"] = Buffer.byteLength(body).toString()
      }
    }

    const response = await makeHttpsRequest(method, path, headers, body)

    let responseData
    try {
      responseData = JSON.parse(response.data)
    } catch {
      responseData = response.data
    }

    return NextResponse.json(responseData, { status: response.status })
  } catch (error: any) {
    console.error(`[v0] Proxy ${method} error:`, {
      type: error?.constructor?.name,
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      syscall: error?.syscall,
      stack: error?.stack,
    })
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error?.message || "Unknown error",
        code: error?.code,
        syscall: error?.syscall,
      },
      { status: 500 },
    )
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
