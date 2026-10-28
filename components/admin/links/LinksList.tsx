// components/admin/links/LinksList.tsx
// The fixed booking-button row + the sortable, editable links list.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  GripVertical, Calendar, Link2, Plus, ArrowUp, ArrowDown, Check, X,
  Edit2, Trash2, ExternalLink,
} from "lucide-react";
import { ICON_MAP, getIconOptions } from "./shared";
import type { LinkItem } from "./types";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";

export function LinksList({
  ctaText, links, loading, showAddForm, onShowAddForm,
  editingId, setEditingId, editTitle, setEditTitle, editUrl, setEditUrl, editIcon, setEditIcon,
  saving, inputCls,
  startEdit, handleSaveEdit, handleDelete, handleToggleActive, moveLink,
}: {
  ctaText: string;
  links: LinkItem[];
  loading: boolean;
  showAddForm: boolean;
  onShowAddForm: () => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editUrl: string;
  setEditUrl: (v: string) => void;
  editIcon: string;
  setEditIcon: (v: string) => void;
  saving: boolean;
  inputCls: string;
  startEdit: (link: LinkItem) => void;
  handleSaveEdit: (id: string) => void;
  handleDelete: (id: string, title: string) => void;
  handleToggleActive: (link: LinkItem) => void;
  moveLink: (index: number, direction: "up" | "down") => void;
}) {
  const { t } = useTranslation();
  const s = t.admin.linksPage;
  const ICON_OPTIONS = getIconOptions(t);
  return (
    <>
      {/* ── Fixed Booking Button ─────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-[#E5E7EB] shadow-sm mb-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#6355E4] rounded-l-2xl" />
        <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
          <div className="flex-shrink-0 text-[#D1D5DB]"><GripVertical size={15} /></div>
          <div className="flex-shrink-0 p-2 rounded-xl bg-[#EEEBFC] text-[#6355E4]">
            <Calendar size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111318] text-sm">{ctaText || t.booking.bookAppointment}</p>
            <p className="text-xs text-gb-textMuted">{s.fixedLinkHint}</p>
          </div>
          <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] px-2.5 py-1 rounded-lg font-semibold">{s.fixedBadge}</span>
        </div>
      </div>

      {/* ── Links List ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-gb-textMuted">
          <div className="inline-block w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin mb-3" />
          <p className="text-sm">{s.loadingLinks}</p>
        </div>
      ) : links.length === 0 && !showAddForm ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-14 bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
          <Link2 size={32} className="text-[#E5E7EB] mx-auto mb-3" />
          <p className="text-[#111318] font-semibold text-sm">{s.noLinksYetTitle}</p>
          <p className="text-sm text-gb-textMuted mt-1 mb-5">{s.noLinksYetDesc}</p>
          <button onClick={onShowAddForm}
            className="inline-flex items-center gap-1.5 text-sm bg-[#6355E4] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#4338CA] transition-colors">
            <Plus size={13} />{s.addFirstLinkBtn}
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {links.map((link, i) => (
              <motion.div key={link.id} layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: link.isActive ? 1 : 0.5, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden hover:border-[#C7D2FE] hover:shadow-md transition-all duration-200"
              >
                {editingId === link.id ? (
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <select value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                        className="flex-shrink-0 border border-[#E5E7EB] rounded-xl px-2 py-2 text-sm bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all">
                        {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={s.titlePlaceholder} autoFocus
                        className={`flex-1 ${inputCls}`} />
                    </div>
                    <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder={s.urlPlaceholder}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(link.id)} className={inputCls} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-sm rounded-xl bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] font-medium transition-colors">
                        {t.cancel}
                      </button>
                      <button onClick={() => handleSaveEdit(link.id)} disabled={saving}
                        className="px-4 py-2 text-sm rounded-xl bg-[#6355E4] text-white font-semibold hover:bg-[#4338CA] disabled:opacity-40 flex items-center gap-1.5 transition-colors">
                        {saving
                          ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <Check size={13} />}
                        {t.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveLink(i, "up")} disabled={i === 0}
                        aria-label={fillTemplate(s.moveUpAriaTemplate, { title: link.title })}
                        className="p-1.5 -m-1.5 text-[#D1D5DB] hover:text-[#374151] disabled:opacity-20 transition-colors">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => moveLink(i, "down")} disabled={i === links.length - 1}
                        aria-label={fillTemplate(s.moveDownAriaTemplate, { title: link.title })}
                        className="p-1.5 -m-1.5 text-[#D1D5DB] hover:text-[#374151] disabled:opacity-20 transition-colors">
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    <div className="flex-shrink-0 p-2 rounded-xl bg-[#F3F4F6] text-[#6B7280]">
                      {ICON_MAP[link.iconType] ?? <ExternalLink size={17} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#111318] text-sm truncate">{link.title}</p>
                      <p className="text-xs text-gb-textMuted truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleToggleActive(link)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          link.isActive
                            ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]"
                            : "bg-[#F3F4F6] text-gb-textMuted hover:bg-[#E5E7EB]"
                        }`}>
                        {link.isActive ? s.activeLabel : s.offLabel}
                      </button>
                      <button onClick={() => startEdit(link)}
                        aria-label={fillTemplate(s.editLinkAriaTemplate, { title: link.title })}
                        className="p-1.5 text-gb-textMuted hover:text-[#6355E4] hover:bg-[#EEEBFC] transition-all rounded-lg">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(link.id, link.title)}
                        aria-label={fillTemplate(s.deleteLinkAriaTemplate, { title: link.title })}
                        className="p-1.5 text-gb-textMuted hover:text-[#EF4444] hover:bg-[#FEE2E2] transition-all rounded-lg">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {links.length > 0 && (
        <p className="text-xs text-center text-gb-textMuted mt-4">
          {fillTemplate(s.activeLinksCountTemplate, { active: links.filter((l) => l.isActive).length, total: links.length })}
        </p>
      )}
    </>
  );
}
