const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  token: string | undefined,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? body.title ?? detail;
    } catch {
      /* keep status text */
    }
    throw new Error(`Backend ${response.status}: ${detail}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function backendUrl() {
  return BACKEND_URL;
}
