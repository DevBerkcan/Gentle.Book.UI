// components/admin/links/LivePreviewPanel.tsx
// Desktop-only right-hand browser-chrome mockup with device-width toggle.
"use client";

import { ExternalLink, Loader2, Smartphone, Tablet, Monitor } from "lucide-react";
import type { PreviewDevice } from "./types";

const PREVIEW_DEVICE_STYLE: Record<PreviewDevice, { width: string; label: string }> = {
  mobile: { width: "390px", label: "Mobile" },
  tablet: { width: "768px", label: "Tablet" },
  desktop: { width: "100%", label: "Desktop" },
};

export function LivePreviewPanel({
  previewUrl, previewKey, previewDevice, setPreviewDevice, designSaving,
}: {
  previewUrl: string;
  previewKey: number;
  previewDevice: PreviewDevice;
  setPreviewDevice: (d: PreviewDevice) => void;
  designSaving: boolean;
}) {
  return (
    <div className="hidden lg:flex flex-col flex-1 bg-[#EDEDEE] p-6 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FC5F56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FDBC2C]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#29C940]" />
          </div>
          <div className="h-4 w-px bg-[#D1D5DB] mx-1" />
          <span className="text-xs font-semibold text-[#6B7280]">Live-Vorschau</span>
          {designSaving && <Loader2 size={11} className="animate-spin text-[#6355E4]" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-1">
            {([
              { v: "mobile", icon: Smartphone },
              { v: "tablet", icon: Tablet },
              { v: "desktop", icon: Monitor },
            ] as const).map(({ v, icon: Icon }) => (
              <button key={v} onClick={() => setPreviewDevice(v)} title={PREVIEW_DEVICE_STYLE[v].label}
                className={`p-1.5 rounded-lg transition-all ${
                  previewDevice === v ? "bg-[#EEEBFC] text-[#6355E4]" : "text-[#9CA3AF] hover:text-[#374151]"
                }`}>
                <Icon size={13} />
              </button>
            ))}
          </div>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#111318] transition-colors bg-white border border-[#E5E7EB] shadow-sm px-2.5 py-1.5 rounded-xl">
            <ExternalLink size={11} />Öffnen
          </a>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden bg-white shadow-xl border border-[#E5E7EB] flex flex-col">
        <div className="flex-shrink-0 h-9 bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center px-3 gap-2">
          <div className="flex-1 bg-white rounded-md h-5 flex items-center px-2 border border-[#E5E7EB]">
            <p className="text-[10px] text-[#9CA3AF] truncate font-mono">
              {typeof window !== "undefined" ? window.location.origin : ""}{previewUrl}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex justify-center bg-[#F7F7F8] transition-all duration-300">
          <div className="h-full overflow-hidden transition-all duration-300"
            style={{ width: PREVIEW_DEVICE_STYLE[previewDevice].width, maxWidth: "100%" }}>
            <iframe key={previewKey}
              src={`${previewUrl}?v=${previewKey}`}
              className="w-full h-full" style={{ border: "none", minHeight: "100%" }}
              title="Buchungsseite Vorschau" />
          </div>
        </div>
      </div>
    </div>
  );
}
