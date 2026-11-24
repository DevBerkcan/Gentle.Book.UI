// components/admin/dashboard/ReferralStatsCard.tsx
// Dashboard "Freunde machen Freude": did the programme bring customers who actually came — and
// came back? Hidden for plans without the feature and for studios that never used it.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import moment from "moment";
import { referralsApi, type ReferralStats } from "@/lib/api/studioPass";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function ReferralStatsCard() {
  const { t } = useTranslation();
  const p = t.studioPass;
  const [stats, setStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    referralsApi.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats || (!stats.enabled && stats.bookedInvitations === 0)) return null;

  const tiles = [
    { label: p.statBooked, value: stats.bookedInvitations },
    { label: p.statFirstVisits, value: stats.firstVisits },
    { label: p.statRedeemed, value: stats.rewardsRedeemed },
    { label: p.statSecond, value: stats.secondBookings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
      data-testid="referral-stats-card"
    >
      <div className="px-5 py-4 border-b border-[#F3F4F6]">
        <h2 className="text-sm font-bold text-[#111318] flex items-center gap-1.5">
          <Heart size={14} className="text-[#E11D48]" /> {p.statsTitle}
        </h2>
        <p className="text-[11px] text-gb-textMuted">{p.statsSubtitle}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#F3F4F6]">
        {tiles.map((tile) => (
          <div key={tile.label} className="px-5 py-4">
            <p className="text-2xl font-bold text-[#111318] tabular-nums" data-testid="referral-stat">{tile.value}</p>
            <p className="text-[11px] font-medium text-gb-textMuted">{tile.label}</p>
          </div>
        ))}
      </div>
      {!stats.enabled && (
        <p className="px-5 py-3 text-xs text-gb-textSecondary border-t border-[#F3F4F6]">
          <Link href="/admin/settings#section-referral" className="text-[#6355E4] hover:underline">{p.statsInactive}</Link>
        </p>
      )}
      {stats.recent.length > 0 && (
        <div className="border-t border-[#F3F4F6] px-5 py-3">
          <p className="text-[11px] font-semibold text-gb-textMuted uppercase tracking-wide mb-1.5">{p.recentTitle}</p>
          <ul className="space-y-1">
            {stats.recent.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 text-xs text-[#374151]">
                <span className="truncate">{r.referrerName} → {r.referredName}</span>
                <span className={`whitespace-nowrap ${r.status === "Qualified" ? "text-[#17A398] font-semibold" : "text-gb-textMuted"}`}>
                  {r.status === "Qualified" ? p.statusQualified : p.statusPending} · {moment(r.qualifiedAt ?? r.createdAt).format("DD.MM.")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
