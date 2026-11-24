// components/admin/customers/CustomerPackagesPanel.tsx
// Kundenkartei: treatment packages of one customer — assign a new package, see completed/open
// sessions, copy the personal booking link, jump to "Termin buchen", end/reactivate.
// Renders nothing on plans without the feature (402), same idiom as CustomerLoyaltyPanel.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2, Plus, Link2, CalendarPlus, RefreshCw, Check } from "lucide-react";
import moment from "moment";
import { getServices, type Service } from "@/lib/api/admin";
import {
  treatmentPackagesApi, absoluteBookingLink, copyToClipboard, type TreatmentPackage,
} from "@/lib/api/treatmentPackages";
import { PackageProgressBar } from "@/components/admin/bookings/BookingPackagePanel";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import { useConfirm } from "@/components/ConfirmDialog";

export function CustomerPackagesPanel({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const p = t.packages;
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [total, setTotal] = useState(6);
  const [previouslyUsed, setPreviouslyUsed] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPackages(await treatmentPackagesApi.getForCustomer(customerId));
      setAvailable(true);
    } catch {
      // 402 (plan), 403 (role) — and also 404/405 or network errors, e.g. while the frontend is
      // already live but the backend with /treatment-packages isn't deployed yet: hide the panel
      // instead of offering actions that can only fail.
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!showForm || services.length > 0) return;
    getServices().then((s) => setServices(s.filter((x) => x.isActive !== false))).catch(() => setServices([]));
  }, [showForm, services.length]);

  async function create() {
    if (!serviceId) { setError(p.selectService); return; }
    setBusy("create");
    setError(null);
    try {
      await treatmentPackagesApi.create({
        customerId, serviceId, totalSessions: total,
        previouslyUsedSessions: previouslyUsed, name: name.trim() || null,
      });
      setShowForm(false);
      setServiceId(""); setTotal(6); setPreviouslyUsed(0); setName("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? p.errorGeneric);
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(pkg: TreatmentPackage, status: "Active" | "Cancelled") {
    if (status === "Cancelled" && !(await confirm({ title: p.end, message: p.endConfirm, variant: "danger" }))) return;
    setBusy(pkg.id);
    setError(null);
    try {
      await treatmentPackagesApi.update(pkg.id, { status });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? p.errorGeneric);
    } finally {
      setBusy(null);
    }
  }

  async function renew(pkg: TreatmentPackage) {
    if (!(await confirm({ title: p.renewLink, message: p.renewConfirm, variant: "warning" }))) return;
    setBusy(pkg.id);
    try {
      await treatmentPackagesApi.renewLink(pkg.id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? p.errorGeneric);
    } finally {
      setBusy(null);
    }
  }

  async function copy(pkg: TreatmentPackage) {
    if (await copyToClipboard(absoluteBookingLink(pkg.bookingLinkPath))) {
      setCopiedId(pkg.id);
      setTimeout(() => setCopiedId((c) => (c === pkg.id ? null : c)), 2000);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 flex items-center gap-2 text-xs text-gb-textSecondary">
        <Loader2 size={13} className="animate-spin" /> {p.loading}
      </div>
    );
  }
  if (!available) return null;

  const statusChip = (pkg: TreatmentPackage) => {
    const map = {
      Active: { label: p.statusActive, cls: "bg-[#17A398]/10 text-[#17A398]" },
      UsedUp: { label: p.statusUsedUp, cls: "bg-gray-100 text-gray-600" },
      Cancelled: { label: p.statusCancelled, cls: "bg-red-50 text-red-600" },
    } as const;
    const s = map[pkg.status];
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 space-y-3" data-testid="customer-packages-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
          <Layers size={14} className="text-[#6355E4]" /> {p.title}
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => { setShowForm(true); setError(null); }}
            className="flex items-center gap-1 text-xs font-semibold text-[#6355E4] hover:underline"
          >
            <Plus size={13} /> {p.add}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-[#ECEBF2] p-3 space-y-2.5">
          <label className="block text-xs font-medium text-gb-textSecondary">
            {p.service}
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-1 w-full border border-[#ECEBF2] rounded-lg px-2.5 py-2 text-sm text-[#1E1E1E] bg-white"
            >
              <option value="">{p.selectService}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-gb-textSecondary">
              {p.totalSessions}
              <input
                type="number" min={1} max={100} value={total}
                onChange={(e) => setTotal(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                className="mt-1 w-full border border-[#ECEBF2] rounded-lg px-2.5 py-2 text-sm text-[#1E1E1E]"
              />
            </label>
            <label className="block text-xs font-medium text-gb-textSecondary" title={p.previouslyUsedHint}>
              {p.previouslyUsed}
              <input
                type="number" min={0} max={Math.max(0, total - 1)} value={previouslyUsed}
                onChange={(e) => setPreviouslyUsed(Math.max(0, Math.min(total - 1, parseInt(e.target.value, 10) || 0)))}
                className="mt-1 w-full border border-[#ECEBF2] rounded-lg px-2.5 py-2 text-sm text-[#1E1E1E]"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-gb-textSecondary">
            {p.name}
            <input
              type="text" value={name} maxLength={200} placeholder={p.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-[#ECEBF2] rounded-lg px-2.5 py-2 text-sm text-[#1E1E1E]"
            />
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setError(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gb-textSecondary hover:bg-[#F6F5FA]">
              {p.cancel}
            </button>
            <button type="button" onClick={create} disabled={busy === "create" || !serviceId}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6355E4] text-white hover:bg-[#5145c9] disabled:opacity-40">
              {busy === "create" ? <Loader2 size={13} className="animate-spin" /> : p.create}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {packages.length === 0 && !showForm && <p className="text-xs text-gb-textSecondary">{p.empty}</p>}

      <div className="space-y-2">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg border border-[#ECEBF2] p-3 space-y-2" data-testid="customer-package">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#1E1E1E]">{pkg.name}</p>
              {statusChip(pkg)}
            </div>
            <PackageProgressBar pkg={pkg} />
            <p className="text-xs text-gb-textSecondary" data-testid="package-progress">
              {fillTemplate(p.progressTemplate, { used: pkg.usedSessions, total: pkg.totalSessions })}
              {" · "}<span className="font-semibold text-[#17A398]">{fillTemplate(p.openTemplate, { open: pkg.openSessions })}</span>
              {pkg.reservedSessions > 0 && <>{" · "}{fillTemplate(p.bookedTemplate, { reserved: pkg.reservedSessions })}</>}
            </p>
            {pkg.nextAppointmentDate && (
              <p className="text-xs text-gb-textSecondary">
                {fillTemplate(p.nextTemplate, { date: moment(pkg.nextAppointmentDate).format("DD.MM.YYYY"), time: pkg.nextAppointmentTime ?? "" })}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {pkg.status === "Active" && pkg.bookableSessions > 0 && (
                <>
                  <button type="button" onClick={() => router.push(`/admin/bookings?bookPackage=${pkg.id}`)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#6355E4] hover:underline">
                    <CalendarPlus size={12} /> {p.bookAppointment}
                  </button>
                  <button type="button" onClick={() => copy(pkg)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#6355E4] hover:underline">
                    {copiedId === pkg.id ? <><Check size={12} /> {p.linkCopied}</> : <><Link2 size={12} /> {p.copyLink}</>}
                  </button>
                </>
              )}
              {pkg.status !== "Cancelled" && (
                <button type="button" onClick={() => renew(pkg)} disabled={busy === pkg.id}
                  className="flex items-center gap-1 text-xs text-gb-textSecondary hover:underline disabled:opacity-40">
                  <RefreshCw size={11} /> {p.renewLink}
                </button>
              )}
              {pkg.status === "Cancelled" ? (
                <button type="button" onClick={() => setStatus(pkg, "Active")} disabled={busy === pkg.id}
                  className="text-xs text-[#6355E4] hover:underline disabled:opacity-40">{p.reactivate}</button>
              ) : pkg.status === "Active" && (
                <button type="button" onClick={() => setStatus(pkg, "Cancelled")} disabled={busy === pkg.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-40">{p.end}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {dialog}
    </div>
  );
}
