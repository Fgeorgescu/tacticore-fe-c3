export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "https://54.163.64.8:8443"

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

    let body: string | undefined
    if (method !== "GET" && method !== "HEAD") {
      body = await req.text()
      if (body) {
        console.log(`[v0] Request body:`, body.substring(0, 200))
      }
    }

    console.log(`[v0] Request headers:`, headers)

    let response
    try {
      // Configuración para ignorar certificados SSL auto-firmados
      const fetchOptions: any = {
        method,
        headers,
      }

      if (body) {
        fetchOptions.body = body
      }

      // Next.js usa undici internamente, que no soporta el agente HTTPS de Node.js directamente
      // Vamos a intentar con variable de entorno NODE_TLS_REJECT_UNAUTHORIZED
      const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

      console.log(`[v0] Attempting fetch with TLS verification disabled`)

      response = await fetch(backendUrl, fetchOptions)

      // Restaurar el valor original
      if (originalTlsReject !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
      }

      console.log(`[v0] Backend response status: ${response.status}`)
    } catch (fetchError: any) {
      // Restaurar en caso de error
      const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED
      if (originalTlsReject !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
      }

      console.error(`[v0] Fetch error details:`, {
        type: fetchError?.constructor?.name,
        message: fetchError?.message,
        code: fetchError?.code,
        errno: fetchError?.errno,
        syscall: fetchError?.syscall,
        cause: fetchError?.cause?.toString(),
      })
      throw fetchError
    }

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
      errno: error?.errno,
      syscall: error?.syscall,
    })
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error?.message,
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
