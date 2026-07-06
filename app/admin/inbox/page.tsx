"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import api from "@/lib/api/client";
import { motion } from "framer-motion";
import { Inbox, Clock, CheckCircle, Circle, User } from "lucide-react";
import { toast } from "sonner";

interface AdminNote {
  id: number;
  employeeName: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function AdminInboxPage() {
  const { isEmployee, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isEmployee) router.replace("/admin/calendar");
  }, [isEmployee, router]);

  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchNotes = async () => {
    try {
      const res = await api.get("/admin/employee-notes");
      setNotes(res.data?.data ?? res.data ?? []);
    } catch {
      // no notes
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchNotes();
  }, [isAuthenticated]);

  const markRead = async (id: number) => {
    try {
      await api.put(`/admin/employee-notes/${id}/read`);
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error(t.error);
    }
  };

  const handleExpand = (note: AdminNote) => {
    setExpanded(expanded === note.id ? null : note.id);
    if (!note.isRead) markRead(note.id);
  };

  const unreadCount = notes.filter((n) => !n.isRead).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (isEmployee) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111318] flex items-center gap-2">
              <Inbox size={24} className="text-[#6355E4]" />
              {t.admin.inboxTitle}
              {unreadCount > 0 && (
                <span className="ml-1 text-xs font-bold bg-[#6355E4] text-white px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">{t.admin.noteNoMessagesDesc}</p>
          </div>
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-6 h-6 border-2 border-[#6355E4]/30 border-t-[#6355E4] rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <Inbox size={40} className="text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#374151]">{t.admin.noteNoMessages}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{t.admin.noteNoMessagesDesc}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border transition-all cursor-pointer ${
                  note.isRead ? "border-[#E5E7EB]" : "border-[#6355E4]/30 shadow-sm shadow-[#6355E4]/10"
                }`}
                onClick={() => handleExpand(note)}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Read indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {note.isRead
                      ? <CheckCircle size={16} className="text-[#9CA3AF]" />
                      : <Circle size={16} className="text-[#6355E4] fill-[#6355E4]" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                        <User size={11} />
                        {note.employeeName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        note.isRead
                          ? "bg-[#F3F4F6] text-[#9CA3AF]"
                          : "bg-[#EEEBFC] text-[#6355E4]"
                      }`}>
                        {note.isRead ? t.admin.noteRead : t.admin.noteUnread}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#111318] truncate">{note.subject}</p>
                    {expanded !== note.id && (
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{note.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#9CA3AF] flex-shrink-0">
                    <Clock size={11} />
                    {formatDate(note.createdAt)}
                  </div>
                </div>

                {/* Expanded message */}
                {expanded === note.id && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="ml-8 bg-[#F9FAFB] rounded-xl px-4 py-3 text-sm text-[#374151] leading-relaxed">
                      {note.message}
                    </div>
                    {!note.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(note.id); }}
                        className="ml-8 mt-2 text-xs text-[#6355E4] hover:underline"
                      >
                        {t.admin.noteMarkRead}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
