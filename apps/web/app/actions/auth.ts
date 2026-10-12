"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants"
import { BACKEND_URL } from "@/lib/session"

export type LoginState = { error: string } | null

export async function loginAction(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  let token: string | undefined
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
    if (response.ok) {
      const data = (await response.json()) as { token?: string }
      token = data.token
    }
  } catch {
    return { error: "Could not reach the NEO backend. Try again." }
  }

  if (!token) {
    return { error: "Invalid email or password." }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  redirect("/")
}

export async function logoutAction(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    } catch {
      /* best-effort audit trail only: the JWT is stateless */
    }
  }

  store.delete(SESSION_COOKIE)
  redirect("/login")
}
