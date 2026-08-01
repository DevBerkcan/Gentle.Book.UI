// components/admin/links/BookingFlowOptions.tsx
// "Erweiterte Design-Optionen" → Buchungsflow gestalten: Hintergrund, Service-Ansicht, Preise, Badge.
"use client";

import { Calendar, LayoutList, LayoutGrid, Sparkles } from "lucide-react";
import { SectionLabel, OptionPill, Toggle } from "./shared";
import type { LinktreeConfig } from "./types";

export function BookingFlowOptions({
  config, primaryColor, updateConfig, inputCls,
}: {
  config: LinktreeConfig;
  primaryColor: string;
  updateConfig: (field: keyof LinktreeConfig, value: string | boolean | undefined) => void;
  inputCls: string;
}) {
  return (
    <div className="border-t border-[#F3F4F6] pt-5">
      <SectionLabel icon={<Calendar size={13} />}>Buchungsflow gestalten</SectionLabel>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Buchungs-Hintergrund</p>
          <div className="flex gap-2">
            {([
              { v: "light", label: "Hell", cls: "bg-gradient-to-br from-[#F3F4F6] to-white" },
              { v: "dark", label: "Dunkel", cls: "" },
              { v: "branded", label: "Branded", cls: "" },
            ] as const).map(({ v, label, cls }) => (
              <button key={v} onClick={() => updateConfig("bookingTheme", v)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 border rounded-xl text-xs font-medium transition-all ${
                  (config.bookingTheme ?? "light") === v
                    ? "border-[#A5B4FC] bg-[#EEEBFC] text-[#6355E4]"
                    : "border-[#E5E7EB] text-[#6B7280] bg-white hover:border-[#C7D2FE]"
                }`}
              >
                <div className={`w-11 h-5 rounded-lg border border-[#E5E7EB] ${cls}`}
                  style={v === "dark" ? { background: "linear-gradient(135deg, #1a1a2e, #0f3460)" }
                    : v === "branded" ? { background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` } : {}} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Service-Ansicht</p>
          <div className="flex gap-2">
            <OptionPill active={(config.serviceLayout ?? "list") === "list"} onClick={() => updateConfig("serviceLayout", "list")} className="flex-1 justify-center gap-2 flex items-center">
              <LayoutList size={13} />Liste
            </OptionPill>
            <OptionPill active={(config.serviceLayout ?? "list") === "cards"} onClick={() => updateConfig("serviceLayout", "cards")} className="flex-1 justify-center gap-2 flex items-center">
              <LayoutGrid size={13} />Karten
            </OptionPill>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-3.5 bg-[#F7F7F8] rounded-xl border border-[#F3F4F6]">
          <div>
            <p className="text-xs font-semibold text-[#111318]">Preise anzeigen</p>
            <p className="text-[10px] text-[#9CA3AF]">Im Service-Schritt des Buchungsflows</p>
          </div>
          <Toggle on={config.showPrices ?? true} onToggle={() => updateConfig("showPrices", !(config.showPrices ?? true))} />
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
            <Sparkles size={11} className="text-[#6355E4]" />Button-Badge <span className="text-[#9CA3AF] font-normal">(optional)</span>
          </p>
          <input type="text" value={config.ctaBadge ?? ""}
            onChange={(e) => updateConfig("ctaBadge", e.target.value)}
            placeholder='z.B. "Kostenlos" oder "Neu"'
            className={inputCls} />
          <p className="text-[10px] text-[#9CA3AF] mt-1.5">Erscheint als kleines Badge am Buchungsbutton</p>
        </div>
      </div>
    </div>
  );
}
