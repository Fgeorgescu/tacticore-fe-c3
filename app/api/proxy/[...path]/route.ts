export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = (process.env.BACKEND_URL || "http://54.82.49.78:8080").replace(/\/+$/, "")

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  let data: any

  if (contentType.includes("application/json")) {
    data = await response.json()
  } else {
    const text = await response.text()
    data = { message: text, raw: text }
  }

  return { data, status: response.status, headers: Object.fromEntries(response.headers.entries()) }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[v1] ===== PROXY GET REQUEST =====")
    console.log("[v1] Frontend request URL:", request.url)
    console.log("[v1] Backend target URL:", backendUrl)

    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      const kl = k.toLowerCase()
      if (!v) return
      if (["host", "connection", "content-length"].includes(kl)) return
      headers[k] = v
    })

    headers["Accept"] = headers["Accept"] || "*/*"
    headers["User-Agent"] = headers["User-Agent"] || "vercel-proxy/1.0"
    headers["X-Forwarded-Proto"] = "https" // Tell backend client used https
    headers["X-Forwarded-Host"] = request.headers.get("host") || headers["Host"] || ""

    try {
      const parsed = new URL(BACKEND_URL)
      headers["Host"] = parsed.hostname
    } catch (e) {
      headers["Host"] = "54.82.49.78"
    }

    console.log("[v1] Outbound headers to backend:", JSON.stringify(headers, null, 2))
    console.log("[v1] Making request to backend (redirect manual)...")

    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(no location header)"
      console.warn("[v1] Backend responded with redirect:", response.status, "Location:", location)
      return NextResponse.json(
        {
          debug: "backend_redirect",
          status: response.status,
          location,
          backendUrl,
          outboundHeaders: headers,
        },
        { status: 502 },
      )
    }

    const { data, status, headers: beHeaders } = await handleResponse(response)

    console.log("[v1] Backend response status:", status)
    console.log("[v1] Backend response headers (sample):", JSON.stringify(beHeaders, null, 2))
    console.log(
      "[v1] Backend response data (truncated):",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[v1] ===== END PROXY GET REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v1] ===== PROXY GET ERROR =====")
    console.error("[v1] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v1] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v1] Error stack:", error instanceof Error ? error.stack : "N/A")
    console.error("[v1] ===== END PROXY GET ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[v1] ===== PROXY POST REQUEST =====")
    console.log("[v1] Frontend request URL:", request.url)
    console.log("[v1] Backend target URL:", backendUrl)
    console.log("[v1] Request body:", JSON.stringify(body, null, 2))

    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      const kl = k.toLowerCase()
      if (!v) return
      if (["host", "connection", "content-length"].includes(kl)) return
      headers[k] = v
    })

    headers["Content-Type"] = "application/json"
    headers["Accept"] = headers["Accept"] || "*/*"
    headers["User-Agent"] = headers["User-Agent"] || "vercel-proxy/1.0"
    headers["X-Forwarded-Proto"] = "https"
    headers["X-Forwarded-Host"] = request.headers.get("host") || ""

    try {
      const parsed = new URL(BACKEND_URL)
      headers["Host"] = parsed.hostname
    } catch (e) {
      headers["Host"] = "54.82.49.78"
    }

    console.log("[v1] Outbound headers to backend:", JSON.stringify(headers, null, 2))
    console.log("[v1] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(no location header)"
      console.warn("[v1] Backend responded with redirect:", response.status, "Location:", location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl },
        { status: 502 },
      )
    }

    const { data, status } = await handleResponse(response)
    console.log("[v1] Backend response status:", status)
    console.log(
      "[v1] Backend response data (truncated):",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[v1] ===== END PROXY POST REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v1] ===== PROXY POST ERROR =====")
    console.error("[v1] Error:", error)
    console.error("[v1] ===== END PROXY POST ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[v1] ===== PROXY PUT REQUEST =====")
    console.log("[v1] Frontend request URL:", request.url)
    console.log("[v1] Backend target URL:", backendUrl)
    console.log("[v1] Request body:", JSON.stringify(body, null, 2))

    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      const kl = k.toLowerCase()
      if (!v) return
      if (["host", "connection", "content-length"].includes(kl)) return
      headers[k] = v
    })

    headers["Content-Type"] = "application/json"
    headers["Accept"] = headers["Accept"] || "*/*"
    headers["User-Agent"] = headers["User-Agent"] || "vercel-proxy/1.0"
    headers["X-Forwarded-Proto"] = "https"
    headers["X-Forwarded-Host"] = request.headers.get("host") || ""

    try {
      const parsed = new URL(BACKEND_URL)
      headers["Host"] = parsed.hostname
    } catch (e) {
      headers["Host"] = "54.82.49.78"
    }

    console.log("[v1] Outbound headers to backend:", JSON.stringify(headers, null, 2))
    console.log("[v1] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(no location header)"
      console.warn("[v1] Backend responded with redirect:", response.status, "Location:", location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl },
        { status: 502 },
      )
    }

    const { data, status } = await handleResponse(response)
    console.log("[v1] Backend response status:", status)
    console.log(
      "[v1] Backend response data (truncated):",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[v1] ===== END PROXY PUT REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v1] ===== PROXY PUT ERROR =====")
    console.error("[v1] Error:", error)
    console.error("[v1] ===== END PROXY PUT ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = (params.path || []).join("/")
    const backendUrl = `${BACKEND_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1")

    console.log("[v1] ===== PROXY DELETE REQUEST =====")
    console.log("[v1] Frontend request URL:", request.url)
    console.log("[v1] Backend target URL:", backendUrl)

    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      const kl = k.toLowerCase()
      if (!v) return
      if (["host", "connection", "content-length"].includes(kl)) return
      headers[k] = v
    })

    headers["Accept"] = headers["Accept"] || "*/*"
    headers["User-Agent"] = headers["User-Agent"] || "vercel-proxy/1.0"
    headers["X-Forwarded-Proto"] = "https"
    headers["X-Forwarded-Host"] = request.headers.get("host") || ""

    try {
      const parsed = new URL(BACKEND_URL)
      headers["Host"] = parsed.hostname
    } catch (e) {
      headers["Host"] = "54.82.49.78"
    }

    console.log("[v1] Outbound headers to backend:", JSON.stringify(headers, null, 2))
    console.log("[v1] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers,
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "(no location header)"
      console.warn("[v1] Backend responded with redirect:", response.status, "Location:", location)
      return NextResponse.json(
        { debug: "backend_redirect", status: response.status, location, backendUrl },
        { status: 502 },
      )
    }

    const { data, status, headers: beHeaders } = await handleResponse(response)
    console.log("[v1] Backend response status:", status)
    console.log("[v1] Backend response headers (sample):", JSON.stringify(beHeaders, null, 2))
    console.log(
      "[v1] Backend response data (truncated):",
      typeof data === "object" ? JSON.stringify(data).slice(0, 1000) : String(data).slice(0, 1000),
    )
    console.log("[v1] ===== END PROXY DELETE REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v1] ===== PROXY DELETE ERROR =====")
    console.error("[v1] Error:", error)
    console.error("[v1] ===== END PROXY DELETE ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
