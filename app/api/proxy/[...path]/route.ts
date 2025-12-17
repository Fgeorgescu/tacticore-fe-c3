import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://54.82.49.78:8080"

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type")
  let data: any

  if (contentType?.includes("application/json")) {
    data = await response.json()
  } else {
    const text = await response.text()
    // Si no es JSON, devolver como texto plano
    data = { message: text, raw: text }
  }

  return { data, status: response.status }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

    console.log("[v0] ===== PROXY GET REQUEST =====")
    console.log("[v0] Frontend request URL:", request.url)
    console.log("[v0] Backend target URL:", backendUrl)
    console.log("[v0] Method: GET")
    console.log("[v0] Search params:", searchParams || "(none)")

    const headers: Record<string, string> = {
      Accept: "*/*",
      "User-Agent": "curl/8.7.1", // Simular curl como en el ejemplo
    }

    console.log("[v0] Request headers:", JSON.stringify(headers, null, 2))
    console.log("[v0] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Backend response status:", status)
    console.log("[v0] Backend response data:", JSON.stringify(data, null, 2))
    console.log("[v0] ===== END PROXY GET REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] ===== PROXY GET ERROR =====")
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "N/A")
    console.error("[v0] ===== END PROXY GET ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/${path}`

    console.log("[v0] ===== PROXY POST REQUEST =====")
    console.log("[v0] Frontend request URL:", request.url)
    console.log("[v0] Backend target URL:", backendUrl)
    console.log("[v0] Method: POST")
    console.log("[v0] Request body:", JSON.stringify(body, null, 2))

    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "User-Agent": "curl/8.7.1",
    }

    console.log("[v0] Request headers:", JSON.stringify(headers, null, 2))
    console.log("[v0] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Backend response status:", status)
    console.log("[v0] Backend response data:", JSON.stringify(data, null, 2))
    console.log("[v0] ===== END PROXY POST REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] ===== PROXY POST ERROR =====")
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "N/A")
    console.error("[v0] ===== END PROXY POST ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/${path}`

    console.log("[v0] ===== PROXY PUT REQUEST =====")
    console.log("[v0] Frontend request URL:", request.url)
    console.log("[v0] Backend target URL:", backendUrl)
    console.log("[v0] Method: PUT")
    console.log("[v0] Request body:", JSON.stringify(body, null, 2))

    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "User-Agent": "curl/8.7.1",
    }

    console.log("[v0] Request headers:", JSON.stringify(headers, null, 2))
    console.log("[v0] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Backend response status:", status)
    console.log("[v0] Backend response data:", JSON.stringify(data, null, 2))
    console.log("[v0] ===== END PROXY PUT REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] ===== PROXY PUT ERROR =====")
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "N/A")
    console.error("[v0] ===== END PROXY PUT ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const backendUrl = `${BACKEND_URL}/${path}`

    console.log("[v0] ===== PROXY DELETE REQUEST =====")
    console.log("[v0] Frontend request URL:", request.url)
    console.log("[v0] Backend target URL:", backendUrl)
    console.log("[v0] Method: DELETE")

    const headers = {
      Accept: "*/*",
      "User-Agent": "curl/8.7.1",
    }

    console.log("[v0] Request headers:", JSON.stringify(headers, null, 2))
    console.log("[v0] Making request to backend...")

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers,
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Backend response status:", status)
    console.log("[v0] Backend response data:", JSON.stringify(data, null, 2))
    console.log("[v0] ===== END PROXY DELETE REQUEST =====")

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] ===== PROXY DELETE ERROR =====")
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "N/A")
    console.error("[v0] ===== END PROXY DELETE ERROR =====")

    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
