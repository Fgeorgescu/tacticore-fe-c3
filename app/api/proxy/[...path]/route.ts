import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "http://54.82.49.78:8080"

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type")
  let data: any

  if (contentType?.includes("application/json")) {
    data = await response.json()
  } else {
    const text = await response.text()
    console.log("[v0] Proxy non-JSON response:", text)
    data = { message: text, raw: text }
  }

  return { data, status: response.status }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

    console.log("[v0] Proxy GET:", backendUrl)

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Proxy GET response:", { status, data })

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] Proxy GET error:", error)
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

    console.log("[v0] Proxy POST:", backendUrl, body)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Proxy POST response:", { status, data })

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] Proxy POST error:", error)
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

    console.log("[v0] Proxy PUT:", backendUrl, body)

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Proxy PUT response:", { status, data })

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] Proxy PUT error:", error)
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

    console.log("[v0] Proxy DELETE:", backendUrl)

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const { data, status } = await handleResponse(response)
    console.log("[v0] Proxy DELETE response:", { status, data })

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error("[v0] Proxy DELETE error:", error)
    return NextResponse.json(
      { error: "Proxy request failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
