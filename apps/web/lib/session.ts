import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE } from "./constants"

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080"

export type SessionUser = {
  id: string
  email: string
  name: string
  groups: string[]
  permissions: string[]
}

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value
}

export async function getSession(): Promise<SessionUser | null> {
  const token = await getToken()
  if (!token) {
    return null
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as SessionUser
  } catch {
    return null
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}
