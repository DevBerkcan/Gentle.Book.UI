// components/admin/links/ToastStack.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ToastMessage } from "./types";

export function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div key={toast.id}
            initial={{ opacity: 0, x: 48, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium pointer-events-auto max-w-xs border ${
              toast.type === "success"
                ? "bg-white border-[#D1FAE5] text-[#065F46]"
                : "bg-white border-[#FEE2E2] text-[#991B1B]"
            }`}
          >
            {toast.type === "success"
              ? <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />
              : <AlertCircle size={15} className="text-[#EF4444] shrink-0" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
