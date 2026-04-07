"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@nextui-org/input";
import { Checkbox } from "@nextui-org/checkbox";
import { MapPin, Sparkles, Calendar, Clock, User, AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { Service, CustomerInfo, Employee } from "@/lib/api/booking";
import { formatPrice } from "@/lib/utils/currency";

interface ContactFormProps {
  service: Service;
  selectedDate: string;
  selectedTime: string;
  selectedEmployee: Employee | null;
  customerInfo: CustomerInfo;
  onCustomerInfoChange: (info: CustomerInfo) => void;
  privacyAccepted: boolean;
  onPrivacyChange: (accepted: boolean) => void;
  onSubmitAttempt?: boolean;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function ContactForm({
  service,
  selectedDate,
  selectedTime,
  selectedEmployee,
  customerInfo,
  onCustomerInfoChange,
  privacyAccepted,
  onPrivacyChange,
  onSubmitAttempt = false,
  onBack,
  onSubmit,
  submitting,
}: ContactFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (!customerInfo.firstName.trim()) newErrors.firstName = "Vorname ist erforderlich";
    else if (customerInfo.firstName.length < 2) newErrors.firstName = "Mindestens 2 Zeichen";
    if (!customerInfo.lastName.trim()) newErrors.lastName = "Nachname ist erforderlich";
    else if (customerInfo.lastName.length < 2) newErrors.lastName = "Mindestens 2 Zeichen";
    if (!customerInfo.email.trim()) newErrors.email = "E-Mail ist erforderlich";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) newErrors.email = "Ungültige E-Mail";
    if (!customerInfo.phone.trim()) newErrors.phone = "Telefon ist erforderlich";
    else if (!/^[\d\s\+\-\(\)]{10,}$/.test(customerInfo.phone.replace(/\s/g, "")))
      newErrors.phone = "Mindestens 10 Ziffern";
    setErrors(newErrors);
  }, [customerInfo]);

  const handleBlur = (field: keyof CustomerInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof CustomerInfo) =>
    (touched[field] || onSubmitAttempt) && errors[field];

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

  const formatTimeRange = (time: string, duration: number) => {
    const [h, m] = time.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    const fmt = (d: Date) => d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} – ${fmt(end)} Uhr`;
  };

  const isFormValid = Object.keys(errors).length === 0 && privacyAccepted;
  const locationDisplay = selectedEmployee?.location || "Basel";

  return (
    <>
      <div className="space-y-6 pb-28">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">Kontaktdaten</h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">Schritt 4 von 4 – Geben Sie Ihre Kontaktdaten ein</p>
        </div>

        {/* Booking summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F5EDEB] rounded-xl p-4 sm:p-6 space-y-4 border-2 border-[#E8C7C3]/30"
        >
          <div className="flex items-start gap-3">
            <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
              <Calendar className="text-white" size={18} />
            </div>
            <div>
              <p className="text-xs text-[#8A8A8A]">Datum & Zeit</p>
              <p className="font-semibold text-[#1E1E1E] text-sm">{formatDate(selectedDate)}</p>
              <p className="flex items-center gap-1 text-[#8A8A8A] text-xs mt-0.5">
                <Clock size={12} />
                {formatTimeRange(selectedTime, service.durationMinutes)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
              <Sparkles className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#8A8A8A]">Behandlung</p>
              <p className="font-semibold text-[#1E1E1E] text-sm">{service.name}</p>
              <p className="text-[#8A8A8A] text-xs">{service.durationMinutes} Minuten</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-[#8A8A8A]">Preis</p>
              <p className="text-base font-bold text-[#E8C7C3]">{formatPrice(service.price, service.currency)}</p>
            </div>
          </div>

          {selectedEmployee && (
            <div className="flex items-start gap-3">
              <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
                <User className="text-white" size={18} />
              </div>
              <div>
                <p className="text-xs text-[#8A8A8A]">Fachkraft</p>
                <p className="font-semibold text-[#1E1E1E] text-sm">{selectedEmployee.name}</p>
                <p className="text-[#8A8A8A] text-xs">
                  {selectedEmployee.role}
                  {selectedEmployee.specialty && ` • ${selectedEmployee.specialty}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
              <MapPin className="text-white" size={18} />
            </div>
            <div>
              <p className="text-xs text-[#8A8A8A]">Standort</p>
              <p className="font-semibold text-[#1E1E1E] text-sm">{locationDisplay}</p>
              {!selectedEmployee?.location && (
                <p className="text-[#8A8A8A] text-xs">Elisabethenstrasse 41, 4051 Basel</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8C7C3]/30 flex justify-between items-center">
            <span className="font-medium text-[#1E1E1E] text-sm">Gesamtbetrag</span>
            <div className="text-right">
              <p className="text-lg font-bold text-[#E8C7C3]">{formatPrice(service.price, service.currency)}</p>
              <p className="text-xs text-[#8A8A8A]">Inkl. MwSt. • Zahlung vor Ort</p>
            </div>
          </div>
        </motion.div>

        {/* Error summary */}
        <AnimatePresence>
          {onSubmitAttempt && Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-semibold text-red-700 text-sm mb-1">Bitte korrigieren Sie folgende Fehler:</h4>
                  <ul className="text-sm text-red-600 list-disc list-inside space-y-0.5">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vorname*"
              placeholder="Max"
              value={customerInfo.firstName}
              onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, firstName: v })}
              onBlur={() => handleBlur("firstName")}
              errorMessage={showError("firstName") ? errors.firstName : ""}
              isInvalid={!!showError("firstName")}
              isRequired
              classNames={{
                input: "text-[#1E1E1E]",
                inputWrapper: ["border-2", showError("firstName") ? "border-red-500" : "border-[#E8C7C3]"],
                label: "text-[#8A8A8A] font-medium",
              }}
            />
            <Input
              label="Nachname*"
              placeholder="Mustermann"
              value={customerInfo.lastName}
              onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, lastName: v })}
              onBlur={() => handleBlur("lastName")}
              errorMessage={showError("lastName") ? errors.lastName : ""}
              isInvalid={!!showError("lastName")}
              isRequired
              classNames={{
                input: "text-[#1E1E1E]",
                inputWrapper: ["border-2", showError("lastName") ? "border-red-500" : "border-[#E8C7C3]"],
                label: "text-[#8A8A8A] font-medium",
              }}
            />
          </div>

          <Input
            type="email"
            label="E-Mail*"
            placeholder="max.mustermann@example.com"
            value={customerInfo.email}
            onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, email: v })}
            onBlur={() => handleBlur("email")}
            errorMessage={showError("email") ? errors.email : ""}
            isInvalid={!!showError("email")}
            isRequired
            classNames={{
              input: "text-[#1E1E1E]",
              inputWrapper: ["border-2", showError("email") ? "border-red-500" : "border-[#E8C7C3]"],
              label: "text-[#8A8A8A] font-medium",
            }}
          />

          <Input
            type="tel"
            label="Telefon*"
            placeholder="+41 123 456789"
            value={customerInfo.phone}
            onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, phone: v })}
            onBlur={() => handleBlur("phone")}
            errorMessage={showError("phone") ? errors.phone : ""}
            isInvalid={!!showError("phone")}
            isRequired
            classNames={{
              input: "text-[#1E1E1E]",
              inputWrapper: ["border-2", showError("phone") ? "border-red-500" : "border-[#E8C7C3]"],
              label: "text-[#8A8A8A] font-medium",
            }}
          />

          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Checkbox
                isSelected={privacyAccepted}
                onValueChange={onPrivacyChange}
                classNames={{ wrapper: "before:border-[#E8C7C3]", icon: "text-white" }}
              />
              <span className="text-sm text-[#6B6B6B] mt-0.5">
                Ich habe die{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8C7C3] underline hover:text-[#D8B0AC] transition-colors"
                >
                  Datenschutzhinweise
                </a>{" "}
                gelesen und stimme diesen zu. *
              </span>
            </div>
            {onSubmitAttempt && !privacyAccepted && (
              <p className="text-xs text-red-500 px-1">Bitte akzeptieren Sie die Datenschutzhinweise</p>
            )}
          </div>

        </div>
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t-2 border-[#E8C7C3]/30 shadow-2xl"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex-shrink-0 flex items-center gap-1 bg-[#F5EDEB] hover:bg-[#ede0dd] active:scale-95 text-[#1E1E1E] font-semibold py-3 px-4 rounded-xl transition-all"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Zurück</span>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8A8A8A]">Gesamtbetrag</p>
            <p className="font-bold text-[#1E1E1E] text-sm">{formatPrice(service.price, service.currency)}</p>
          </div>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] hover:from-[#D8B0AC] hover:to-[#c49590] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Wird gebucht...</span>
              </>
            ) : (
              <>
                Termin buchen
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
