"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@nextui-org/input";
import { Checkbox } from "@nextui-org/checkbox";
import { MapPin, Sparkles, Calendar, Clock, User, AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { Service, CustomerInfo, Employee } from "@/lib/api/booking";
import { formatPrice } from "@/lib/utils/currency";
import { useTranslation } from "@/lib/i18n/LanguageContext";

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
  submitError?: string | null;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  primaryColor?: string;
  tenantAddress?: string | null;
}

function lighten(hex: string, amount = 0.85) {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return "#F6F5FA"; }
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
  submitError,
  onBack,
  onSubmit,
  submitting,
  primaryColor = "#6355E4",
  tenantAddress,
}: ContactFormProps) {
  const { t, lang } = useTranslation();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lightBg    = lighten(primaryColor, 0.92);
  const veryLight  = lighten(primaryColor, 0.88);
  const borderRgba = `${primaryColor}4D`;
  const locale = lang === "en" ? "en-GB" : "de-DE";

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (!customerInfo.firstName.trim()) newErrors.firstName = t.booking.firstNameRequired;
    else if (customerInfo.firstName.length < 2) newErrors.firstName = t.booking.firstNameMinLength;
    if (!customerInfo.lastName.trim()) newErrors.lastName = t.booking.lastNameRequired;
    else if (customerInfo.lastName.length < 2) newErrors.lastName = t.booking.lastNameMinLength;
    if (!customerInfo.email.trim()) newErrors.email = t.booking.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) newErrors.email = t.booking.emailInvalid;
    if (!customerInfo.phone.trim()) newErrors.phone = t.booking.phoneRequired;
    else if (!/^[\d\s\+\-\(\)]{10,}$/.test(customerInfo.phone.replace(/\s/g, "")))
      newErrors.phone = t.booking.phoneMinLength;
    setErrors(newErrors);
  }, [customerInfo, t]);

  const handleBlur = (field: keyof CustomerInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof CustomerInfo) =>
    (touched[field] || onSubmitAttempt) && errors[field];

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString(locale, {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

  const formatTimeRange = (time: string, duration: number) => {
    const [h, m] = time.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    const fmt = (d: Date) => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    return lang === "en" ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – ${fmt(end)} Uhr`;
  };

  const isFormValid = Object.keys(errors).length === 0 && privacyAccepted;

  const locationLine1 = selectedEmployee?.location ?? null;
  const locationLine2 = !locationLine1 && tenantAddress ? tenantAddress : null;
  const showLocation = !!(locationLine1 || locationLine2);

  return (
    <>
      <div className="space-y-6 pb-28">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#14162B] mb-2">{t.booking.contactData}</h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">{t.booking.step4of4}</p>
        </div>

        {/* Booking summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 sm:p-6 space-y-4"
          style={{ backgroundColor: lightBg, border: `2px solid ${borderRgba}` }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
              <Calendar className="text-white" size={18} />
            </div>
            <div>
              <p className="text-xs text-[#8A8A8A]">{t.booking.dateTime}</p>
              <p className="font-semibold text-[#14162B] text-sm">{formatDate(selectedDate)}</p>
              <p className="flex items-center gap-1 text-[#8A8A8A] text-xs mt-0.5">
                <Clock size={12} />
                {formatTimeRange(selectedTime, service.durationMinutes)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
              <Sparkles className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#8A8A8A]">{t.booking.treatmentLabel}</p>
              <p className="font-semibold text-[#14162B] text-sm">{service.name}</p>
              <p className="text-[#8A8A8A] text-xs">{service.durationMinutes} {t.booking.minutes}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-[#8A8A8A]">{t.admin.price}</p>
              <p className="text-base font-bold" style={{ color: primaryColor }}>{formatPrice(service.price, service.currency)}</p>
            </div>
          </div>

          {selectedEmployee && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <User className="text-white" size={18} />
              </div>
              <div>
                <p className="text-xs text-[#8A8A8A]">{t.booking.specialist}</p>
                <p className="font-semibold text-[#14162B] text-sm">{selectedEmployee.name}</p>
                <p className="text-[#8A8A8A] text-xs">
                  {selectedEmployee.role}
                  {selectedEmployee.specialty && ` • ${selectedEmployee.specialty}`}
                </p>
              </div>
            </div>
          )}

          {showLocation && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <MapPin className="text-white" size={18} />
              </div>
              <div>
                <p className="text-xs text-[#8A8A8A]">{t.booking.location}</p>
                {locationLine1 && (
                  <p className="font-semibold text-[#14162B] text-sm">{locationLine1}</p>
                )}
                {locationLine2 && (
                  <p className="font-semibold text-[#14162B] text-sm">{locationLine2}</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center" style={{ borderTop: `1px solid ${borderRgba}` }}>
            <span className="font-medium text-[#14162B] text-sm">{t.booking.totalAmount}</span>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: primaryColor }}>{formatPrice(service.price, service.currency)}</p>
              <p className="text-xs text-[#8A8A8A]">{t.booking.inclVat}</p>
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
                  <h4 className="font-semibold text-red-700 text-sm mb-1">{t.booking.errorFixFields}</h4>
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
              label={`${t.booking.firstName}*`}
              placeholder={lang === "en" ? "John" : "Max"}
              value={customerInfo.firstName}
              onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, firstName: v })}
              onBlur={() => handleBlur("firstName")}
              errorMessage={showError("firstName") ? errors.firstName : ""}
              isInvalid={!!showError("firstName")}
              isRequired
              classNames={{
                input: "text-[#14162B]",
                inputWrapper: ["border-2", showError("firstName") ? "border-red-500" : ""],
                label: "text-[#8A8A8A] font-medium",
              }}
              style={!showError("firstName") ? { "--tw-border-opacity": "1", borderColor: primaryColor } as any : {}}
            />
            <Input
              label={`${t.booking.lastName}*`}
              placeholder={lang === "en" ? "Smith" : "Mustermann"}
              value={customerInfo.lastName}
              onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, lastName: v })}
              onBlur={() => handleBlur("lastName")}
              errorMessage={showError("lastName") ? errors.lastName : ""}
              isInvalid={!!showError("lastName")}
              isRequired
              classNames={{
                input: "text-[#14162B]",
                inputWrapper: ["border-2", showError("lastName") ? "border-red-500" : ""],
                label: "text-[#8A8A8A] font-medium",
              }}
              style={!showError("lastName") ? { borderColor: primaryColor } as any : {}}
            />
          </div>

          <Input
            type="email"
            label={`${t.booking.email}*`}
            placeholder={lang === "en" ? "john.smith@example.com" : "max.mustermann@example.com"}
            value={customerInfo.email}
            onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, email: v })}
            onBlur={() => handleBlur("email")}
            errorMessage={showError("email") ? errors.email : ""}
            isInvalid={!!showError("email")}
            isRequired
            classNames={{
              input: "text-[#14162B]",
              inputWrapper: ["border-2", showError("email") ? "border-red-500" : ""],
              label: "text-[#8A8A8A] font-medium",
            }}
            style={!showError("email") ? { borderColor: primaryColor } as any : {}}
          />

          <Input
            type="tel"
            label={`${t.booking.phone}*`}
            placeholder="+41 123 456789"
            value={customerInfo.phone}
            onValueChange={(v) => onCustomerInfoChange({ ...customerInfo, phone: v })}
            onBlur={() => handleBlur("phone")}
            errorMessage={showError("phone") ? errors.phone : ""}
            isInvalid={!!showError("phone")}
            isRequired
            classNames={{
              input: "text-[#14162B]",
              inputWrapper: ["border-2", showError("phone") ? "border-red-500" : ""],
              label: "text-[#8A8A8A] font-medium",
            }}
            style={!showError("phone") ? { borderColor: primaryColor } as any : {}}
          />

          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Checkbox
                isSelected={privacyAccepted}
                onValueChange={onPrivacyChange}
                classNames={{ icon: "text-white" }}
                style={{ "--nextui-colors-primary": primaryColor } as any}
              />
              <span className="text-sm text-[#6B6B6B] mt-0.5">
                {t.booking.privacy}{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70 transition-opacity"
                  style={{ color: primaryColor }}
                >
                  {t.booking.privacyLink}
                </a>{" "}
                {t.booking.privacyAnd} *
              </span>
            </div>
            {onSubmitAttempt && !privacyAccepted && (
              <p className="text-xs text-red-500 px-1">{t.booking.acceptPrivacy}</p>
            )}
          </div>

        </div>
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-2xl"
        style={{ borderTop: `2px solid ${borderRgba}` }}
      >
        {(onSubmitAttempt && !isFormValid) && (
          <p className="text-center text-xs text-red-500 pt-2 px-4">
            {t.booking.errorFillAll}
          </p>
        )}
        {submitError && !(onSubmitAttempt && !isFormValid) && (
          <p className="text-center text-xs text-red-500 pt-2 px-4">{submitError}</p>
        )}
        <div className="max-w-3xl mx-auto flex items-center gap-3 p-4">
          <button
            onClick={onBack}
            className="flex-shrink-0 flex items-center gap-1 hover:opacity-80 active:scale-95 text-[#14162B] font-semibold py-3 px-4 rounded-xl transition-all"
            style={{ backgroundColor: veryLight }}
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">{t.back}</span>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8A8A8A]">{t.booking.totalAmount}</p>
            <p className="font-bold text-[#14162B] text-sm">{formatPrice(service.price, service.currency)}</p>
          </div>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-shrink-0 flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${lighten(primaryColor, 0.2)})`,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t.booking.booking}</span>
              </>
            ) : (
              <>
                {t.booking.bookAppointment}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
