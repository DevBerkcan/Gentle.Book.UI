// components/admin/links/LinksPageHeader.tsx
"use client";

import { Sparkles, QrCode, Eye, ExternalLink, Plus } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SaveStatusChip } from "./SaveStatusChip";
import type { SaveStatus } from "./types";

export function LinksPageHeader({
  tenantSlug, saveStatus, onRetrySave, onShowQr, onShowPreviewModal, onAddLink,
}: {
  tenantSlug: string | null;
  saveStatus: SaveStatus;
  onRetrySave: () => void;
  onShowQr: () => void;
  onShowPreviewModal: () => void;
  onAddLink: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 mb-7">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">Meine Links</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#6355E4] text-white px-2.5 py-0.5 rounded-full">
              <Sparkles size={8} />Live
            </span>
          </div>
          <p className="text-sm text-[#6B7280]">Profil & Design deiner öffentlichen Buchungsseite</p>
        </div>
        <div className="flex items-center gap-2">
          {tenantSlug && (
            <button onClick={onShowQr}
              className="flex items-center gap-1.5 text-sm bg-white text-[#374151] px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:text-[#6355E4] transition-all">
              <QrCode size={14} /><span className="hidden sm:inline">QR-Code</span>
            </button>
          )}
          {tenantSlug && (
            <>
              <button onClick={onShowPreviewModal}
                className="flex items-center gap-1.5 text-sm bg-white text-[#374151] px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:text-[#6355E4] transition-all lg:hidden">
                <Eye size={14} /><span className="hidden sm:inline">Vorschau</span>
              </button>
              <a href={`/booking/${tenantSlug}`} target="_blank" rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-sm bg-white text-[#374151] px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:text-[#6355E4] transition-all">
                <ExternalLink size={14} />Seite öffnen
              </a>
            </>
          )}
          <ShimmerButton
            onClick={onAddLink}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[#6355E4] text-white hover:bg-[#4338CA]"
            shimmerDuration="2.5s"
          >
            <Plus size={15} />Link hinzufügen
          </ShimmerButton>
        </div>
      </div>
      <SaveStatusChip status={saveStatus} onRetry={onRetrySave} />
    </div>
  );
}
