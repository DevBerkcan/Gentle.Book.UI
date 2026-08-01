// components/admin/links/QrCodeModal.tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Download, Copy, Check as CheckIcon } from "lucide-react";
import QRCodeSVG from "react-qr-code";

export function QrCodeModal({
  open, onClose, tenantSlug,
}: { open: boolean; onClose: () => void; tenantSlug: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <AnimatePresence>
      {open && tenantSlug && (() => {
        const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${tenantSlug}`;
        const handleCopy = () => {
          navigator.clipboard.writeText(bookingUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };
        const handleDownload = () => {
          const svg = document.getElementById("qr-svg");
          if (!svg) return;
          const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
          a.download = `${tenantSlug}-qrcode.svg`; a.click();
        };
        return (
          <motion.div key="qr-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-7 w-full max-w-sm flex flex-col items-center gap-5 border border-[#E5E7EB]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="font-semibold text-[#111318] text-base">QR-Code</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Zum Scannen & Teilen</p>
                </div>
                <button onClick={onClose}
                  className="text-[#9CA3AF] hover:text-[#374151] p-1.5 hover:bg-[#F3F4F6] rounded-xl transition-colors">
                  <X size={17} />
                </button>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB]">
                <QRCodeSVG id="qr-svg" value={bookingUrl} size={200} fgColor="#111318" bgColor="#ffffff" level="M" />
              </div>
              <div className="w-full bg-[#F7F7F8] rounded-xl px-3 py-2.5 flex items-center gap-2 border border-[#E5E7EB]">
                <p className="flex-1 text-xs text-[#6B7280] truncate font-mono">{bookingUrl}</p>
                <button onClick={handleCopy}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    copied ? "bg-[#D1FAE5] text-[#065F46]" : "bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F7F7F8]"
                  }`}>
                  {copied ? <><CheckIcon size={11} />Kopiert</> : <><Copy size={11} />Kopieren</>}
                </button>
              </div>
              <button onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#6355E4] text-white hover:bg-[#4338CA] transition-colors">
                <Download size={14} />SVG herunterladen
              </button>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
