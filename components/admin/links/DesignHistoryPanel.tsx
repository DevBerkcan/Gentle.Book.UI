// components/admin/links/DesignHistoryPanel.tsx
// "Verlauf" — shows previous versions of the booking-page design (snapshotted server-side on
// every save, see lib/api/designHistory.ts) so a design change is never a one-way trip: the
// admin can see when something was changed and jump back to any earlier step.
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, History, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { getDesignHistory, restoreDesignVersion, type DesignHistoryEntry, type RestoredDesign } from "@/lib/api/designHistory";
import { PAGE_TEMPLATES } from "./constants";
import { useConfirm } from "@/components/ConfirmDialog";
import { useTranslation } from "@/lib/i18n/LanguageContext";

function timeAgo(dateStr: string, lang: string): string {
  const diffSec = (Date.now() - new Date(dateStr).getTime()) / 1000;
  const de = lang === "de";
  if (diffSec < 60) return de ? "gerade eben" : "just now";
  if (diffSec < 3600) return de ? `vor ${Math.floor(diffSec / 60)} Min.` : `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return de ? `vor ${Math.floor(diffSec / 3600)} Std.` : `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(dateStr).toLocaleString(de ? "de-DE" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function DesignHistoryPanel({
  open, onClose, onRestored,
}: {
  open: boolean;
  onClose: () => void;
  onRestored: (restored: RestoredDesign) => void;
}) {
  const { t, lang } = useTranslation();
  const s = t.admin.linksPage;
  const { confirm, dialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [entries, setEntries] = useState<DesignHistoryEntry[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);
    getDesignHistory()
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleRestore(entry: DesignHistoryEntry) {
    const ok = await confirm({
      title: s.replaceDesignConfirmTitle,
      message: s.restoreDesignConfirmMessage,
      confirmLabel: s.restoreBtn,
      cancelLabel: t.cancel,
      variant: "warning",
    });
    if (!ok) return;

    setRestoringId(entry.id);
    try {
      const restored = await restoreDesignVersion(entry.id);
      onRestored(restored);
      onClose();
    } catch {
      setError(true);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="history-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          {dialog}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-6 w-full max-w-md max-h-[80vh] flex flex-col gap-4 border border-[#E5E7EB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6355E4] flex items-center justify-center flex-shrink-0">
                  <History size={14} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#111318] text-sm leading-tight">{s.designHistoryTitle}</p>
                  <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.designHistorySubtitle}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label={t.close}
                className="text-gb-textMuted hover:text-[#374151] p-1.5 hover:bg-[#F3F4F6] rounded-xl transition-colors flex-shrink-0">
                <X size={17} />
              </button>
            </div>

            <div className="overflow-y-auto -mx-1 px-1 space-y-2">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-gb-textMuted py-6 justify-center">
                  <Loader2 size={13} className="animate-spin" /> {t.loading}
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2.5">
                  <AlertTriangle size={13} className="flex-shrink-0" /> {s.designHistoryErrorToast}
                </div>
              ) : entries.length === 0 ? (
                <p className="text-xs text-gb-textMuted text-center py-6">{s.designHistoryEmptyState}</p>
              ) : (
                entries.map((entry) => {
                  const template = entry.pageTemplate ? PAGE_TEMPLATES.find((p) => p.key === entry.pageTemplate) : null;
                  return (
                    <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] p-3">
                      <span className="w-6 h-6 rounded-full border border-[#E5E7EB] flex-shrink-0" style={{ backgroundColor: entry.primaryColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#111318] truncate">
                          {template ? `${template.emoji} ${template.name}` : s.designHistoryUnknownTemplate}
                        </p>
                        <p className="text-[11px] text-gb-textMuted">{timeAgo(entry.createdAt, lang)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestore(entry)}
                        disabled={restoringId !== null}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2.5 py-1.5 text-[11px] font-semibold text-[#374151] disabled:opacity-50"
                      >
                        {restoringId === entry.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} {s.restoreBtn}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
