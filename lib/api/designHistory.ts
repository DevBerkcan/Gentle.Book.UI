// lib/api/designHistory.ts
// Typed client for the booking-page design undo history (api/tenant/design-history/*).
// Every design-editor save (app/admin/links/page.tsx -> saveDesign) snapshots the PREVIOUS
// design server-side before overwriting it, so the admin can always come back to an earlier
// version instead of a change being a one-way trip.
import api from "@/lib/api/client";

export interface DesignHistoryEntry {
  id: string;
  createdAt: string;
  primaryColor: string;
  linktreeStyle: string | null;
  pageTemplate: string | null;
}

export interface RestoredDesign {
  message: string;
  primaryColor: string;
  linktreeStyle: string;
  linktreeConfig: string;
}

export async function getDesignHistory(): Promise<DesignHistoryEntry[]> {
  const res = await api.get("/tenant/design-history");
  return (res.data?.data ?? []) as DesignHistoryEntry[];
}

export async function restoreDesignVersion(id: string): Promise<RestoredDesign> {
  const res = await api.post(`/tenant/design-history/${id}/restore`);
  return res.data as RestoredDesign;
}
