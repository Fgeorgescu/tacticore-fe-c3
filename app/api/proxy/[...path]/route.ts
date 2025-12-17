export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = (process.env.BACKEND_URL || "http://54.82.49.78:8080").replace(/\/+$/, "")

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return {
      data: await response.json(),
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    }
  }
  const text = await response.text()
  return {
    data: { message: text, raw: text },
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  }
}

function buildHeaders(request: NextRequest, includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {}

  // Copy incoming headers, filtering dangerous ones
  request.headers.forEach((v, k) => {
    const kl = k.toLowerCase()
    if (!v) return
    if (["connection", "content-length"].includes(kl)) return
    headers[k] = v
  })

  // Override and augment headers
  headers["Accept"] = headers["Accept"] || "*/*"
  headers["User-Agent"] = headers["User-Agent"] || "vercel-proxy/1.0"

  headers["X-Forwarded-Proto"] = "https"
  headers["X-Forwarded-Host"] = request.headers.get("host") || headers["X-Forwarded-Host"] || ""

  const incomingXff = request.headers.get("x-forwarded-for") || ""
  headers["X-Forwarded-For"] = incomingXff ? `${incomingXff}, 76.76.21.21` : "76.76.21.21"

  headers["X-Forwarded-Ssl"] = "on"
  headers["Front-End-Https"] = "on"
  headers["X-Url-Scheme"] = "https"

  try {
    const parsed = new URL(BACKEND_URL)
    headers["Host"] = parsed.port ? `${parsed.hostname}:${parsed.port}` : parsed.hostname
  } catch (e) {
    headers["Host"] = headers["Host"] || "54.82.49.78:8080"
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[proxy] ===== GET REQUEST =====")
    console.log("[proxy] Frontend URL:", request.url)
    console.log("[proxy] Backend URL:", backendUrl)

    const headers = buildHeaders(request)
    console.log("[proxy] Outbound headers:", JSON.stringify(headers, null, 2))

    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(none)"
      console.warn("[proxy] Backend redirect:", response.status, location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl, outboundHeaders: headers },
        { status: 502 },
      )
    }

    const { data, status, headers: beHeaders } = await handleResponse(response)

    console.log("[proxy] Backend status:", status)
    console.log("[proxy] Backend headers sample:", JSON.stringify(beHeaders, null, 2))
    console.log(
      "[proxy] Backend data sample:",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[proxy] ===== END GET REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (err) {
    console.error("[proxy] GET error", err)
    return NextResponse.json(
      { error: "proxy_failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[proxy] ===== POST REQUEST =====")
    console.log("[proxy] Frontend URL:", request.url)
    console.log("[proxy] Backend URL:", backendUrl)
    console.log("[proxy] Request body:", JSON.stringify(body, null, 2))

    const headers = buildHeaders(request, true)
    console.log("[proxy] Outbound headers:", JSON.stringify(headers, null, 2))

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(none)"
      console.warn("[proxy] Backend redirect:", response.status, location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl },
        { status: 502 },
      )
    }

    const { data, status } = await handleResponse(response)
    console.log("[proxy] Backend status:", status)
    console.log(
      "[proxy] Backend data sample:",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[proxy] ===== END POST REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (err) {
    console.error("[proxy] POST error", err)
    return NextResponse.json(
      { error: "proxy_failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[proxy] ===== PUT REQUEST =====")
    console.log("[proxy] Frontend URL:", request.url)
    console.log("[proxy] Backend URL:", backendUrl)
    console.log("[proxy] Request body:", JSON.stringify(body, null, 2))

    const headers = buildHeaders(request, true)
    console.log("[proxy] Outbound headers:", JSON.stringify(headers, null, 2))

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(none)"
      console.warn("[proxy] Backend redirect:", response.status, location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl },
        { status: 502 },
      )
    }

    const { data, status } = await handleResponse(response)
    console.log("[proxy] Backend status:", status)
    console.log(
      "[proxy] Backend data sample:",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[proxy] ===== END PUT REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (err) {
    console.error("[proxy] PUT error", err)
    return NextResponse.json(
      { error: "proxy_failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const backendUrl = `${BACKEND_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[proxy] ===== DELETE REQUEST =====")
    console.log("[proxy] Frontend URL:", request.url)
    console.log("[proxy] Backend URL:", backendUrl)

    const headers = buildHeaders(request)
    console.log("[proxy] Outbound headers:", JSON.stringify(headers, null, 2))

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers,
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(none)"
      console.warn("[proxy] Backend redirect:", response.status, location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl },
        { status: 502 },
      )
    }

    const { data, status } = await handleResponse(response)
    console.log("[proxy] Backend status:", status)
    console.log(
      "[proxy] Backend data sample:",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[proxy] ===== END DELETE REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (err) {
    console.error("[proxy] DELETE error", err)
    return NextResponse.json(
      { error: "proxy_failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
