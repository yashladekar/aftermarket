"use client";

import { useCallback } from "react";
import { backendPath } from "@/lib/constants";
import type { CcrRow } from "@/lib/ccr-data";

export type BackendCcrRow = {
  reference: string;
  status: string;
  vendorCode: string;
  vendorName: string;
  signoffLevel: string;
  dateRequested: string | null;
  lastUpdated: string | null;
  recentUpdate: string;
  netPriceChange: boolean;
  leadTimeChange: boolean;
  moqChange: boolean;
  atb: boolean;
  bb: boolean;
  missingRefData: boolean;
  supplyOk: boolean;
  priority: string;
  ccrType: string;
  kind: string;
  partRefs: string[];
  vendorCodes: string[];
};

export type BackendCcrDetail = BackendCcrRow & {
  justification: string;
  onBehalfReason: string;
  workflowInstanceId: string | null;
  workflowState: string | null;
  currentTaskKey: string | null;
  payload: Record<string, unknown>;
  attachments: {
    name?: string;
    fileType?: string;
    vendorCode?: string;
    partNumbers?: string[];
  }[];
};

export type CcrWizardPayload = {
  kind: string;
  vendors: { code: string; name: string }[];
  parts: string[];
  partRows: {
    partNumber: string;
    newNetPrice: string;
    newPer: string;
    newMoq: string;
    newOrderMultiple: string;
    newLeadTime: string;
    buyingType: string;
    buyingTypeQty: string;
    startDate: string;
  }[];
  justification: string;
  documents: {
    name: string;
    fileType: string;
    vendorCode: string;
    partNumbers: string[];
  }[];
  stakeholders: {
    contactType: string;
    name: string;
    email: string;
    vendorCodes: string[];
  }[];
  onBehalfReason: string;
  priority: string;
};

function toCcrRow(c: BackendCcrRow): CcrRow {
  const priority =
    c.priority === "High" || c.priority === "Medium" || c.priority === "Low"
      ? c.priority
      : "Medium";
  return {
    reference: c.reference,
    status: c.status,
    vendorCode: c.vendorCode,
    vendorName: c.vendorName,
    signoffLevel: c.signoffLevel,
    dateRequested: c.dateRequested ?? new Date().toISOString().slice(0, 10),
    lastUpdated: c.lastUpdated ?? c.dateRequested ?? new Date().toISOString().slice(0, 10),
    recentUpdate: c.recentUpdate,
    netPriceChange: c.netPriceChange,
    leadTimeChange: c.leadTimeChange,
    moqChange: c.moqChange,
    atb: c.atb,
    bb: c.bb,
    missingRefData: c.missingRefData,
    supplyOk: c.supplyOk,
    priority,
    ccrType: c.ccrType,
    partRefs: c.partRefs ?? [],
  };
}

export function useCcrApi() {
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

  const listCcrs = useCallback(
    (params: URLSearchParams) =>
      request<BackendCcrRow[]>(`/ccrs?${params.toString()}`).then((rows) =>
        rows.map(toCcrRow)
      ),
    [request]
  );

  const getCcr = useCallback(
    (reference: string) => request<BackendCcrDetail>(`/ccrs/${reference}`),
    [request]
  );

  const createCcr = useCallback(
    (payload: CcrWizardPayload) =>
      request<BackendCcrDetail>("/ccrs", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    [request]
  );

  const submitCcr = useCallback(
    (reference: string) =>
      request<BackendCcrDetail>(`/ccrs/${encodeURIComponent(reference)}/submit`, {
        method: "POST",
      }),
    [request]
  );

  return { request, listCcrs, getCcr, createCcr, submitCcr, toCcrRow };
}
