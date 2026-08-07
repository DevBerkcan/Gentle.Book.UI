// components/admin/customers/CustomerLoyaltyPanel.tsx
// Point balance + ledger + manual adjustment, shown in the customer detail modal.
// Self-contained: silently renders nothing if the tenant isn't on the Agency plan (402).
"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, Plus, Minus } from "lucide-react";
import { adminApi, type LoyaltyTransaction } from "@/lib/api/admin";

export function CustomerLoyaltyPanel({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [amount, setAmount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomerLoyalty(customerId);
      setPoints(data.points);
      setHistory(data.history);
      setAvailable(true);
    } catch (err: any) {
      if (err?.response?.status === 402) setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  async function adjust(direction: 1 | -1) {
    if (amount <= 0) return;
    setError(null);
    setSaving(true);
    try {
      const result = await adminApi.adjustCustomerLoyalty(customerId, direction * amount, "manual_redemption");
      setPoints(result.points);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Anpassung fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20 flex items-center gap-2 text-xs text-[#8A8A8A]">
        <Loader2 size={13} className="animate-spin" /> Lade Treuepunkte…
      </div>
    );
  }

  if (!available) return null;

  return (
    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
          <Gift size={14} className="text-[#6355E4]" /> Treuepunkte
        </h3>
        <p className="text-lg font-bold text-[#6355E4]">{points} Pkt.</p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-20 border border-[#ECEBF2] bg-white rounded-lg px-2.5 py-1.5 text-sm text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25"
          disabled={saving}
        />
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#ECEBF2] px-2.5 py-1.5 text-xs font-semibold text-[#065F46] hover:bg-[#D1FAE5] disabled:opacity-50"
        >
          <Plus size={12} /> Gutschreiben
        </button>
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={saving || points < amount}
          className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#ECEBF2] px-2.5 py-1.5 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50"
        >
          <Minus size={12} /> Abziehen
        </button>
      </div>

      {error && <p className="text-xs text-[#991B1B] mb-2">{error}</p>}

      {history.length > 0 && (
        <div className="space-y-1 mt-3 max-h-32 overflow-y-auto">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5">
              <span className="text-[#8A8A8A]">
                {new Date(h.createdAt).toLocaleDateString("de-DE")} · {h.reason === "booking_completed" ? "Termin abgeschlossen" : h.reason === "manual_redemption" ? "Manuelle Anpassung" : h.reason}
              </span>
              <span className={h.points >= 0 ? "text-[#065F46] font-semibold" : "text-[#991B1B] font-semibold"}>
                {h.points >= 0 ? "+" : ""}{h.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
