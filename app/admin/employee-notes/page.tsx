"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import api from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface SentNote {
  id: number;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function EmployeeNotesPage() {
  const { isEmployee, isTenantAdmin } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // TenantAdmin should use the inbox instead
  useEffect(() => {
    if (isTenantAdmin) router.replace("/admin/inbox");
  }, [isTenantAdmin, router]);

  const [subject, setSubject] = useState(t.admin.subjectOptions[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentNotes, setSentNotes] = useState<SentNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const fetchSentNotes = async () => {
    try {
      const res = await api.get("/employee-notes");
      setSentNotes(res.data?.data ?? res.data ?? []);
    } catch {
      // no notes yet
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchSentNotes();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post("/employee-notes", { subject, message });
      setSent(true);
      setMessage("");
      toast.success(t.admin.noteSent);
      fetchSentNotes();
      setTimeout(() => setSent(false), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t.error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (!isEmployee) return null;

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111318] flex items-center gap-2">
            <MessageSquare size={24} className="text-[#6355E4]" />
            {t.admin.noteToAdmin}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">{t.admin.noteSentDesc}</p>
        </div>

        {/* Compose */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-[#374151]">{t.admin.noteNew}</p>

          {/* Subject select */}
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111318] pr-10 focus:outline-none focus:ring-2 focus:ring-[#6355E4]/30 focus:border-[#6355E4] transition-all"
            >
              {t.admin.subjectOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>

          {/* Message textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.admin.noteMessagePlaceholder}
            rows={5}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111318] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#6355E4]/30 focus:border-[#6355E4] transition-all"
          />

          {/* Send button */}
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-green-600 font-medium text-sm"
              >
                <CheckCircle size={18} />
                {t.admin.noteSent}
              </motion.div>
            ) : (
              <motion.button
                key="send"
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(to right, #6355E4, #17A398)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {sending ? t.admin.noteSending : t.admin.noteSend}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Sent notes history */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#374151]">{t.admin.noteHistory}</p>

          {loadingNotes ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-[#6355E4]/30 border-t-[#6355E4] rounded-full animate-spin" />
            </div>
          ) : sentNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
              <MessageSquare size={32} className="text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">{t.admin.noteNoSent}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{t.admin.noteNoSentDesc}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sentNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-4 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#111318] truncate">{note.subject}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        note.isRead
                          ? "bg-green-100 text-green-700"
                          : "bg-[#EEEBFC] text-[#6355E4]"
                      }`}>
                        {note.isRead ? t.admin.noteRead : t.admin.noteUnread}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{note.message}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#9CA3AF] flex-shrink-0">
                    <Clock size={11} />
                    {formatDate(note.createdAt)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
