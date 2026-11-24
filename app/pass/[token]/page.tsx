"use client";

// Personal Studio-Pass — the customer's permanent page for one studio: next appointment with
// "Termin verwalten", rebook, open package sessions, stamp card, rewards and "Freundin einladen".
// Public; identified only by the unguessable pass token. Shows nothing internal (no notes, no
// e-mail/phone) — see Gentle.Book.API/Controllers/PublicPassController.cs.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import moment from "moment";
import "moment/locale/de";
import {
  CalendarDays, MapPin, Phone, Layers, Gift, Users, Link2, Check, Ticket, Stamp, ChevronRight, Loader2,
} from "lucide-react";
import { LanguageProvider, useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import { getStudioPass, type StudioPassData } from "@/lib/api/studioPass";
import { copyToClipboard } from "@/lib/api/treatmentPackages";
import { resolveLogoUrl } from "@/lib/utils/logo";

export default function StudioPassPage() {
  return (
    <LanguageProvider>
      <PassInner />
    </LanguageProvider>
  );
}

function PassInner() {
  const { token } = useParams<{ token: string }>();
  const { t, lang } = useTranslation();
  const p = t.studioPass;
  const [data, setData] = useState<StudioPassData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    getStudioPass(token)
      .then((d) => { setData(d); setState(d ? "ok" : "missing"); })
      .catch(() => setState("missing"));
  }, [token]);

  useEffect(() => { moment.locale(lang === "de" ? "de" : "en"); }, [lang]);

  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F7F8] text-sm text-gray-500 gap-2">
        <Loader2 size={16} className="animate-spin" /> {p.loading}
      </main>
    );
  }
  if (state === "missing" || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F7F8] px-4">
        <p className="max-w-sm text-center text-sm text-gray-600" data-testid="pass-not-found">{p.notFound}</p>
      </main>
    );
  }

  const color = data.studio.primaryColor || "#6355E4";
  const logo = resolveLogoUrl(data.studio.logoUrl);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const next = data.upcoming[0];
  const shareUrl = data.referral ? `${origin}${data.referral.sharePath}` : "";
  const whatsappText = data.referral
    ? fillTemplate(p.whatsappMessageTemplate, { studio: data.studio.name, reward: data.referral.rewardText, link: shareUrl })
    : "";

  const card = "bg-white rounded-2xl border border-black/5 shadow-sm p-5";
  const fmtDate = (d: string) => moment(d).format(lang === "de" ? "dddd, D. MMMM" : "dddd, MMMM D");

  async function copyShare() {
    if (await copyToClipboard(shareUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F8] pb-12" data-testid="studio-pass">
      {/* Header card in studio colours */}
      <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }} className="px-4 pt-8 pb-16 text-white">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={data.studio.name} className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">{data.studio.name.charAt(0)}</div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider opacity-80">{p.passTitle}</p>
              <p className="font-semibold truncate">{data.studio.name}</p>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-bold">{fillTemplate(p.helloTemplate, { name: data.customer.firstName })}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        {/* Next appointment */}
        <section className={card} data-testid="pass-next-appointment">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <CalendarDays size={14} style={{ color }} /> {p.nextAppointment}
          </h2>
          {next ? (
            <div className="mt-3">
              <p className="text-lg font-bold text-gray-900 capitalize">{fmtDate(next.date)}</p>
              <p className="text-sm text-gray-700">{next.startTime}–{next.endTime} · {next.serviceName}</p>
              {next.employeeName && <p className="text-xs text-gray-500 mt-0.5">{fillTemplate(p.withEmployeeTemplate, { name: next.employeeName })}</p>}
              <a href={next.managePath} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color }}>
                {p.manage} <ChevronRight size={15} />
              </a>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">{p.noAppointment}</p>
          )}
          {data.upcoming.length > 1 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">{p.moreAppointments}</p>
              {data.upcoming.slice(1).map((u) => (
                <a key={u.managePath} href={u.managePath} className="flex items-center justify-between py-1.5 text-sm text-gray-700">
                  <span>{moment(u.date).format("DD.MM.")} · {u.startTime} · {u.serviceName}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </a>
              ))}
            </div>
          )}
          {data.studio.bookingPath && (
            <a
              href={data.studio.bookingPath}
              className="mt-4 block w-full text-center rounded-xl py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: color }}
              data-testid="pass-book"
            >
              {next ? p.bookAgain : p.bookNew}
            </a>
          )}
          {(data.studio.address || data.studio.phone) && (
            <div className="mt-4 flex gap-2">
              {data.studio.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.studio.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700"
                >
                  <MapPin size={14} /> {p.directions}
                </a>
              )}
              {data.studio.phone && (
                <a href={`tel:${data.studio.phone}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700">
                  <Phone size={14} /> {p.call}
                </a>
              )}
            </div>
          )}
        </section>

        {/* Treatment packages (Laser etc.) */}
        {data.packages.length > 0 && (
          <section className={card} data-testid="pass-packages">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Layers size={14} style={{ color }} /> {p.packagesTitle}
            </h2>
            <div className="mt-3 space-y-4">
              {data.packages.map((pkg) => (
                <div key={pkg.name}>
                  <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                  <div className="mt-2 flex gap-1" aria-hidden="true">
                    {Array.from({ length: pkg.totalSessions }).map((_, i) => (
                      <span key={i} className="h-2 flex-1 rounded-full" style={{ backgroundColor: i < pkg.usedSessions ? color : "#E5E7EB" }} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-600">{fillTemplate(p.packageOpenTemplate, { open: pkg.openSessions, total: pkg.totalSessions })}</p>
                  {pkg.nextSessionBookingPath && (
                    <a href={pkg.nextSessionBookingPath} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold" style={{ color }}>
                      {p.bookNextSession} <ChevronRight size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stamp card */}
        {data.stamps && (
          <section className={card} data-testid="pass-stamps">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Stamp size={14} style={{ color }} /> {p.stampsTitle}
            </h2>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: data.stamps.target }).map((_, i) => {
                const filled = i < data.stamps!.current;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: filled ? color : "#E5E7EB", backgroundColor: filled ? color : "transparent" }}
                  >
                    {filled && <Check size={16} className="text-white" />}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {fillTemplate(p.stampsProgressTemplate, { current: data.stamps.current, target: data.stamps.target })}
            </p>
            <p className="text-xs text-gray-600">{fillTemplate(p.stampsRewardTemplate, { target: data.stamps.target, reward: data.stamps.rewardLabel })}</p>
          </section>
        )}

        {/* Rewards + vouchers */}
        {(data.rewards.length > 0 || data.vouchers.length > 0) && (
          <section className={card} data-testid="pass-rewards">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Gift size={14} style={{ color }} /> {p.rewardsTitle}
            </h2>
            <ul className="mt-3 space-y-3">
              {data.rewards.map((r, i) => (
                <li key={`r${i}`} className={`rounded-xl p-3 ${r.redeemed ? "bg-gray-50" : ""}`} style={r.redeemed ? undefined : { backgroundColor: `${color}12` }}>
                  <p className="text-xs font-semibold text-gray-500">{r.kind === "referral_thanks" ? p.rewardThanks : p.rewardWelcome}</p>
                  <p className={`text-sm font-semibold ${r.redeemed ? "text-gray-400 line-through" : "text-gray-900"}`}>{r.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.redeemed ? p.rewardRedeemed : p.rewardAvailable}</p>
                </li>
              ))}
              {data.vouchers.map((v) => (
                <li key={v.code} className="rounded-xl p-3 border border-dashed border-gray-300">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Ticket size={12} /> {p.voucherTitle}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {v.type === "PercentageDiscount" ? `${v.percentageValue} %`
                      : v.type === "SessionPackage" ? fillTemplate(p.voucherSessionsTemplate, { n: v.remainingSessions ?? 0 })
                      : `${(v.remainingAmount ?? 0).toFixed(2).replace(".", ",")} €`}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{fillTemplate(p.voucherCodeTemplate, { code: v.code })}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Freundin einladen */}
        {data.referral && (
          <section className={card} data-testid="pass-referral">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Users size={14} style={{ color }} /> {p.inviteTitle}
            </h2>
            {data.referral.canInvite ? (
              <>
                <p className="mt-3 text-sm text-gray-700">{fillTemplate(p.inviteTextTemplate, { reward: data.referral.rewardText })}</p>
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full text-center rounded-xl py-3 text-sm font-semibold text-white bg-[#25D366]"
                    data-testid="pass-share-whatsapp"
                  >
                    {p.shareWhatsApp}
                  </a>
                  <button
                    type="button"
                    onClick={copyShare}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold border border-gray-200 text-gray-800"
                  >
                    {copied ? <><Check size={15} /> {p.linkCopied}</> : <><Link2 size={15} /> {p.copyLink}</>}
                  </button>
                </div>
                {data.referral.invitedCount > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    {fillTemplate(p.inviteStatsTemplate, { invited: data.referral.invitedCount, visits: data.referral.firstVisitsCount })}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-600">{p.inviteLocked}</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
