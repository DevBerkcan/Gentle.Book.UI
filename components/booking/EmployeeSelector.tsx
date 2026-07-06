"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@nextui-org/card";
import { User, Star, Loader2, MapPin, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { getEmployeesByService, type Employee, type Service } from "@/lib/api/booking";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface EmployeeSelectorProps {
  selectedService: Service | null;
  selectedEmployee: Employee | null;
  onSelect: (employee: Employee) => void;
  onNext: () => void;
  onBack: () => void;
  tenantSlug?: string;
  primaryColor?: string;
}

function lighten(hex: string, amount = 0.85) {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return "#F5EDEB"; }
}

export function EmployeeSelector({
  selectedService,
  selectedEmployee,
  onSelect,
  onNext,
  onBack,
  tenantSlug,
  primaryColor = "#E8C7C3",
}: EmployeeSelectorProps) {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const lightBg = lighten(primaryColor, 0.90);

  const handleSelect = useCallback((employee: Employee) => { onSelect(employee); }, [onSelect]);

  useEffect(() => {
    let isMounted = true;
    async function loadEmployees() {
      if (!selectedService?.id) {
        if (isMounted) { setError(t.booking.noServiceSelected); setLoading(false); }
        return;
      }
      if (isMounted) { setLoading(true); setError(null); }
      try {
        const data = await getEmployeesByService(selectedService.id, tenantSlug);
        if (isMounted) {
          setEmployees(data);
          if (data.length === 1 && !hasAutoSelected && !selectedEmployee) {
            setHasAutoSelected(true);
            handleSelect(data[0]);
          }
        }
      } catch {
        if (isMounted) setError(t.booking.errorLoadingEmployees);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadEmployees();
    return () => { isMounted = false; };
  }, [selectedService?.id, handleSelect, hasAutoSelected, selectedEmployee]);

  useEffect(() => { setHasAutoSelected(false); }, [selectedService?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={32} style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button onClick={onBack} className="mt-4 transition-colors" style={{ color: primaryColor }}>
          {t.booking.backToServices}
        </button>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8A8A8A] mb-4">{t.booking.noEmployeesAvailable}</p>
        <button onClick={onBack} className="transition-colors underline" style={{ color: primaryColor }}>
          {t.booking.chooseOtherService}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 px-4 sm:px-0 ${selectedEmployee ? "pb-28" : "pb-4"}`}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">{t.booking.chooseEmployee}</h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">{t.booking.step2of4}</p>
          {selectedService && (
            <p className="text-xs mt-1" style={{ color: primaryColor }}>{t.booking.for}: {selectedService.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:gap-3">
          {employees.map((emp) => {
            const isSelected = selectedEmployee?.id === emp.id;
            return (
              <Card
                key={emp.id}
                isPressable
                onPress={() => handleSelect(emp)}
                className="w-full transition-all"
                style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${primaryColor}` } : undefined}
                fullWidth
              >
                <CardBody className="p-3 sm:p-4 w-full">
                  <div className="flex items-start gap-3 sm:gap-4 w-full">
                    <div
                      className="flex-shrink-0 p-2 sm:p-3 rounded-xl transition-colors"
                      style={{ backgroundColor: isSelected ? primaryColor : `${primaryColor}1A` }}
                    >
                      <User className={isSelected ? "text-white" : ""} size={20} style={!isSelected ? { color: primaryColor } : {}} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1E1E1E] text-sm sm:text-base break-words pr-1">{emp.name}</h4>
                          <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1 break-words">{emp.role}</p>

                          {emp.location ? (
                            <div className="mt-3 mb-2">
                              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: lightBg, borderColor: `${primaryColor}4D` }}>
                                <div className="bg-[#000000] p-1.5 rounded-lg">
                                  <MapPin size={14} className="text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-[#8A8A8A]">{t.booking.location}</p>
                                  <p className="text-sm font-bold text-[#1E1E1E]">{emp.location}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 mb-2">
                              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-100 bg-gray-50">
                                <div className="bg-[#6b7280] p-1.5 rounded-lg">
                                  <MapPin size={14} className="text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-[#8A8A8A]">{t.booking.location}</p>
                                  <p className="text-sm text-[#8A8A8A]">{t.booking.locationOnRequest}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {emp.specialty && (
                            <div className="flex items-center gap-2 mt-2">
                              <div
                                className="flex items-center gap-1 text-xs sm:text-sm rounded-xl px-2 py-1 transition-colors"
                                style={isSelected
                                  ? { backgroundColor: `${primaryColor}1A`, color: primaryColor }
                                  : { backgroundColor: lightBg, color: '#8A8A8A' }
                                }
                              >
                                <Star size={13} style={isSelected ? { fill: primaryColor } : {}} />
                                <span className="truncate">{emp.specialty}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ml-1" style={{ backgroundColor: primaryColor }}>
                            <CheckCircle size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm shadow-2xl"
            style={{ borderTop: `2px solid ${primaryColor}4D` }}
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex-shrink-0 flex items-center gap-1 hover:opacity-80 active:scale-95 text-[#1E1E1E] font-semibold py-3 px-4 rounded-xl transition-all"
                style={{ backgroundColor: lighten(primaryColor, 0.88) }}
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">{t.back}</span>
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8A8A]">{t.booking.selected}</p>
                  <p className="font-bold text-[#1E1E1E] text-sm truncate">{selectedEmployee.name}</p>
                  <p className="text-xs text-[#8A8A8A] truncate">{selectedEmployee.role}</p>
                </div>
              </div>

              <button
                onClick={onNext}
                className="flex-shrink-0 flex items-center gap-2 active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${lighten(primaryColor, 0.2)})` }}
              >
                {t.next}
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
