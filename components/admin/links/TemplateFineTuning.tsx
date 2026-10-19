// components/admin/links/TemplateFineTuning.tsx
// "Erweiterte Design-Optionen" → Template-Feintuning: Hero-Stil, Bild/Logo-Größe,
// Button-Abstände, Karten-Dichte, Animation, Startbereich.
"use client";

import { SlidersHorizontal } from "lucide-react";
import { SectionLabel, OptionPill } from "./shared";
import type { LinktreeConfig } from "./types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function TemplateFineTuning({
  config, updateConfig,
}: {
  config: LinktreeConfig;
  updateConfig: (field: keyof LinktreeConfig, value: string | boolean | undefined) => void;
}) {
  const { t } = useTranslation();
  const s = t.admin.linksPage;
  return (
    <div className="border-t border-[#F3F4F6] pt-5">
      <SectionLabel icon={<SlidersHorizontal size={13} />}>{s.templateFineTuningLabel}</SectionLabel>
      <div className="space-y-4">

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">{s.heroStyleLabel}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["compact", "editorial", "immersive"] as const).map((v) => (
              <OptionPill key={v} active={(config.heroStyle ?? "compact") === v} onClick={() => updateConfig("heroStyle", v)}>
                {v === "compact" ? s.heroCompact : v === "editorial" ? s.heroEditorial : s.heroImmersive}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">{s.mediaScaleLabel}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["sm", "md", "lg"] as const).map((v) => (
              <OptionPill key={v} active={(config.mediaScale ?? "md") === v} onClick={() => updateConfig("mediaScale", v)}>
                {v === "sm" ? s.sizeSmall : v === "md" ? s.sizeMedium : s.sizeLarge}
              </OptionPill>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] mb-2">{s.buttonSpacingLabel}</p>
            <div className="flex flex-col gap-1.5">
              {(["tight", "normal", "airy"] as const).map((v) => (
                <OptionPill key={v} active={(config.buttonSpacing ?? "normal") === v} onClick={() => updateConfig("buttonSpacing", v)}>
                  {v === "tight" ? s.spacingTight : v === "normal" ? s.spacingNormal : s.spacingAiry}
                </OptionPill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] mb-2">{s.cardDensityLabel}</p>
            <div className="flex flex-col gap-1.5">
              {(["tight", "normal", "airy"] as const).map((v) => (
                <OptionPill key={v} active={(config.cardDensity ?? "normal") === v} onClick={() => updateConfig("cardDensity", v)}>
                  {v === "tight" ? s.densityTight : v === "normal" ? s.densityNormal : s.densityAiry}
                </OptionPill>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">{s.motionLabel}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["off", "subtle", "strong"] as const).map((v) => (
              <OptionPill key={v} active={(config.motionIntensity ?? "subtle") === v} onClick={() => updateConfig("motionIntensity", v)}>
                {v === "off" ? s.motionOff : v === "subtle" ? s.motionSubtle : s.motionStrong}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">{s.startFocusLabel}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["logo", "cta", "links"] as const).map((v) => (
              <OptionPill key={v} active={(config.startFocus ?? "logo") === v} onClick={() => updateConfig("startFocus", v)}>
                {v === "logo" ? s.startFocusLogo : v === "cta" ? s.startFocusCta : s.startFocusLinks}
              </OptionPill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
