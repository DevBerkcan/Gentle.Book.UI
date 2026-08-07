// components/admin/settings/CustomDomainSection.tsx
// "Eigene Domain" section for /admin/settings (Agency-exklusiv). Lets the tenant request their
// own domain instead of a gentlebook.de link. There is no automatic Vercel provisioning yet (see
// Agency-Ausbau-Runde-2 plan) — a SuperAdmin adds the domain by hand and flips the status once
// it's live, this section just shows the current request status.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, CheckCircle2, Clock, XCircle, Loader2, Unlink, Lock } from "lucide-react";
import { adminApi, type TenantDomainInfo } from "@/lib/api/admin";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

const STATUS_LABEL: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PendingVerification: { label: "Wird geprüft", color: "#92400E", icon: Clock },
  Verified: { label: "Aktiv", color: "#065F46", icon: CheckCircle2 },
  Failed: { label: "Fehlgeschlagen", color: "#991B1B", icon: XCircle },
};

export function CustomDomainSection() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<TenantDomainInfo | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ message: string; currentPlan?: string; requiredPlan?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDomain();
      setInfo(data);
      setUrlInput(data.domain ?? "");
    } catch (err: any) {
      if (err?.response?.status === 402 && err.response?.data?.feature === "custom_domain") {
        setLocked({ message: err.response.data.message, currentPlan: err.response.data.currentPlan, requiredPlan: err.response.data.requiredPlan });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    if (!urlInput.trim()) { setError("Bitte eine Domain angeben."); return; }
    setSaving(true);
    try {
      await adminApi.updateDomain(urlInput.trim());
      setSuccess("Domain beantragt — wir richten sie in Kürze ein.");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Die Domain konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Domain-Anfrage wirklich entfernen?")) return;
    setSaving(true);
    try {
      await adminApi.removeDomain();
      setUrlInput("");
      setSuccess("Domain entfernt.");
      await load();
    } catch {
      setError("Die Domain konnte nicht entfernt werden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] px-1"><Loader2 size={13} className="animate-spin" /> Lade…</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="w-8 h-8 bg-[#E5E7EB] rounded-xl flex items-center justify-center shrink-0">
            <Lock size={14} className="text-[#9CA3AF]" />
          </div>
          <div>
            <p className="font-semibold text-[#111318] text-sm leading-tight">Eigene Domain</p>
            <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Agency-exklusiv</p>
          </div>
        </div>
        <div className="px-1">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] p-3.5 text-xs text-[#565A72]">
            {locked.message}
            {locked.currentPlan && <span className="block mt-1 text-[#9CA3AF]">Aktueller Plan: {locked.currentPlan}</span>}
            <a href="/admin/subscription" className="inline-block mt-2 text-[#6355E4] font-semibold hover:underline">Jetzt upgraden →</a>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = info?.status && info.status !== "None" ? STATUS_LABEL[info.status] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="w-8 h-8 bg-[#6355E4] rounded-xl flex items-center justify-center shrink-0">
          <Globe2 size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">Eigene Domain</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Deine Buchungsseite unter deiner eigenen Domain statt gentlebook.de</p>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] p-3.5">
          <p className="text-xs leading-relaxed text-[#565A72]">
            Trage die gewünschte Domain ein (z. B. <code className="bg-white px-1 py-0.5 rounded">buchung.deinefirma.de</code>).
            Wir richten sie für dich ein und melden uns, sobald sie aktiv ist — bis dahin bleibt deine
            gentlebook.de-Adresse unverändert erreichbar.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#6B7280]">Domain</label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="buchung.deinefirma.de"
            className={inputCls}
            disabled={saving}
          />
        </div>

        {statusInfo && StatusIcon && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: statusInfo.color }}>
            <StatusIcon size={13} /> {statusInfo.label}
            {info?.requestedAt && <span className="text-[#9CA3AF]"> · beantragt am {new Date(info.requestedAt).toLocaleDateString("de-DE")}</span>}
          </div>
        )}

        {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        {success && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{success}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Globe2 size={13} />} Domain beantragen
          </button>
          {info?.domain && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50"
            >
              <Unlink size={13} /> Entfernen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
