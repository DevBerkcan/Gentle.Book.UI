// components/admin/links/DesignAssistantChat.tsx
// Agency-exclusive AI chat: the admin describes their business in free text, the model picks a
// matching page template + color palette + CTA text from the existing, fixed option sets (same
// safety pattern as the booking chatbot — the model never invents values, only selects from
// PAGE_TEMPLATES/COLOR_PALETTES below) and the admin applies the suggestion with one click.
// Non-Agency plans see a locked teaser instead (api/tenant/design-assistant would 402 anyway).
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Send, Lock, ArrowUpRight, Check } from "lucide-react";
import { sendDesignAssistantMessage, type DesignAssistantHistoryTurn, type DesignSuggestion } from "@/lib/api/designAssistant";
import { PAGE_TEMPLATES, COLOR_PALETTES } from "./constants";
import type { PlanTier } from "./types";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

const MAX_MESSAGE_LENGTH = 800;

function getQuickPrompts(t: Translations): string[] {
  const s = t.admin.linksPage;
  return [s.quickPrompt1, s.quickPrompt2, s.quickPrompt3];
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  suggestion?: DesignSuggestion | null;
  appliedKey?: string;
}

function suggestionIsEmpty(s: DesignSuggestion | null | undefined): boolean {
  if (!s) return true;
  return !s.pageTemplate && !s.colorPaletteKey && !s.ctaText && !s.ctaBadge;
}

function SuggestionCard({ suggestion, onApply, applied }: { suggestion: DesignSuggestion; onApply: () => void; applied: boolean }) {
  const { t } = useTranslation();
  const s = t.admin.linksPage;
  const tpl = suggestion.pageTemplate ? PAGE_TEMPLATES.find((tp) => tp.key === suggestion.pageTemplate) : null;
  const palette = suggestion.colorPaletteKey ? COLOR_PALETTES.find((p) => p.key === suggestion.colorPaletteKey) : null;

  return (
    <div className="mt-2 rounded-xl border border-[#E5E7EB] bg-[#F8F7FF] p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tpl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-full px-2 py-1">
            {tpl.emoji} {tpl.name}
          </span>
        )}
        {palette && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-full px-2 py-1">
            <span className="w-3 h-3 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: palette.primary }} />
            {palette.name}
          </span>
        )}
        {suggestion.ctaText && (
          <span className="text-[11px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-full px-2 py-1">
            „{suggestion.ctaText}"{suggestion.ctaBadge ? ` · ${suggestion.ctaBadge}` : ""}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={applied}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5548CE] disabled:opacity-60"
      >
        {applied ? <Check size={12} /> : <Sparkles size={12} />}
        {applied ? s.suggestionApplied : s.applySuggestionBtn}
      </button>
    </div>
  );
}

export function DesignAssistantChat({
  tenantPlan,
  onApplySuggestion,
  showToast,
}: {
  tenantPlan: PlanTier;
  onApplySuggestion: (suggestion: DesignSuggestion) => void;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const s = t.admin.linksPage;
  const QUICK_PROMPTS = getQuickPrompts(t);
  const isAgency = tenantPlan === "business";

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    if (content.length > MAX_MESSAGE_LENGTH) {
      showToast("error", fillTemplate(s.messageTooLongTemplate, { max: MAX_MESSAGE_LENGTH }));
      return;
    }

    const history: DesignAssistantHistoryTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendDesignAssistantMessage(content, history);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, suggestion: res.suggestion }]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? s.assistantUnavailable;
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleApply(turnIndex: number, suggestion: DesignSuggestion) {
    onApplySuggestion(suggestion);
    setMessages((prev) => prev.map((m, i) => (i === turnIndex ? { ...m, appliedKey: suggestion.pageTemplate ?? suggestion.colorPaletteKey ?? "applied" } : m)));
    showToast("success", s.suggestionAppliedToast);
  }

  if (!isAgency) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#14162B] flex items-center justify-center flex-shrink-0">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#111318] text-sm leading-tight">{s.aiDesignAssistantTitle}</p>
            <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.aiAssistantLockedSubtitle}</p>
          </div>
        </div>
        <div className="rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] p-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#6B7280] leading-relaxed flex items-center gap-1.5">
            <Lock size={12} className="text-gb-textMuted flex-shrink-0" />
            {fillTemplate(s.aiAssistantAvailableFromTemplate, { plan: "Agency" })}
          </p>
          <button
            onClick={() => router.push("/admin/subscription")}
            className="inline-flex items-center gap-1 rounded-lg bg-[#6355E4] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5245D0] flex-shrink-0"
          >
            {s.upgradeNowBtn} <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#6355E4] flex items-center justify-center flex-shrink-0">
          <Sparkles size={13} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">{s.aiDesignAssistantTitle}</p>
          <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.aiAssistantUnlockedSubtitle}</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              className="text-[11px] font-medium text-[#6355E4] bg-[#F8F7FF] border border-[#E5E7EB] rounded-full px-2.5 py-1 hover:bg-[#EEEBFC]"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-72 overflow-y-auto space-y-2.5 rounded-xl bg-[#F7F7F8] p-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user" ? "bg-[#6355E4] text-white" : "bg-white border border-[#E5E7EB] text-[#374151]"
              }`}>
                <p>{m.content}</p>
                {!suggestionIsEmpty(m.suggestion) && (
                  <SuggestionCard suggestion={m.suggestion!} applied={!!m.appliedKey} onApply={() => handleApply(i, m.suggestion!)} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2">
                <Loader2 size={13} className="animate-spin text-[#6355E4]" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={s.assistantInputPlaceholder}
          disabled={loading}
          className="flex-1 border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-gb-textMuted focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#6355E4] text-white hover:bg-[#5548CE] disabled:opacity-50 flex-shrink-0"
          aria-label={s.sendAriaLabel}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
