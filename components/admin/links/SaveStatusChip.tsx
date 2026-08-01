// components/admin/links/SaveStatusChip.tsx
// Persistent save-status indicator — replaces the old toast-only save feedback.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import type { SaveStatus } from "./types";

export function SaveStatusChip({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
          status === "saving"
            ? "border-[#C7D2FE] bg-[#F8F7FF] text-[#6355E4]"
            : status === "saved"
              ? "border-[#BBF0E8] bg-[#EFFBF8] text-[#17A398]"
              : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
        }`}
      >
        {status === "saving" && (
          <>
            <Loader2 size={13} className="animate-spin" />
            Änderungen werden gespeichert …
          </>
        )}
        {status === "saved" && (
          <>
            <Check size={13} />
            Gespeichert
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle size={13} />
            Änderungen konnten nicht gespeichert werden
            <button
              onClick={onRetry}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#B91C1C]"
            >
              <RotateCcw size={11} />
              Erneut versuchen
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
