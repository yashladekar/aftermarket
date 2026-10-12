"use client";

import { useCallback } from "react";
import { backendPath } from "@/lib/constants";

export function useApi() {
  const request = useCallback(
    async <T>(path: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers);
      if (!(init.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
      const response = await fetch(backendPath(path), { ...init, headers });
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
    },
    []
  );

  return { request };
}
