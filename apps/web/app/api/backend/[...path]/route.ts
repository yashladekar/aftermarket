import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE } from "@/lib/constants"
import { BACKEND_URL } from "@/lib/session"

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { path } = await context.params
  const segments = path[0] === "api" ? path.slice(1) : path
  const target = `${BACKEND_URL}/api/${segments.join("/")}${request.nextUrl.search}`

  const headers = new Headers()
  headers.set("Authorization", `Bearer ${token}`)
  const contentType = request.headers.get("content-type")
  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  })

  const responseHeaders = new Headers()
  const responseType = response.headers.get("content-type")
  if (responseType) {
    responseHeaders.set("Content-Type", responseType)
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const PATCH = forward
export const DELETE = forward
