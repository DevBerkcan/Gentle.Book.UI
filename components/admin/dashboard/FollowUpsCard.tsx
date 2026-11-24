// components/admin/dashboard/FollowUpsCard.tsx
// Dashboard "Offene Folgetermine": every active treatment package with open sessions and no
// valid upcoming appointment, with the two direct actions "Termin buchen" / "Buchungslink
// kopieren". Hidden when the list is empty or the plan doesn't include packages (402).
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarPlus, Link2, Check, Layers, Phone } from "lucide-react";
import moment from "moment";
import {
  treatmentPackagesApi, absoluteBookingLink, copyToClipboard, type FollowUp, type FollowUpReasonCode,
} from "@/lib/api/treatmentPackages";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";

export function FollowUpsCard() {
  const { t } = useTranslation();
  const p = t.packages;
  const router = useRouter();
  const [items, setItems] = useState<FollowUp[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    treatmentPackagesApi.getFollowUps().then(setItems).catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  const reasonLabel: Record<FollowUpReasonCode, string> = {
    no_appointment_yet: p.reasonNoAppointmentYet,
    missing_follow_up: p.reasonMissingFollowUp,
    cancelled_without_replacement: p.reasonCancelled,
    no_show_without_replacement: p.reasonNoShow,
    last_not_completed: p.reasonLastNotCompleted,
  };
  const reasonClass = (code: FollowUpReasonCode) =>
    code === "cancelled_without_replacement" || code === "no_show_without_replacement"
      ? "bg-red-50 text-red-700"
      : code === "last_not_completed" ? "bg-gray-100 text-gray-700" : "bg-amber-50 text-amber-800";

  async function copy(item: FollowUp) {
    if (await copyToClipboard(absoluteBookingLink(item.bookingLinkPath))) {
      setCopied(item.packageId);
      setTimeout(() => setCopied((c) => (c === item.packageId ? null : c)), 2000);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
      data-testid="follow-ups-card"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
        <div>
          <h2 className="text-sm font-bold text-[#111318] flex items-center gap-1.5">
            <Layers size={14} className="text-[#6355E4]" /> {p.followUpsTitle}
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#6355E4]/10 text-[#6355E4]">{items.length}</span>
          </h2>
          <p className="text-[11px] text-gb-textMuted">{p.followUpsSubtitle}</p>
        </div>
      </div>
      <ul className="divide-y divide-[#F3F4F6]">
        {items.map((item) => (
          <li key={item.packageId} className="px-5 py-3.5 flex flex-col md:flex-row md:items-center gap-3" data-testid="follow-up-item">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[#111318] truncate">{item.customerName}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${reasonClass(item.reasonCode)}`}>
                  {reasonLabel[item.reasonCode] ?? item.reason}
                </span>
              </div>
              <p className="text-xs text-gb-textSecondary truncate">
                {item.serviceName}
                {" · "}<span className="font-semibold text-[#17A398]">{fillTemplate(p.openSessionsTemplate, { open: item.openSessions, total: item.totalSessions })}</span>
                {item.lastAppointmentDate && <>{" · "}{fillTemplate(p.lastAppointmentTemplate, { date: moment(item.lastAppointmentDate).format("DD.MM.YYYY") })}</>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {item.customerPhone && (
                <a href={`tel:${item.customerPhone}`} aria-label={item.customerPhone}
                  className="p-2 rounded-lg text-gb-textSecondary hover:bg-[#F7F7F8]">
                  <Phone size={14} />
                </a>
              )}
              <button
                type="button"
                onClick={() => copy(item)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#E5E7EB] text-[#374151] hover:bg-[#F7F7F8]"
              >
                {copied === item.packageId ? <><Check size={13} /> {p.linkCopied}</> : <><Link2 size={13} /> {p.copyLink}</>}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin/bookings?bookPackage=${item.packageId}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#6355E4] text-white hover:bg-[#5145c9]"
              >
                <CalendarPlus size={13} /> {p.bookAppointment}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
