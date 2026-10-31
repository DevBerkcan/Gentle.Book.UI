// components/admin/settings/SupportAccessSection.tsx
// "Support-Zugriffe" section for /admin/settings (TenantAdmin only). Shows when GentleBook
// support logged into this tenant's account via impersonation, as whom, and why — the
// tenant-facing half of the AVV's "nur auf Anlass, protokolliert" support-access rule (the
// SuperAdmin side writes the reason into AuditLog; see SuperAdminController.ImpersonateTenant).
"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { getSupportAccessLog, type SupportAccessLogEntry } from "@/lib/api/admin";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function SupportAccessSection() {
  const { t, lang } = useTranslation();
  const s = t.admin.settingsPage;
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SupportAccessLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupportAccessLog(1, 10);
      setEntries(data.items);
    } catch {
      setError(s.supportAccessLoadError);
    } finally {
      setLoading(false);
    }
  }, [s.supportAccessLoadError]);

  useEffect(() => { void load(); }, [load]);

  const dateLocale = lang === "de" ? "de-DE" : "en-US";

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="w-8 h-8 bg-[#111318] rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">{s.supportAccessTitle}</p>
          <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.supportAccessDesc}</p>
        </div>
      </div>

      <div className="px-1">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gb-textMuted">
            <Loader2 size={13} className="animate-spin" /> {t.loading}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-xs text-[#991B1B]">
            <AlertTriangle size={13} /> {error}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-gb-textMuted">{s.supportAccessEmptyState}</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] p-3 text-xs text-[#374151]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#111318]">{entry.actorName ?? "GentleBook Support"}</span>
                  <span className="text-gb-textMuted">
                    {new Date(entry.createdAt).toLocaleString(dateLocale)}
                  </span>
                </div>
                {entry.details && <p className="mt-1 text-gb-textSecondary">{entry.details}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
