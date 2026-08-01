// components/admin/links/LockedItemHint.tsx
// Unified plan-gate overlay for locked templates AND locked CMS packs.
// Both pickers previously handled "locked" clicks differently (silent no-op vs. toast+redirect);
// this component is the single place that owns that interaction from now on.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowUpRight } from "lucide-react";

export function LockedItemHint({
  locked, itemName, requiredPlanLabel, children,
}: { locked: boolean; itemName: string; requiredPlanLabel: string; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(timer);
  }, [open]);

  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 grayscale-[30%]">{children}</div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute inset-0 flex items-start justify-end rounded-2xl p-2"
        aria-label={`${itemName} ist gesperrt — verfügbar ab Tarif ${requiredPlanLabel}`}
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-[#14162B]/85 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
          <Lock size={10} />
          {requiredPlanLabel}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-[#E5E7EB] bg-white p-3 text-left shadow-lg">
          <p className="text-xs font-semibold text-[#14162B]">{itemName}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">
            Verfügbar ab Tarif „{requiredPlanLabel}".
          </p>
          <button
            onClick={() => router.push("/admin/subscription")}
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#6355E4] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#5245D0]"
          >
            Jetzt upgraden
            <ArrowUpRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
