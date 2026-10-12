"use client";

import { useEffect, useState } from "react";
import {
  vendorCatalog as localVendors,
  vendorPartsCatalog as localParts,
  type VendorOption,
  type VendorPart,
} from "@/lib/ccr-data";
import { useCcrApi } from "@/lib/ccr-api";

export function useCcrCatalog() {
  const { request } = useCcrApi();
  const [vendors, setVendors] = useState<VendorOption[]>(localVendors);
  const [parts, setParts] = useState<VendorPart[]>(localParts);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [remoteVendors, remoteParts] = await Promise.all([
          request<VendorOption[]>("/ccrs/catalog/vendors"),
          request<VendorPart[]>("/ccrs/catalog/parts"),
        ]);
        if (!cancelled) {
          if (remoteVendors?.length) setVendors(remoteVendors);
          if (remoteParts?.length) setParts(remoteParts);
        }
      } catch {
        /* offline: local fallback stays */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [request]);

  return { vendors, parts };
}
