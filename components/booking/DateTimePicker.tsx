"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { Button } from "@nextui-org/button";
import type { Service, TimeSlot, Employee } from "@/lib/api/booking";

interface DateTimePickerProps {
  service: Service;
  selectedEmployee: Employee | null;
  selectedDate: string | null;
  selectedTime: string | null;
  availableSlots: TimeSlot[];
  noSlotsMessage?: string | null;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onLoadSlots: (date: string, employeeId?: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function DateTimePicker({
  service,
  selectedEmployee,
  selectedDate,
  selectedTime,
  availableSlots,
  noSlotsMessage,
  onDateSelect,
  onTimeSelect,
  onLoadSlots,
  onNext,
  onBack,
  loading,
}: DateTimePickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatDayName = (date: Date) => date.toLocaleDateString("de-DE", { weekday: "short" });
  const formatDayNumber = (date: Date) => date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

  const goToPreviousWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSunday = (date: Date) => date.getDay() === 0;

  const isSlotPast = (slot: TimeSlot): boolean => {
    if (!selectedDate) return false;
    const now = new Date();
    const todayStr = formatDate(now);
    if (selectedDate !== todayStr) return false;
    const [hours, minutes] = slot.startTime.split(":").map(Number);
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    return slotTime <= now;
  };

  const canProceed = selectedDate !== null && selectedTime !== null;

  if (!selectedEmployee) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8A8A8A]">Bitte wählen Sie zuerst eine Fachkraft aus.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${canProceed ? "pb-28" : "pb-4"}`}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">
            Datum & Uhrzeit wählen
          </h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">
            Schritt 3 von 4 • {service.name} • {selectedEmployee.name}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button isIconOnly variant="flat" onPress={goToPreviousWeek} className="bg-[#F5EDEB]">
            <ChevronLeft size={20} />
          </Button>
          <div className="flex items-center gap-2 text-[#6B6B6B]">
            <Calendar size={18} />
            <span className="font-semibold text-sm sm:text-base">
              {currentWeekStart.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
              {" – "}
              {weekDays[6].toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
          <Button isIconOnly variant="flat" onPress={goToNextWeek} className="bg-[#F5EDEB]">
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((date, index) => {
            const dateStr = formatDate(date);
            const isSelected = selectedDate === dateStr;
            const isDisabled = isPast(date) || isSunday(date);

            return (
              <motion.button
                key={dateStr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (!isDisabled) {
                    onDateSelect(dateStr);
                    onLoadSlots(dateStr, selectedEmployee.id);
                  }
                }}
                disabled={isDisabled}
                className={`py-2 sm:py-3 px-1 sm:px-2 rounded-xl transition-all text-center ${
                  isSelected
                    ? "bg-[#E8C7C3] text-white shadow-lg scale-105"
                    : isDisabled
                    ? "bg-[#F5EDEB] text-[#8A8A8A] cursor-not-allowed opacity-50"
                    : "bg-white border-2 border-[#E8C7C3] hover:border-[#D8B0AC] hover:scale-105"
                }`}
              >
                <div className="text-xs font-medium mb-0.5">{formatDayName(date)}</div>
                <div className="text-sm font-bold">{formatDayNumber(date).split(".")[0]}</div>
                {isToday(date) && !isSelected && (
                  <div className="w-1.5 h-1.5 bg-[#E8C7C3] rounded-full mx-auto mt-1" />
                )}
              </motion.button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1E1E1E] text-sm sm:text-base">
              Verfügbare Zeiten am{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8C7C3] mx-auto" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 bg-[#F5EDEB] rounded-xl text-[#8A8A8A] text-sm">
                {noSlotsMessage ?? "Keine verfügbaren Termine an diesem Tag"}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableSlots.map((slot, index) => {
                  const slotDisabled = !slot.isAvailable || isSlotPast(slot);
                  return (
                    <motion.button
                      key={slot.startTime}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => !slotDisabled && onTimeSelect(slot.startTime)}
                      disabled={slotDisabled}
                      className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${
                        selectedTime === slot.startTime
                          ? "bg-[#E8C7C3] text-white shadow-lg scale-105"
                          : slotDisabled
                          ? "bg-[#F5EDEB] text-[#8A8A8A] cursor-not-allowed opacity-50"
                          : "bg-white border-2 border-[#E8C7C3] hover:border-[#D8B0AC] hover:scale-105"
                      }`}
                    >
                      {slot.startTime}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
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

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8A8A]">Ausgewählt</p>
                  <p className="font-bold text-[#1E1E1E] text-sm truncate">
                    {new Date(selectedDate! + "T00:00:00").toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    um {selectedTime}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[#8A8A8A]">
                    <Clock size={10} />
                    {service.durationMinutes} Min
                  </div>
                </div>
              </div>

              <button
                onClick={onNext}
                className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] hover:from-[#D8B0AC] hover:to-[#c49590] active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
              >
                Weiter
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
