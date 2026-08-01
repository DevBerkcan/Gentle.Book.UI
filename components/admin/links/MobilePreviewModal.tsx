// components/admin/links/MobilePreviewModal.tsx
// Bottom-sheet live preview for small screens (desktop uses LivePreviewPanel instead).
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, X } from "lucide-react";

export function MobilePreviewModal({
  open, onClose, previewUrl, previewKey,
}: { open: boolean; onClose: () => void; previewUrl: string; previewKey: number }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="preview-modal"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="flex flex-col bg-white rounded-t-3xl overflow-hidden flex-1 mt-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3F4F6]">
              <p className="font-semibold text-sm text-[#111318] flex items-center gap-2">
                <Eye size={13} className="text-[#6355E4]" />Live-Vorschau
              </p>
              <button onClick={onClose}
                className="text-[#9CA3AF] hover:text-[#374151] p-1.5 hover:bg-[#F3F4F6] rounded-xl transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe key={previewKey}
                src={`${previewUrl}?v=${previewKey}`}
                className="w-full h-full" style={{ border: "none", height: "100%" }}
                title="Buchungsseite Vorschau" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
