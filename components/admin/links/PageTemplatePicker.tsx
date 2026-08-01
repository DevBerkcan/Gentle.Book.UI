// components/admin/links/PageTemplatePicker.tsx
// "Seitenvorlage" grid — individual page templates. Locked templates now use the
// shared LockedItemHint overlay instead of silently no-oping on click.
"use client";

import { LayoutGrid, Check } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { PAGE_TEMPLATES, PLAN_ORDER, PLAN_LABEL, TPL_VISUAL } from "./constants";
import { SectionLabel } from "./shared";
import { LockedItemHint } from "./LockedItemHint";
import type { LinktreeConfig, PageTemplate, PlanTier } from "./types";

export function PageTemplatePicker({
  config, tenantPlan, onSelect,
}: {
  config: LinktreeConfig;
  tenantPlan: PlanTier;
  onSelect: (key: PageTemplate) => void;
}) {
  return (
    <div className="border-t border-[#F3F4F6] pt-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel icon={<LayoutGrid size={13} />} tip="Die Seitenvorlage bestimmt das Grundlayout deiner Buchungsseite (Header, Anordnung, Bildgröße). Sie wird automatisch mitgesetzt, wenn du oben ein fertiges Paket wählst — du kannst sie hier aber auch einzeln ändern.">
          Seitenvorlage
        </SectionLabel>
        <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
          {PAGE_TEMPLATES.length} Designs
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PAGE_TEMPLATES.map((tpl) => {
          const isActive = (config.pageTemplate ?? "classic") === tpl.key;
          const isLocked = PLAN_ORDER[tpl.plan] > PLAN_ORDER[tenantPlan];
          const visual = TPL_VISUAL[tpl.key] ?? { bg: "#F7F7F8", accent: "#6355E4" };
          return (
            <LockedItemHint key={tpl.key} locked={isLocked} itemName={tpl.name} requiredPlanLabel={PLAN_LABEL[tpl.plan]}>
              <MagicCard
                gradientColor={visual.accent}
                gradientOpacity={isLocked ? 0 : 0.15}
                gradientSize={100}
                className={`relative flex flex-col rounded-xl border transition-all overflow-hidden text-left cursor-pointer ${
                  isActive
                    ? "border-[#A5B4FC] ring-2 ring-[#6355E4]/20 shadow-sm"
                    : "border-[#E5E7EB] hover:border-[#C7D2FE]"
                }`}
                onClick={() => onSelect(tpl.key)}
              >
                <div className="w-full h-[54px] flex flex-col items-center justify-center gap-[3px] relative overflow-hidden"
                  style={{ background: visual.bg }}>
                  <div className="w-[13px] h-[13px] rounded-full shadow-sm" style={{ background: visual.accent }} />
                  <div className="h-[3px] w-7 rounded-full" style={{ background: visual.accent, opacity: 0.55 }} />
                  <div className="h-[5px] w-9 rounded-md" style={{ background: visual.accent, opacity: 0.38 }} />
                  <div className="absolute top-1 left-1.5 text-[10px] leading-none">{tpl.emoji}</div>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-[13px] h-[13px] bg-[#6355E4] rounded-full flex items-center justify-center">
                      <Check size={7} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className={`px-2 py-1.5 ${isActive ? "bg-[#EEEBFC]" : "bg-white"} transition-colors`}>
                  <p className="text-[10px] font-bold text-[#111318] leading-tight">{tpl.name}</p>
                  <p className="text-[9px] text-[#9CA3AF] leading-tight truncate">{tpl.desc}</p>
                </div>
              </MagicCard>
            </LockedItemHint>
          );
        })}
      </div>
    </div>
  );
}
