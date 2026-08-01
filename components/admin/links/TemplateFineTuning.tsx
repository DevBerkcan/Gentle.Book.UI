// components/admin/links/TemplateFineTuning.tsx
// "Erweiterte Design-Optionen" → Template-Feintuning: Hero-Stil, Bild/Logo-Größe,
// Button-Abstände, Karten-Dichte, Animation, Startbereich.
"use client";

import { SlidersHorizontal } from "lucide-react";
import { SectionLabel, OptionPill } from "./shared";
import type { LinktreeConfig } from "./types";

export function TemplateFineTuning({
  config, updateConfig,
}: {
  config: LinktreeConfig;
  updateConfig: (field: keyof LinktreeConfig, value: string | boolean | undefined) => void;
}) {
  return (
    <div className="border-t border-[#F3F4F6] pt-5">
      <SectionLabel icon={<SlidersHorizontal size={13} />}>Template-Feintuning</SectionLabel>
      <div className="space-y-4">

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Hero-Stil</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["compact", "editorial", "immersive"] as const).map((v) => (
              <OptionPill key={v} active={(config.heroStyle ?? "compact") === v} onClick={() => updateConfig("heroStyle", v)}>
                {v === "compact" ? "Kompakt" : v === "editorial" ? "Editorial" : "Immersiv"}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Bild / Logo-Größe</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["sm", "md", "lg"] as const).map((v) => (
              <OptionPill key={v} active={(config.mediaScale ?? "md") === v} onClick={() => updateConfig("mediaScale", v)}>
                {v === "sm" ? "Klein" : v === "md" ? "Mittel" : "Groß"}
              </OptionPill>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Button-Abstände</p>
            <div className="flex flex-col gap-1.5">
              {(["tight", "normal", "airy"] as const).map((v) => (
                <OptionPill key={v} active={(config.buttonSpacing ?? "normal") === v} onClick={() => updateConfig("buttonSpacing", v)}>
                  {v === "tight" ? "Eng" : v === "normal" ? "Normal" : "Luftig"}
                </OptionPill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Karten-Dichte</p>
            <div className="flex flex-col gap-1.5">
              {(["tight", "normal", "airy"] as const).map((v) => (
                <OptionPill key={v} active={(config.cardDensity ?? "normal") === v} onClick={() => updateConfig("cardDensity", v)}>
                  {v === "tight" ? "Dicht" : v === "normal" ? "Normal" : "Großzügig"}
                </OptionPill>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Animation</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["off", "subtle", "strong"] as const).map((v) => (
              <OptionPill key={v} active={(config.motionIntensity ?? "subtle") === v} onClick={() => updateConfig("motionIntensity", v)}>
                {v === "off" ? "Aus" : v === "subtle" ? "Dezent" : "Stark"}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Startbereich</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["logo", "cta", "links"] as const).map((v) => (
              <OptionPill key={v} active={(config.startFocus ?? "logo") === v} onClick={() => updateConfig("startFocus", v)}>
                {v === "logo" ? "Logo zuerst" : v === "cta" ? "CTA zuerst" : "Links zuerst"}
              </OptionPill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
