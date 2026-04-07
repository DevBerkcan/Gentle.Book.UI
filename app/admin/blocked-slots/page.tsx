// app/admin/blocked-slots/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";
import {
  Trash2, Plus, Ban, Clock, ChevronLeft, ChevronRight,
  AlertCircle, CalendarRange, X, Edit, Save,
} from "lucide-react";
import { blockedTimeSlotsApi, BlockedTimeSlot, CreateBlockedTimeSlotDto, CreateBlockedDateRangeDto } from "@/lib/api/blockedTimeSlots";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";

// ── Constants ─────────────────────────────────────────────────────────────────
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const PAGE_SIZE = 8;

function getMiniCalDays(year: number, month: number): (number | null)[] {
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

const MODAL_CLS = {
  base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
  header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
  footer: "border-t border-[#E8C7C3]/20 bg-[#F5EDEB]/30",
  body: "py-4",
};
const INPUT_CLS = {
  inputWrapper:
    "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]",
};

type ModalMode = "create" | "edit";

const EMPTY_SINGLE: CreateBlockedTimeSlotDto = {
  blockDate: "", startTime: "", endTime: "", reason: "",
};
const EMPTY_RANGE: CreateBlockedDateRangeDto = {
  fromDate: "", toDate: "", startTime: "", endTime: "", reason: "",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function BlockedSlotsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['Admin', 'Owner']);

  const [slots, setSlots] = useState<BlockedTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingSlot, setEditingSlot] = useState<BlockedTimeSlot | null>(null);
  const [isRange, setIsRange] = useState(false);
  const [singleForm, setSingleForm] = useState<CreateBlockedTimeSlotDto>(EMPTY_SINGLE);
  const [rangeForm, setRangeForm] = useState<CreateBlockedDateRangeDto>(EMPTY_RANGE);
  const [modalError, setModalError] = useState<string | null>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selDate, setSelDate] = useState<string | null>(null);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [selectedSlotForDelete, setSelectedSlotForDelete] = useState<BlockedTimeSlot | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [selDate]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      // Admin sees all slots with all=true
      const data = await blockedTimeSlotsApi.getAll(startDate, endDate, isAdmin);
      setSlots(data);
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden der blockierten Zeiten");
    } finally {
      setLoading(false);
    }
  }

  // ── Open modals ───────────────────────────────────────────────────────────

  function openCreate(prefillDate?: string) {
    setModalMode("create");
    setEditingSlot(null);
    setIsRange(false);
    setSingleForm({ ...EMPTY_SINGLE, blockDate: prefillDate ?? "" });
    setRangeForm(EMPTY_RANGE);
    setModalError(null);
    onOpen();
  }

  function openEdit(slot: BlockedTimeSlot) {
    setModalMode("edit");
    setEditingSlot(slot);
    setIsRange(false);
    setSingleForm({
      blockDate: slot.blockDate,
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      reason: slot.reason ?? "",
    });
    setModalError(null);
    onOpen();
  }

  function handleClose() {
    onClose();
    setModalError(null);
    setEditingSlot(null);
    setSingleForm(EMPTY_SINGLE);
    setRangeForm(EMPTY_RANGE);
    setIsRange(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setModalError(null);
    setSubmitting(true);

    try {
      if (modalMode === "edit" && editingSlot) {
        if (!singleForm.blockDate || !singleForm.startTime || !singleForm.endTime) {
          setModalError("Bitte alle Pflichtfelder ausfüllen");
          setSubmitting(false);
          return;
        }

        const result = await blockedTimeSlotsApi.update(editingSlot.id, {
          blockDate: singleForm.blockDate,
          startTime: singleForm.startTime,
          endTime: singleForm.endTime,
          reason: singleForm.reason || undefined,
        });

        if (result.success && result.data) {
          setSlots((prev) => prev.map((s) => (s.id === editingSlot.id ? result.data : s)));
          handleClose();
        } else {
          setModalError(result.message || "Fehler beim Aktualisieren");
        }
        return;
      }

      // Create
      if (isRange) {
        if (!rangeForm.fromDate || !rangeForm.toDate || !rangeForm.startTime || !rangeForm.endTime) {
          setModalError("Bitte alle Pflichtfelder ausfüllen");
          setSubmitting(false);
          return;
        }

        const result = await blockedTimeSlotsApi.createRange(rangeForm);
        if (result.success) {
          await load();
          handleClose();
        } else {
          setModalError(result.message || "Fehler beim Erstellen");
        }
      } else {
        if (!singleForm.blockDate || !singleForm.startTime || !singleForm.endTime) {
          setModalError("Bitte alle Pflichtfelder ausfüllen");
          setSubmitting(false);
          return;
        }

        const result = await blockedTimeSlotsApi.create(singleForm);
        if (result.success) {
          await load();
          handleClose();
        } else {
          setModalError(result.message || "Fehler beim Erstellen");
        }
      }
    } catch (e: any) {
      setModalError(e.message || "Ein Fehler ist aufgetreten");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function handleDelete(slot: BlockedTimeSlot) {
    setSelectedSlotForDelete(slot);
    onDeleteModalOpen();
  }

  async function handleDeleteConfirm() {
    if (!selectedSlotForDelete) return;

    setDeleting(true);
    try {
      const result = await blockedTimeSlotsApi.delete(selectedSlotForDelete.id);
      if (result.success) {
        setSlots((prev) => prev.filter((s) => s.id !== selectedSlotForDelete.id));
        onDeleteModalClose();
      } else {
        setError(result.message || "Fehler beim Löschen");
      }
    } catch (e: any) {
      setError(e.message || "Fehler beim Löschen");
    } finally {
      setDeleting(false);
      setSelectedSlotForDelete(null);
    }
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────

  const blockedDates = useMemo(() => {
    const s = new Set<string>();
    slots.forEach((sl) => s.add(sl.blockDate));
    return s;
  }, [slots]);

  const calDays = getMiniCalDays(calYear, calMonth);
  const mkDateStr = (d: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const prevMonth = () =>
    calMonth === 0
      ? (setCalYear((y) => y - 1), setCalMonth(11))
      : setCalMonth((m) => m - 1);
  const nextMonth = () =>
    calMonth === 11
      ? (setCalYear((y) => y + 1), setCalMonth(0))
      : setCalMonth((m) => m + 1);

  // ── Pagination ────────────────────────────────────────────────────────────

  const filteredSlots = selDate
    ? slots.filter((s) => s.blockDate === selDate)
    : slots;
  const sortedSlots = [...filteredSlots].sort((a, b) =>
    a.blockDate !== b.blockDate
      ? a.blockDate.localeCompare(b.blockDate)
      : a.startTime.localeCompare(b.startTime)
  );
  const totalPages = Math.max(1, Math.ceil(sortedSlots.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSlots = sortedSlots.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">
              Abwesenheiten
            </h1>
            <p className="text-sm text-[#8A8A8A]">Blockierte Zeitslots verwalten</p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
            startContent={<Ban size={18} />}
            onPress={() => openCreate()}
          >
            Zeitslot blockieren
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            onDeleteModalClose();
            setSelectedSlotForDelete(null);
          }}
          size="md"
          placement="center"
          classNames={MODAL_CLS}
        >
          <ModalContent>
            {(onModalClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                      <AlertCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">Zeitslot löschen</h2>
                      <p className="text-xs text-[#8A8A8A]">
                        {selectedSlotForDelete && new Date(selectedSlotForDelete.blockDate + "T00:00").toLocaleDateString("de-DE", {
                          day: "2-digit", month: "long",
                        })}
                      </p>
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {selectedSlotForDelete && (
                    <div className="space-y-4">
                      {/* Warning Message */}
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <p className="text-sm text-red-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            <strong>Achtung:</strong> Dieser Zeitslot wird endgültig gelöscht.
                          </span>
                        </p>
                      </div>

                      {/* Slot Info */}
                      <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#6b7280]/10 flex items-center justify-center">
                            <Ban size={18} className="text-[#6b7280]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1E1E1E]">
                              {new Date(selectedSlotForDelete.blockDate + "T00:00").toLocaleDateString("de-DE", {
                                weekday: "long", day: "2-digit", month: "long", year: "numeric",
                              })}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#8A8A8A]">
                              <Clock size={13} />
                              <span>
                                {selectedSlotForDelete.startTime.slice(0, 5)} –{" "}
                                {selectedSlotForDelete.endTime.slice(0, 5)} Uhr
                              </span>
                            </div>
                            {selectedSlotForDelete.reason && (
                              <p className="text-sm text-[#8A8A8A] mt-1 italic">
                                „{selectedSlotForDelete.reason}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={() => {
                      onModalClose();
                      setSelectedSlotForDelete(null);
                    }}
                    isDisabled={deleting}
                    startContent={<X size={14} />}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                    onPress={handleDeleteConfirm}
                    isLoading={deleting}
                    startContent={!deleting && <Trash2 size={14} />}
                  >
                    Endgültig löschen
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Mini-Calendar */}
        <Card className="mb-6 border border-[#E8C7C3]/20 shadow-xl">
          <div className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-[#F5EDEB] to-white border-b border-[#E8C7C3]/20 rounded-t-xl">
            <Button isIconOnly variant="flat" className="bg-white/60 min-w-8 h-8" onPress={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-base font-bold text-[#1E1E1E]">
              {MONTHS[calMonth]} {calYear}
            </span>
            <Button isIconOnly variant="flat" className="bg-white/60 min-w-8 h-8" onPress={nextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <CardBody className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-[#8A8A8A] py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const ds = mkDateStr(day);
                const isBlocked = blockedDates.has(ds);
                const isToday = ds === todayStr;
                const isSel = ds === selDate;
                return (
                  <button
                    key={ds}
                    onClick={() => setSelDate((prev) => (prev === ds ? null : ds))}
                    onDoubleClick={() => openCreate(ds)}
                    title={isBlocked ? "Blockiert – Doppelklick zum Erstellen" : "Doppelklick zum Erstellen"}
                    className={`relative flex flex-col items-center justify-center rounded-xl h-10 text-sm font-medium transition-all cursor-pointer
                      ${isSel
                        ? "bg-[#017172] text-white shadow-md"
                        : isToday
                          ? "ring-2 ring-[#017172] text-[#017172]"
                          : isBlocked
                            ? "bg-[#017172]/10 text-[#017172] hover:bg-[#017172]/20"
                            : "text-[#1E1E1E] hover:bg-[#F5EDEB]"
                      }`}
                  >
                    {day}
                    {isBlocked && !isSel && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#017172]" />
                    )}
                  </button>
                );
              })}
            </div>
            {selDate && (
              <div className="mt-3 pt-3 border-t border-[#E8C7C3]/20 flex items-center justify-between">
                <p className="text-sm text-[#8A8A8A]">
                  Filter:{" "}
                  <span className="font-semibold text-[#017172]">
                    {new Date(selDate + "T00:00").toLocaleDateString("de-DE", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-[#F5EDEB] text-[#8A8A8A] text-xs"
                  onPress={() => setSelDate(null)}
                >
                  Aufheben
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* List header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[#1E1E1E]">
            {selDate
              ? `Blockierungen am ${new Date(selDate + "T00:00").toLocaleDateString("de-DE", {
                day: "2-digit", month: "long",
              })} (${filteredSlots.length})`
              : `Alle Blockierungen (${slots.length})`}
          </h3>
          {totalPages > 1 && (
            <span className="text-xs text-[#8A8A8A]">
              Seite {safePage} von {totalPages}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
            <AlertCircle size={15} />{error}
          </div>
        )}

        {/* Slot list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#017172]" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#F5EDEB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban size={28} className="text-[#E8C7C3]" />
            </div>
            <p className="text-[#8A8A8A] font-medium">
              {selDate
                ? "Keine Blockierungen an diesem Tag"
                : "Noch keine blockierten Zeiten"}
            </p>
            <p className="text-[#8A8A8A] text-sm mt-1">
              Doppelklick auf einen Kalendertag oder Button oben
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pagedSlots.map((slot) => (
                <Card
                  key={slot.id}
                  className="border border-[#E8C7C3]/20 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6b7280]/10 flex items-center justify-center shrink-0">
                          <Ban size={18} className="text-[#6b7280]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1E1E]">
                            {new Date(slot.blockDate + "T00:00").toLocaleDateString("de-DE", {
                              weekday: "long", day: "2-digit",
                              month: "long", year: "numeric",
                            })}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-[#8A8A8A]">
                            <Clock size={13} />
                            <span>
                              {slot.startTime.slice(0, 5)} –{" "}
                              {slot.endTime.slice(0, 5)} Uhr
                            </span>
                          </div>
                          {slot.reason && (
                            <p className="text-sm text-[#8A8A8A] mt-1 italic">
                              „{slot.reason}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          isIconOnly size="sm" variant="flat"
                          className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                          onPress={() => openEdit(slot)}
                          title="Bearbeiten"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          isIconOnly size="sm" variant="flat"
                          className="bg-red-50 text-red-500 hover:bg-red-100"
                          onPress={() => handleDelete(slot)}
                          title="Löschen"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  isIconOnly size="sm" variant="flat"
                  className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E]"
                  isDisabled={safePage <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const show =
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - safePage) <= 1;
                  if (!show) return null;
                  return (
                    <Button
                      key={p} size="sm" variant="flat"
                      className={`min-w-9 h-9 font-semibold ${p === safePage
                          ? "bg-[#017172] text-white"
                          : "bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] hover:bg-[#F5EDEB]"
                        }`}
                      onPress={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  isIconOnly size="sm" variant="flat"
                  className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E]"
                  isDisabled={safePage >= totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="lg"
        placement="center"
        classNames={MODAL_CLS}
      >
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#017172] flex items-center justify-center">
                    {modalMode === "edit" ? (
                      <Edit size={15} className="text-white" />
                    ) : (
                      <Ban size={15} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">
                      {modalMode === "edit"
                        ? "Zeitslot bearbeiten"
                        : "Zeitslot blockieren"}
                    </h2>
                    <p className="text-xs text-[#8A8A8A]">
                      {modalMode === "edit"
                        ? "Datum, Zeit oder Grund anpassen"
                        : "Zeiten als nicht verfügbar markieren"}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  {modalError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                      <AlertCircle size={14} />{modalError}
                    </div>
                  )}

                  {/* Range toggle — create mode only */}
                  {modalMode === "create" && (
                    <div className="flex items-center gap-3 p-3 bg-[#F5EDEB] rounded-xl border border-[#E8C7C3]/30">
                      <Switch
                        isSelected={isRange}
                        onValueChange={setIsRange}
                        color="primary"
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1E1E1E]">
                          Datumsbereich
                        </p>
                        <p className="text-xs text-[#8A8A8A]">
                          Mehrere Tage auf einmal blockieren
                        </p>
                      </div>
                      <CalendarRange size={18} className="text-[#8A8A8A]" />
                    </div>
                  )}

                  {/* Date field(s) */}
                  {modalMode === "edit" || !isRange ? (
                    <Input
                      type="date"
                      label="Datum"
                      isRequired
                      isDisabled={submitting}
                      value={singleForm.blockDate}
                      onChange={(e) =>
                        setSingleForm((f) => ({ ...f, blockDate: e.target.value }))
                      }
                      classNames={INPUT_CLS}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date" label="Von Datum" isRequired isDisabled={submitting}
                        value={rangeForm.fromDate}
                        onChange={(e) =>
                          setRangeForm((f) => ({ ...f, fromDate: e.target.value }))
                        }
                        classNames={INPUT_CLS}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        type="date" label="Bis Datum" isRequired isDisabled={submitting}
                        value={rangeForm.toDate}
                        onChange={(e) =>
                          setRangeForm((f) => ({ ...f, toDate: e.target.value }))
                        }
                        classNames={INPUT_CLS}
                        min={rangeForm.fromDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  {/* Time fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="time" label="Von Uhrzeit" isRequired isDisabled={submitting}
                      value={
                        isRange && modalMode === "create"
                          ? rangeForm.startTime
                          : singleForm.startTime
                      }
                      onChange={(e) =>
                        isRange && modalMode === "create"
                          ? setRangeForm((f) => ({ ...f, startTime: e.target.value }))
                          : setSingleForm((f) => ({ ...f, startTime: e.target.value }))
                      }
                      classNames={INPUT_CLS}
                    />
                    <Input
                      type="time" label="Bis Uhrzeit" isRequired isDisabled={submitting}
                      value={
                        isRange && modalMode === "create"
                          ? rangeForm.endTime
                          : singleForm.endTime
                      }
                      onChange={(e) =>
                        isRange && modalMode === "create"
                          ? setRangeForm((f) => ({ ...f, endTime: e.target.value }))
                          : setSingleForm((f) => ({ ...f, endTime: e.target.value }))
                      }
                      classNames={INPUT_CLS}
                    />
                  </div>

                  {/* Reason */}
                  <Input
                    label="Grund (optional)"
                    placeholder="z.B. Urlaub, Fortbildung…"
                    isDisabled={submitting}
                    value={
                      isRange && modalMode === "create"
                        ? rangeForm.reason ?? ""
                        : singleForm.reason ?? ""
                    }
                    onChange={(e) =>
                      isRange && modalMode === "create"
                        ? setRangeForm((f) => ({ ...f, reason: e.target.value }))
                        : setSingleForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    classNames={INPUT_CLS}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="gap-2">
                <Button
                  variant="flat"
                  className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                  onPress={handleClose}
                  isDisabled={submitting}
                  startContent={<X size={14} />}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  startContent={
                    !submitting &&
                    (modalMode === "edit" ? (
                      <Save size={14} />
                    ) : (
                      <Ban size={14} />
                    ))
                  }
                >
                  {modalMode === "edit" ? "Speichern" : "Blockieren"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {confirmDialog}
    </div>
  );
}