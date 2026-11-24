// components/admin/bookings/BookingPackagePanel.tsx
// Booking detail panel: treatment package of this appointment (progress, link/unlink) plus the
// customer's INTERNAL note from the Kundenkartei. Self-contained; the backend decides what the
// caller may see (employees only for their own bookings, packages only on Pro/Agency/Trial).
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Loader2, StickyNote, ExternalLink } from "lucide-react";
import { treatmentPackagesApi, type BookingPackageInfo, type TreatmentPackage } from "@/lib/api/treatmentPackages";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/contexts/AuthContext";

export function PackageProgressBar({ pkg }: { pkg: Pick<TreatmentPackage, "usedSessions" | "totalSessions" | "reservedSessions"> }) {
  const total = Math.max(1, pkg.totalSessions);
  const used = Math.min(pkg.usedSessions, total);
  const reserved = Math.min(pkg.reservedSessions, total - used);
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#ECEBF2]" aria-hidden="true">
      <div className="bg-[#17A398]" style={{ width: `${(used / total) * 100}%` }} />
      <div className="bg-[#6355E4]/40" style={{ width: `${(reserved / total) * 100}%` }} />
    </div>
  );
}

export function BookingPackagePanel({ bookingId, refreshKey }: { bookingId: string; refreshKey?: string }) {
  const { t } = useTranslation();
  const p = t.packages;
  const { isTenantAdmin } = useAuth();
  const [info, setInfo] = useState<BookingPackageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await treatmentPackagesApi.getForBooking(bookingId);
      setInfo(data);
      setChoice(data.candidates.length === 1 ? data.candidates[0].id : "");
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  async function assign(packageId: string | null) {
    setSaving(true);
    setError(null);
    try {
      const data = await treatmentPackagesApi.assignToBooking(bookingId, packageId);
      setInfo(data);
      setChoice(data.candidates.length === 1 ? data.candidates[0].id : "");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? p.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 flex items-center gap-2 text-xs text-gb-textSecondary">
        <Loader2 size={13} className="animate-spin" /> {p.loading}
      </div>
    );
  }
  if (!info) return null;

  const assigned = info.assignedPackage;
  const showPackageBlock = info.packagesEnabled && (assigned || info.candidates.length > 0);

  return (
    <>
      {showPackageBlock && (
        <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 space-y-3" data-testid="booking-package-panel">
          <h3 className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
            <Layers size={14} className="text-[#6355E4]" /> {p.bookingPanelTitle}
          </h3>

          {assigned ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#1E1E1E]">{assigned.name}</p>
                <span className="text-xs font-semibold text-[#17A398] whitespace-nowrap">
                  {fillTemplate(p.openTemplate, { open: assigned.openSessions })}
                </span>
              </div>
              <PackageProgressBar pkg={assigned} />
              <p className="text-xs text-gb-textSecondary">
                {fillTemplate(p.progressTemplate, { used: assigned.usedSessions, total: assigned.totalSessions })}
                {" · "}{p.sessionDebitHint}
              </p>
              {info.canAssign && (
                <button
                  type="button"
                  onClick={() => assign(null)}
                  disabled={saving}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  {p.unassign}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gb-textSecondary">{p.noPackage}</p>
              {info.canAssign && info.candidates.length > 0 && (
                <>
                  {info.candidates.length > 1 && <p className="text-xs text-amber-700">{p.chooseHint}</p>}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={choice}
                      onChange={(e) => setChoice(e.target.value)}
                      disabled={saving}
                      aria-label={p.assignTo}
                      className="flex-1 border border-[#ECEBF2] bg-white rounded-lg px-2.5 py-2 text-sm text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25"
                    >
                      {info.candidates.length > 1 && <option value="">—</option>}
                      {info.candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({fillTemplate(p.openTemplate, { open: c.openSessions })})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => choice && assign(choice)}
                      disabled={saving || !choice}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#6355E4] text-white hover:bg-[#5145c9] disabled:opacity-40"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : p.assignTo}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20" data-testid="booking-internal-notes">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
            <StickyNote size={14} className="text-[#6355E4]" /> {p.internalNotes}
          </h3>
          {isTenantAdmin && (
            <Link
              href={`/admin/customers?customer=${info.customerId}`}
              className="text-xs font-medium text-[#6355E4] hover:underline flex items-center gap-1"
            >
              {p.openCustomer} <ExternalLink size={11} />
            </Link>
          )}
        </div>
        {info.customerInternalNotes ? (
          <p className="text-sm text-[#1E1E1E] whitespace-pre-wrap">{info.customerInternalNotes}</p>
        ) : (
          <p className="text-xs text-gb-textSecondary">{p.noInternalNotes}</p>
        )}
      </div>
    </>
  );
}
