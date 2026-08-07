// app/admin/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Star, TrendingUp, AlertTriangle, Eye, EyeOff, MessageSquareOff } from "lucide-react";
import { adminApi, type AdminReview } from "@/lib/api/admin";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "text-amber-400" : "text-[#E5E7EB]"}
          fill={s <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const data = await adminApi.getReviews();
      setReviews(data);
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.feature) {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else {
        setError(err.response?.data?.message || err.message || "Fehler beim Laden der Bewertungen");
      }
    } finally { setLoading(false); }
  }

  async function togglePublish(review: AdminReview) {
    setUpdatingId(review.id);
    try {
      const { isPublished } = await adminApi.setReviewPublished(review.id, !review.isPublished);
      setReviews((prev) => prev?.map((r) => (r.id === review.id ? { ...r, isPublished } : r)) ?? null);
    } catch {
      // silently keep old state — user can retry
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#EEEBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={20} className="text-[#6355E4]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">Bewertungen</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-[#9CA3AF] mb-3">
              Dein aktueller Tarif: <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? "Automatische Bewertungsanfragen sind in deinem aktuellen Tarif nicht enthalten."}
          </p>
          <a href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors">
            <TrendingUp size={15} /> Jetzt upgraden
          </a>
        </div>
      </div>
    );
  }

  if (error || !reviews) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-sm">
          <div className="w-11 h-11 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={18} className="text-[#991B1B]" />
          </div>
          <p className="font-semibold text-[#111318] mb-1">Fehler beim Laden</p>
          <p className="text-sm text-[#6B7280]">{error || "Unbekannter Fehler"}</p>
        </div>
      </div>
    );
  }

  const publishedCount = reviews.filter((r) => r.isPublished).length;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "–";

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">Bewertungen</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Kunden werden nach einem abgeschlossenen Termin automatisch um eine Bewertung gebeten.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Gesamt</p>
            <p className="text-2xl font-bold text-[#111318]">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Ø Bewertung</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-[#111318]">{averageRating}</p>
              <Star size={16} className="text-amber-400" fill="currentColor" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Veröffentlicht</p>
            <p className="text-2xl font-bold text-[#111318]">{publishedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageSquareOff size={20} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">Noch keine Bewertungen</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Sobald Termine abgeschlossen werden, gehen hier Bewertungen ein.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {reviews.map((review) => (
                <div key={review.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <StarRow rating={review.rating} />
                      <span className="text-xs text-[#9CA3AF]">
                        {new Date(review.createdAt).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#111318]">
                      {review.customerName} <span className="text-[#9CA3AF] font-normal">· {review.serviceName}</span>
                    </p>
                    {review.comment && (
                      <p className="text-sm text-[#6B7280] mt-1.5">{review.comment}</p>
                    )}
                  </div>
                  <button
                    onClick={() => togglePublish(review)}
                    disabled={updatingId === review.id}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                      review.isPublished
                        ? "bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]"
                        : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {review.isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                    {review.isPublished ? "Veröffentlicht" : "Verborgen"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
