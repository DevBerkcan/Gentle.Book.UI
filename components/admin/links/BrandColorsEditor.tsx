// components/admin/links/BrandColorsEditor.tsx
"use client";

import { Pipette } from "lucide-react";
import { SectionLabel } from "./shared";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function BrandColorsEditor({
  brandColors, onApply,
}: {
  brandColors: { primary?: string; secondary?: string; accent?: string };
  onApply: () => void;
}) {
  const { t } = useTranslation();
  const s = t.admin.linksPage;
  return (
    <div className="border-t border-[#F3F4F6] pt-5">
      <SectionLabel icon={<Pipette size={13} />} tip={s.brandColorsTip}>
        {s.brandColorsLabel}
      </SectionLabel>
      <div className="flex items-center justify-between gap-3 p-3.5 bg-[#F7F7F8] rounded-xl border border-[#F3F4F6]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-1.5 flex-shrink-0">
            {[brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean).map((c, i) => (
              <span key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111318]">{s.brandColorsFromSettingsTitle}</p>
            <p className="text-[10px] text-[#9CA3AF] truncate">
              {s.brandColorsFromSettingsDescPre}{" "}
              <a href="/admin/settings" className="underline hover:text-[#6355E4]">{s.editLink}</a>
            </p>
          </div>
        </div>
        <button
          onClick={onApply}
          disabled={!brandColors.primary}
          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-[#6355E4] text-white hover:bg-[#4338CA] disabled:opacity-40 transition-colors"
        >
          {s.applyBtn}
        </button>
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-1.5">
        {s.brandColorsApplyHint}
      </p>
    </div>
  );
}
