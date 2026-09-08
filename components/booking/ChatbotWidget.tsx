"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, Sparkles, Check, User, Users } from "lucide-react";
import {
  getChatbotBootstrap,
  sendChatbotMessage,
  type ChatbotRecommendedService,
  type ChatbotEmployeeOption,
  type ChatbotSlotOption,
  type ChatbotConfirmedBooking,
} from "@/lib/api/chatbot";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

type PendingAction =
  | { type: "none" }
  | { type: "services"; services: ChatbotRecommendedService[] }
  | { type: "employees"; employees: ChatbotEmployeeOption[] }
  | { type: "slots"; slots: ChatbotSlotOption[] }
  | { type: "contact" }
  | { type: "confirm" }
  | { type: "done"; booking: ChatbotConfirmedBooking };

// Agency-exclusive chat booking assistant — floating widget, bottom-right, shown only when the
// tenant has both an Agency plan AND the toggle in Links/Design settings turned on (both checked
// server-side by /chatbot/bootstrap). Sits alongside (never instead of) the existing click-through
// wizard. The whole flow — service recommendation, employee/slot picking, contact info, booking
// confirmation — happens in this one widget, driven entirely by what the server's response asks
// for next (PendingAction); this component holds the accumulated selection in state and resends
// it on each step, matching PublicAiChatbotController.SendMessage's stateless-per-request design.
export function ChatbotWidget({ slug }: { slug: string }) {
  const [enabled, setEnabled] = useState(false);
  const [disclosure, setDisclosure] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>({ type: "none" });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Accumulated selection, resent on every step per the backend's stateless design.
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>();
  const [anyEmployee, setAnyEmployee] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!slug) return;
    getChatbotBootstrap(slug).then((data) => {
      setEnabled(data.enabled);
      setDisclosure(data.aiDisclosure);
    });
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, sending, pending]);

  if (!enabled) return null;

  function applyResponse(res: Awaited<ReturnType<typeof sendChatbotMessage>>) {
    setConversationId(res.conversationId);
    setTurns((prev) => [...prev, { role: "assistant", content: res.reply }]);

    if (res.confirmedBooking) {
      setPending({ type: "done", booking: res.confirmedBooking });
      return;
    }
    if (res.bookingDraftId && !res.requiresCustomerInfo) {
      setPending({ type: "confirm" });
      return;
    }
    if (res.requiresCustomerInfo) {
      setPending({ type: "contact" });
      return;
    }
    if (res.slotOptions.length > 0) {
      setPending({ type: "slots", slots: res.slotOptions });
      return;
    }
    if (res.employeeOptions.length > 0) {
      setPending({ type: "employees", employees: res.employeeOptions });
      return;
    }
    if (res.recommendedServices.length > 0) {
      setPending({ type: "services", services: res.recommendedServices });
      return;
    }
    setPending({ type: "none" });
  }

  async function runStep(userBubble: string | null, payload: Parameters<typeof sendChatbotMessage>[1]) {
    setError(null);
    if (userBubble) setTurns((prev) => [...prev, { role: "user", content: userBubble }]);
    setSending(true);
    try {
      const res = await sendChatbotMessage(slug, { conversationId, ...payload });
      applyResponse(res);
    } catch (e: any) {
      setError(e.message || "Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await runStep(text, { message: text });
  }

  async function handleSelectService(service: ChatbotRecommendedService) {
    setSelectedServiceId(service.serviceId);
    setSelectedEmployeeId(undefined);
    setAnyEmployee(false);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    await runStep(`Ich möchte: ${service.serviceName}`, { selectedServiceId: service.serviceId });
  }

  async function handleSelectEmployee(employee: ChatbotEmployeeOption | null) {
    setSelectedEmployeeId(employee?.employeeId);
    setAnyEmployee(!employee);
    await runStep(
      employee ? `Bei ${employee.name}, bitte.` : "Egal, wer verfügbar ist.",
      { selectedServiceId, selectedEmployeeId: employee?.employeeId, anyEmployee: !employee },
    );
  }

  async function handleSelectSlot(slot: ChatbotSlotOption) {
    setSelectedDate(slot.date);
    setSelectedTime(slot.time);
    await runStep(slot.label, {
      selectedServiceId, selectedEmployeeId, anyEmployee, selectedDate: slot.date, selectedTime: slot.time,
    });
  }

  async function handleSubmitContact() {
    if (!contactFirstName.trim() || !contactLastName.trim()) {
      setError("Bitte Vor- und Nachname angeben.");
      return;
    }
    if (!contactEmail.trim() && !contactPhone.trim()) {
      setError("Bitte E-Mail oder Telefonnummer angeben.");
      return;
    }
    const customer = {
      firstName: contactFirstName.trim(), lastName: contactLastName.trim(),
      email: contactEmail.trim() || undefined, phone: contactPhone.trim() || undefined,
    };
    await runStep(`${customer.firstName} ${customer.lastName}${customer.email ? `, ${customer.email}` : ""}`, {
      selectedServiceId, selectedEmployeeId, anyEmployee, selectedDate, selectedTime, customer,
    });
  }

  async function handleConfirm() {
    await runStep("Ja, bitte buchen.", { confirmBooking: true });
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-[min(92vw,380px)] h-[min(75vh,560px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#6355E4] text-white shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={16} />
                <span className="text-sm font-semibold truncate">Wie können wir helfen?</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Chat schließen" className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {disclosure && <p className="text-[10px] text-gray-400 text-center">{disclosure}</p>}
              {turns.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-6">
                  Beschreib kurz, was du brauchst — wir empfehlen dir den passenden Service und buchen ihn direkt hier für dich.
                </p>
              )}
              {turns.map((turn, i) => (
                <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    turn.role === "user" ? "bg-[#6355E4] text-white" : "bg-white text-gray-800 border border-gray-200"
                  }`}>
                    {turn.content}
                  </div>
                </div>
              ))}

              {!sending && pending.type === "services" && (
                <div className="space-y-1.5">
                  {pending.services.map((s) => (
                    <button
                      key={s.serviceId}
                      onClick={() => handleSelectService(s)}
                      className="w-full text-left rounded-lg border border-[#6355E4]/30 bg-white px-3 py-2 text-xs text-[#6355E4] font-medium hover:bg-[#6355E4]/5 transition-colors"
                    >
                      {s.serviceName} · {s.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {s.currency} · {s.durationMinutes}min
                    </button>
                  ))}
                </div>
              )}

              {!sending && pending.type === "employees" && (
                <div className="space-y-1.5">
                  {pending.employees.map((e) => (
                    <button
                      key={e.employeeId}
                      onClick={() => handleSelectEmployee(e)}
                      className="w-full flex items-center gap-2 text-left rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 font-medium hover:border-[#6355E4]/40 transition-colors"
                    >
                      <User size={12} className="text-gray-400" /> {e.name}{e.role ? ` · ${e.role}` : ""}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSelectEmployee(null)}
                    className="w-full flex items-center gap-2 text-left rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 font-medium hover:border-[#6355E4]/40 transition-colors"
                  >
                    <Users size={12} className="text-gray-400" /> Egal, wer verfügbar ist
                  </button>
                </div>
              )}

              {!sending && pending.type === "slots" && (
                <div className="grid grid-cols-2 gap-1.5">
                  {pending.slots.map((s) => (
                    <button
                      key={`${s.date}-${s.time}`}
                      onClick={() => handleSelectSlot(s)}
                      className="rounded-lg border border-[#6355E4]/30 bg-white px-2.5 py-2 text-xs text-[#6355E4] font-medium hover:bg-[#6355E4]/5 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {!sending && pending.type === "contact" && (
                <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} placeholder="Vorname" className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs" />
                    <input value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} placeholder="Nachname" className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs" />
                  </div>
                  <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-Mail" type="email" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs" />
                  <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Telefon (optional)" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs" />
                  <button onClick={handleSubmitContact} className="w-full rounded-lg bg-[#6355E4] text-white text-xs font-semibold py-2 hover:bg-[#5646D6]">
                    Weiter
                  </button>
                </div>
              )}

              {!sending && pending.type === "confirm" && (
                <button onClick={handleConfirm} className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#6355E4] text-white text-xs font-semibold py-2.5 hover:bg-[#5646D6]">
                  <Check size={13} /> Jetzt verbindlich buchen
                </button>
              )}

              {pending.type === "done" && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                  <p className="font-semibold flex items-center gap-1"><Check size={13} /> Buchung bestätigt</p>
                  <p className="mt-1">{pending.booking.booking.serviceName} · {pending.booking.booking.bookingDate} {pending.booking.booking.startTime}</p>
                  <p className="text-green-600 mt-0.5">Buchungsnummer {pending.booking.bookingNumber}</p>
                </div>
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3 py-2 text-sm bg-white border border-gray-200 text-gray-400">…</div>
                </div>
              )}
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            </div>

            {pending.type !== "done" && (
              <div className="p-3 border-t border-gray-100 flex items-center gap-2 shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Deine Nachricht…"
                  disabled={sending}
                  className="flex-1 rounded-full border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:border-[#6355E4]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  aria-label="Senden"
                  className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-[#6355E4] text-white disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chat schließen" : "Chat öffnen"}
        className="flex items-center justify-center h-14 w-14 rounded-full bg-[#6355E4] text-white shadow-xl hover:bg-[#5646D6] transition-colors"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
