// components/admin/links/TemplatePackPicker.tsx
// "Fertige Pakete" grid — CMS template packs. Locked packs now use the shared
// LockedItemHint overlay instead of a toast+redirect (unifies with PageTemplatePicker).
"use client";

import { Sparkles, Check } from "lucide-react";
import { CMS_TEMPLATE_PACKS, PLAN_ORDER, PLAN_LABEL, TPL_VISUAL } from "./constants";
import { SectionLabel, TipBanner } from "./shared";
import { LockedItemHint } from "./LockedItemHint";
import type { LinktreeConfig, PageTemplate, PlanTier } from "./types";

export function TemplatePackPicker({
  config, tenantPlan, onSelect,
}: {
  config: LinktreeConfig;
  tenantPlan: PlanTier;
  onSelect: (pack: typeof CMS_TEMPLATE_PACKS[number]) => void;
}) {
  return (
    <div>
      <SectionLabel icon={<Sparkles size={13} />} tip="Ein Paket setzt in einem Klick Vorlage, Farben, Schrift, Button-Stil und Buchungsablauf passend zu deiner Branche. Danach kannst du unten in den erweiterten Optionen jedes Detail einzeln anpassen.">
        Fertige Pakete
      </SectionLabel>
      <TipBanner>
        <span className="font-semibold text-[#111318]">Schnellstart:</span> Wähle unten das Paket, das am besten zu deinem Salon oder Barbershop passt.
        Für Barbershops empfehlen wir „Barbershop Classic", für Friseure & Beauty-Studios „Hair &amp; Beauty Elegant" oder „Salon Launch" — beide sind sofort ohne Zusatzkosten nutzbar.
      </TipBanner>
      <div className="grid grid-cols-2 gap-2.5">
        {CMS_TEMPLATE_PACKS.map((pack) => {
          const isActive = (config.colorScheme ?? "") === pack.key;
          const isLocked = PLAN_ORDER[pack.plan] > PLAN_ORDER[tenantPlan];
          const visual = TPL_VISUAL[(pack.config.pageTemplate as PageTemplate) ?? "classic"] ?? { bg: "#F7F7F8", accent: pack.primaryColor };
          return (
            <LockedItemHint key={pack.key} locked={isLocked} itemName={pack.name} requiredPlanLabel={PLAN_LABEL[pack.plan]}>
              <button onClick={() => onSelect(pack)}
                className={`group relative overflow-hidden rounded-xl border text-left transition-all w-full ${
                  isActive
                    ? "border-[#A5B4FC] ring-2 ring-[#6355E4]/20 shadow-sm"
                    : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE] hover:shadow-sm"
                }`}
              >
                <div className="relative flex h-[46px] items-center gap-1.5 overflow-hidden px-3"
                  style={{ background: visual.bg }}>
                  <span className="text-base leading-none">{pack.icon}</span>
                  <div className="flex items-center gap-1">
                    {[pack.primaryColor, "#ffffff", "#111318"].map((c) => (
                      <span key={c} className="h-2 w-2 rounded-full border border-white/60 shadow-sm" style={{ background: c }} />
                    ))}
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-[#6355E4] rounded-full flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className={`px-3 py-2 ${isActive ? "bg-[#EEEBFC]" : "bg-white"} transition-colors`}>
                  <p className="text-xs font-semibold text-[#111318] leading-tight">{pack.name}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-[#9CA3AF]">{pack.desc}</p>
                </div>
              </button>
            </LockedItemHint>
          );
        })}
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-2">Komplettes Seiten-Design in einem Klick: Layout, Farben, Animation und CTA · gesperrte Pakete zeigen den benötigten Plan</p>
    </div>
  );
}
