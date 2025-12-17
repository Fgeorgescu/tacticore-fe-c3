import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "https://54.82.49.7:8080"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

    console.log(`[v0] Proxy GET: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log(`[v0] Proxy GET response status: ${response.status}`)

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      console.log(`[v0] Proxy GET non-JSON response: ${text}`)
      return NextResponse.json({ error: text }, { status: response.status })
    }
  } catch (error) {
    console.error("[v0] Proxy GET error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const url = `${BACKEND_URL}/${path}`
    const body = await request.json()

    console.log(`[v0] Proxy POST: ${url}`, body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log(`[v0] Proxy POST response status: ${response.status}`)

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      console.log(`[v0] Proxy POST non-JSON response: ${text}`)
      return NextResponse.json({ error: text }, { status: response.status })
    }
  } catch (error) {
    console.error("[v0] Proxy POST error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const url = `${BACKEND_URL}/${path}`

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

    console.log(`[v0] Proxy DELETE response status: ${response.status}`)

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      console.log(`[v0] Proxy DELETE non-JSON response: ${text}`)
      return NextResponse.json({ error: text }, { status: response.status })
    }
  } catch (error) {
    console.error("[v0] Proxy DELETE error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join("/")
    const url = `${BACKEND_URL}/${path}`
    const body = await request.json()

    console.log(`[v0] Proxy PUT: ${url}`, body)

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log(`[v0] Proxy PUT response status: ${response.status}`)

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      console.log(`[v0] Proxy PUT non-JSON response: ${text}`)
      return NextResponse.json({ error: text }, { status: response.status })
    }
  } catch (error) {
    console.error("[v0] Proxy PUT error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: String(error) }, { status: 500 })
  }
}
