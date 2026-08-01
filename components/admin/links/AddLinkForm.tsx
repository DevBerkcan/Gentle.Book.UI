// components/admin/links/AddLinkForm.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ICON_OPTIONS } from "./shared";

export function AddLinkForm({
  open, onClose, saving, inputCls,
  newIcon, setNewIcon, newTitle, setNewTitle, newUrl, setNewUrl, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  inputCls: string;
  newIcon: string;
  setNewIcon: (v: string) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newUrl: string;
  setNewUrl: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="mb-4 bg-white rounded-2xl border border-[#C7D2FE] shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#111318] text-sm">Neuer Link</p>
            <button onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#374151] p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                className="flex-shrink-0 border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all">
                {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titel (z.B. Instagram)" autoFocus
                className={`flex-1 ${inputCls}`} />
            </div>
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://www.instagram.com/..."
              onKeyDown={(e) => e.key === "Enter" && onCreate()} className={inputCls} />
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { onClose(); setNewTitle(""); setNewUrl(""); }}
                className="px-4 py-2 text-sm rounded-xl bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] font-medium transition-colors">
                Abbrechen
              </button>
              <ShimmerButton onClick={onCreate} disabled={saving || !newTitle.trim() || !newUrl.trim()}
                className="px-5 py-2 text-sm rounded-xl disabled:opacity-40 flex items-center gap-1.5 bg-[#6355E4] text-white hover:bg-[#4338CA]"
                shimmerDuration="2.5s">
                {saving
                  ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Plus size={13} />}
                Hinzufügen
              </ShimmerButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
