"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Trash2, GripVertical, ExternalLink, Calendar,
  Instagram, MessageCircle, MapPin, Facebook, Youtube, Globe,
  Phone, Mail, Edit2, Check, X, Eye
} from "lucide-react";
import api from "@/lib/api/client";
import { useAuth } from "@/lib/contexts/AuthContext";

const ICON_OPTIONS = [
  { value: "Instagram",  label: "Instagram",   icon: <Instagram size={16} /> },
  { value: "WhatsApp",   label: "WhatsApp",    icon: <MessageCircle size={16} /> },
  { value: "GoogleMaps", label: "Google Maps", icon: <MapPin size={16} /> },
  { value: "Facebook",   label: "Facebook",    icon: <Facebook size={16} /> },
  { value: "TikTok",     label: "TikTok",      icon: <span className="text-xs font-bold">TT</span> },
  { value: "YouTube",    label: "YouTube",     icon: <Youtube size={16} /> },
  { value: "Website",    label: "Website",     icon: <Globe size={16} /> },
  { value: "Phone",      label: "Telefon",     icon: <Phone size={16} /> },
  { value: "Email",      label: "E-Mail",      icon: <Mail size={16} /> },
  { value: "Custom",     label: "Sonstiges",   icon: <ExternalLink size={16} /> },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={18} />,
  Instagram:  <Instagram size={18} />,
  WhatsApp:   <MessageCircle size={18} />,
  GoogleMaps: <MapPin size={18} />,
  Facebook:   <Facebook size={18} />,
  TikTok:     <span className="text-xs font-bold">TT</span>,
  YouTube:    <Youtube size={18} />,
  Website:    <Globe size={18} />,
  Phone:      <Phone size={18} />,
  Email:      <Mail size={18} />,
  Custom:     <ExternalLink size={18} />,
};

interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconType: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminLinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New link form state
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("Instagram");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const tenantSlug = (user as any)?.tenantSlug;

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const res = await api.get("/admin/links");
      setLinks(res.data);
    } catch {
      setError("Fehler beim Laden der Links");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/admin/links", {
        title: newTitle.trim(),
        url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
        iconType: newIcon,
      });
      setLinks((prev) => [...prev, res.data]);
      setNewTitle("");
      setNewUrl("");
      setNewIcon("Instagram");
      setShowAddForm(false);
    } catch {
      setError("Fehler beim Anlegen des Links");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Link wirklich löschen?")) return;
    try {
      await api.delete(`/admin/links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Fehler beim Löschen");
    }
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditIcon(link.iconType);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      const res = await api.put(`/admin/links/${id}`, {
        title: editTitle.trim(),
        url: editUrl.trim(),
        iconType: editIcon,
      });
      setLinks((prev) => prev.map((l) => (l.id === id ? res.data : l)));
      setEditingId(null);
    } catch {
      setError("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(link: LinkItem) {
    try {
      const res = await api.put(`/admin/links/${link.id}`, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? res.data : l)));
    } catch {
      setError("Fehler beim Aktualisieren");
    }
  }

  async function moveLink(index: number, direction: "up" | "down") {
    const newLinks = [...links];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks);
    try {
      await api.patch("/admin/links/reorder", newLinks.map((l) => l.id));
    } catch {
      setError("Fehler beim Sortieren");
    }
  }

  return (
    <div className="min-h-screen bg-[#F5EDEB] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Meine Links</h1>
            <p className="text-sm text-[#8A8A8A] mt-1">Verwalte dein öffentliches Profil</p>
          </div>
          <div className="flex gap-2">
            {tenantSlug && (
              <a
                href={`/booking/${tenantSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm bg-white text-[#1E1E1E] px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Eye size={15} />
                <span className="hidden sm:inline">Vorschau</span>
              </a>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm bg-[#E8C7C3] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#D8B0AC] transition-colors"
            >
              <Plus size={16} />
              Link hinzufügen
            </button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between"
            >
              {error}
              <button onClick={() => setError(null)}><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Booking Button (informational) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-shrink-0 text-gray-300">
              <GripVertical size={16} />
            </div>
            <div className="flex-shrink-0 p-2 rounded-xl bg-[#E8C7C3] text-white">
              <Calendar size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E1E1E] text-sm">Termin buchen</p>
              <p className="text-xs text-[#8A8A8A]">Immer erster Link · automatisch</p>
            </div>
            <span className="text-xs bg-[#F5EDEB] text-[#E8C7C3] px-2 py-1 rounded-lg font-medium">Fest</span>
          </div>
        </div>

        {/* Links list */}
        {loading ? (
          <div className="text-center py-12 text-[#8A8A8A]">Lade Links…</div>
        ) : links.length === 0 && !showAddForm ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
            <Link2 size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#8A8A8A] font-medium">Noch keine Links</p>
            <p className="text-sm text-gray-400 mt-1">Füge Instagram, WhatsApp oder andere Links hinzu</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-[#E8C7C3] text-sm font-semibold hover:underline"
            >
              + Ersten Link hinzufügen
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {links.map((link, i) => (
              <motion.div
                key={link.id}
                layout
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  link.isActive ? "border-gray-100" : "border-gray-100 opacity-50"
                }`}
              >
                {editingId === link.id ? (
                  /* Edit form */
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <select
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white"
                      >
                        {ICON_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Titel"
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                      />
                    </div>
                    <input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >Abbrechen</button>
                      <button
                        onClick={() => handleSaveEdit(link.id)}
                        disabled={saving}
                        className="px-4 py-2 text-sm rounded-xl bg-[#E8C7C3] text-white font-semibold hover:bg-[#D8B0AC] disabled:opacity-50"
                      >
                        <Check size={14} className="inline mr-1" />Speichern
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View row */
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveLink(i, "up")} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20">▲</button>
                      <button onClick={() => moveLink(i, "down")} disabled={i === links.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20">▼</button>
                    </div>
                    <div className="flex-shrink-0 p-2 rounded-xl bg-[#E8C7C3]/10 text-[#E8C7C3]">
                      {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1E1E1E] text-sm truncate">{link.title}</p>
                      <p className="text-xs text-[#8A8A8A] truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(link)}
                        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                          link.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {link.isActive ? "Aktiv" : "Aus"}
                      </button>
                      <button
                        onClick={() => startEdit(link)}
                        className="p-1.5 text-gray-400 hover:text-[#E8C7C3] transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Link Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-3 bg-white rounded-2xl shadow-sm border border-[#E8C7C3]/30 p-4 flex flex-col gap-3"
            >
              <p className="font-semibold text-[#1E1E1E] text-sm">Neuer Link</p>
              <div className="flex gap-2">
                <select
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="flex-shrink-0 border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white"
                >
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Titel (z.B. Instagram)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
                />
              </div>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://www.instagram.com/..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C7C3]/50"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddForm(false); setNewTitle(""); setNewUrl(""); }}
                  className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
                >Abbrechen</button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !newTitle.trim() || !newUrl.trim()}
                  className="px-4 py-2 text-sm rounded-xl bg-[#E8C7C3] text-white font-semibold hover:bg-[#D8B0AC] disabled:opacity-50"
                >
                  <Plus size={14} className="inline mr-1" />Hinzufügen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
