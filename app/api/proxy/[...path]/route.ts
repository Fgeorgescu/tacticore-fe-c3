import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "http://54.82.49.7:8080"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BACKEND_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`

    console.log(`[v0] Proxy GET: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    console.log(`[v0] Proxy GET response status: ${response.status}`)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[v0] Proxy GET error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const url = `${BACKEND_URL}/api/${path}`
    const body = await request.json()

    console.log(`[v0] Proxy POST: ${url}`, body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log(`[v0] Proxy POST response status: ${response.status}`)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[v0] Proxy POST error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const url = `${BACKEND_URL}/api/${path}`

    console.log(`[v0] Proxy DELETE: ${url}`)

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    console.log(`[v0] Proxy DELETE response status: ${response.status}`)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[v0] Proxy DELETE error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const url = `${BACKEND_URL}/api/${path}`
    const body = await request.json()

    console.log(`[v0] Proxy PUT: ${url}`, body)

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log(`[v0] Proxy PUT response status: ${response.status}`)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[v0] Proxy PUT error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}
