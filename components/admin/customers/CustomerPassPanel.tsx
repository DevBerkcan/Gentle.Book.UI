// components/admin/customers/CustomerPassPanel.tsx
// Kundenkartei: the customer's personal Studio-Pass link (copy / open / renew — every plan) and,
// where the plan includes it, "Freunde machen Freude": who referred her, whom she invited, and
// the earned bonuses with "Als eingelöst markieren".
"use client";

import { useCallback, useEffect, useState } from "react";
import { IdCard, Loader2, Link2, Check, ExternalLink, RefreshCw, Users, Gift } from "lucide-react";
import moment from "moment";
import { referralsApi, type CustomerReferralInfo } from "@/lib/api/studioPass";
import { absoluteBookingLink, copyToClipboard } from "@/lib/api/treatmentPackages";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import { useConfirm } from "@/components/ConfirmDialog";

export function CustomerPassPanel({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const p = t.studioPass;
  const { confirm, dialog } = useConfirm();
  const [info, setInfo] = useState<CustomerReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setInfo(await referralsApi.getForCustomer(customerId)); }
    catch { setInfo(null); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  async function copy() {
    if (!info) return;
    if (await copyToClipboard(absoluteBookingLink(info.passPath))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function renew() {
    if (!(await confirm({ title: p.renewPass, message: p.renewConfirm, variant: "warning" }))) return;
    setBusy("renew");
    try { await referralsApi.renewPass(customerId); await load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? p.errorGeneric); }
    finally { setBusy(null); }
  }

  async function redeem(referralId: string, side: "referrer" | "referred", undo: boolean) {
    setBusy(`${referralId}-${side}`);
    setError(null);
    try { await referralsApi.redeem(referralId, side, undo); await load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? p.errorGeneric); }
    finally { setBusy(null); }
  }

  if (loading) {
    return (
      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 flex items-center gap-2 text-xs text-gb-textSecondary">
        <Loader2 size={13} className="animate-spin" /> {t.loading}
      </div>
    );
  }
  if (!info) return null;

  const statusLabel = (s: "Pending" | "Qualified") => (s === "Qualified" ? p.statusQualified : p.statusPending);

  return (
    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 space-y-3" data-testid="customer-pass-panel">
      <h3 className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
        <IdCard size={14} className="text-[#6355E4]" /> {p.passPanelTitle}
      </h3>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <button type="button" onClick={copy} className="flex items-center gap-1 text-xs font-semibold text-[#6355E4] hover:underline">
          {copied ? <><Check size={12} /> {p.linkCopied}</> : <><Link2 size={12} /> {p.copyPass}</>}
        </button>
        <a href={info.passPath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#6355E4] hover:underline">
          <ExternalLink size={12} /> {p.openPass}
        </a>
        <button type="button" onClick={renew} disabled={busy === "renew"} className="flex items-center gap-1 text-xs text-gb-textSecondary hover:underline disabled:opacity-40">
          <RefreshCw size={11} /> {p.renewPass}
        </button>
      </div>

      {info.referralAvailable && (
        <>
          {info.referredBy && (
            <p className="text-xs text-gb-textSecondary flex items-center gap-1.5">
              <Users size={12} className="text-[#6355E4]" />
              {fillTemplate(p.referredByTemplate, { name: info.referredBy.name })} · {statusLabel(info.referredBy.status)}
            </p>
          )}

          {info.invited.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#1E1E1E] mb-1">{p.invitedTitle}</p>
              <ul className="space-y-1">
                {info.invited.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-gb-textSecondary">
                    <span>{f.name}</span>
                    <span className={f.status === "Qualified" ? "text-[#17A398] font-semibold" : ""}>{statusLabel(f.status)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {info.rewards.length > 0 && (
            <div data-testid="customer-referral-rewards">
              <p className="text-xs font-semibold text-[#1E1E1E] mb-1 flex items-center gap-1"><Gift size={12} className="text-[#6355E4]" /> {p.adminRewardsTitle}</p>
              <ul className="space-y-2">
                {info.rewards.map((r) => {
                  const key = `${r.referralId}-${r.side}`;
                  return (
                    <li key={key} className="bg-white rounded-lg border border-[#ECEBF2] p-2.5">
                      <p className="text-sm font-semibold text-[#1E1E1E]">{r.text}</p>
                      <p className="text-[11px] text-gb-textSecondary">{r.reason}</p>
                      {r.redeemedAt ? (
                        <p className="text-[11px] text-[#17A398] mt-1">
                          {fillTemplate(p.redeemedOnTemplate, { date: moment(r.redeemedAt).format("DD.MM.YYYY") })}
                          {" · "}
                          <button type="button" disabled={busy === key} onClick={() => redeem(r.referralId, r.side, true)} className="text-gb-textSecondary hover:underline">{p.undo}</button>
                        </p>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === key}
                          onClick={() => redeem(r.referralId, r.side, false)}
                          className="mt-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#6355E4] text-white hover:bg-[#5145c9] disabled:opacity-40"
                        >
                          {p.redeem}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {dialog}
    </div>
  );
}
