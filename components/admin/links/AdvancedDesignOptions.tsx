// components/admin/links/AdvancedDesignOptions.tsx
// Collapsible "Erweiterte Design-Optionen" toggle + its three sub-sections.
"use client";

import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { TemplateFineTuning } from "./TemplateFineTuning";
import { AppearanceOptions } from "./AppearanceOptions";
import { BookingFlowOptions } from "./BookingFlowOptions";
import { COLOR_PALETTES } from "./constants";
import type { LinktreeConfig, Theme } from "./types";

export function AdvancedDesignOptions({
  open, onToggle, config, theme, primaryColor, industryType,
  updateConfig, updateTheme, updateColor, applyColorScheme, applyPreset, inputCls,
}: {
  open: boolean;
  onToggle: () => void;
  config: LinktreeConfig;
  theme: Theme;
  primaryColor: string;
  industryType: string;
  updateConfig: (field: keyof LinktreeConfig, value: string | boolean | undefined) => void;
  updateTheme: (t: Theme) => void;
  updateColor: (c: string) => void;
  applyColorScheme: (palette: typeof COLOR_PALETTES[number]) => void;
  applyPreset: (key: string) => void;
  inputCls: string;
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] hover:border-[#C7D2FE] transition-all"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
          <SlidersHorizontal size={13} className="text-[#6355E4]" />
          Erweiterte Design-Optionen
          <span className="text-[10px] font-normal text-[#9CA3AF]">Feintuning · Schrift · Layout · Buchungsflow</span>
        </span>
        <ChevronDown size={14} className={`text-[#9CA3AF] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <TemplateFineTuning config={config} updateConfig={updateConfig} />
          <AppearanceOptions
            config={config} theme={theme} primaryColor={primaryColor} industryType={industryType}
            updateConfig={updateConfig} updateTheme={updateTheme} updateColor={updateColor}
            applyColorScheme={applyColorScheme} applyPreset={applyPreset}
          />
          <BookingFlowOptions config={config} primaryColor={primaryColor} updateConfig={updateConfig} inputCls={inputCls} />
        </>
      )}
    </>
  );
}
