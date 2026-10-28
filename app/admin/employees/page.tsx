"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { Chip } from "@nextui-org/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import {
  Plus, Edit, Trash2, Users, AlertCircle, X, Save, UserCheck, UserX,
  Lock, Eye, EyeOff, Key, MapPin, Clock, CalendarDays, Plane, Upload, Sparkles,
} from "lucide-react";
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  uploadEmployeePhoto, deleteEmployeePhoto, updateEmployeeTagline, suggestEmployeeTagline,
  type Employee, type CreateEmployeeDto,
} from "@/lib/api/employees";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import api, { apiOrigin } from "@/lib/api/client";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

const MODAL_CLS = {
  base: "bg-white border border-[#ECEBF2]/30 shadow-2xl",
  header: "border-b border-[#ECEBF2]/20 bg-gradient-to-r from-[#F6F5FA] to-white",
  footer: "border-t border-[#ECEBF2]/20 bg-[#F6F5FA]/30",
  body: "py-5",
};
const INPUT_CLS = {
  inputWrapper: "bg-[#F6F5FA] border border-[#ECEBF2]/40 hover:border-[#6355E4] data-[focus=true]:border-[#6355E4]",
  label: "text-gb-textSecondary font-medium",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-[#6355E4]", "bg-[#8B8FA6]", "bg-[#D8D7E2]", "bg-[#6b7280]",
  "bg-emerald-600", "bg-amber-600", "bg-violet-600",
];
const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function getDays(t: Translations) {
  const s = t.admin.employeesPage;
  const labels: Record<number, string> = {
    1: s.dayMon, 2: s.dayTue, 3: s.dayWed, 4: s.dayThu, 5: s.dayFri, 6: s.daySat, 0: s.daySun,
  };
  return DAY_ORDER.map((value) => ({ value, label: labels[value] }));
}

interface ScheduleItem { dayOfWeek: number; isWorkingDay: boolean; startTime: string; endTime: string; }

const defaultSchedule = (): ScheduleItem[] =>
  DAY_ORDER.map((value) => ({ dayOfWeek: value, isWorkingDay: value >= 1 && value <= 5, startTime: '09:00', endTime: '18:00' }));

const EMPTY: CreateEmployeeDto = {
  name: "",
  role: "",
  specialty: "",
  username: "",
  password: "",
  location: ""
};

// ── Vacation types ────────────────────────────────────────────────────────────
interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: string;
  note: string | null;
  createdAt: string;
}

function getVacationTypes(t: Translations) {
  const s = t.admin.employeesPage;
  return [
    { value: "Vacation", label: s.vacationTypeVacation },
    { value: "SickLeave", label: s.vacationTypeSickLeave },
    { value: "PersonalDay", label: s.vacationTypePersonalDay },
  ];
}

const EMPTY_VACATION = { startDate: "", endDate: "", type: "Vacation", note: "" };

export default function EmployeesPage() {
  const { isEmployee } = useAuth();
  const { t, lang } = useTranslation();
  const s = t.admin.employeesPage;
  const dateLocale = lang === 'de' ? 'de-DE' : 'en-US';
  const DAYS = getDays(t);
  const VACATION_TYPES = getVacationTypes(t);
  const vacationTypeLabel = (type: string) => VACATION_TYPES.find(vt => vt.value === type)?.label ?? type;
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateEmployeeDto>(EMPTY);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<boolean>(false);

  // Photo + Tagline. Tagline stays edit-only (AI suggestion needs an existing employee to
  // reason about). Photo can now also be picked while *creating* a new employee — the file
  // itself is only staged locally (no employee id exists yet to upload against) and gets
  // uploaded right after creation succeeds, inside handleSubmit.
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editTagline, setEditTagline] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDeleting, setPhotoDeleting] = useState(false);
  const [taglineSaving, setTaglineSaving] = useState(false);
  const [suggestingTagline, setSuggestingTagline] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState<Employee | null>(null);
  const { isOpen: isToggleModalOpen, onOpen: onToggleModalOpen, onClose: onToggleModalClose } = useDisclosure();
  const [toggling, setToggling] = useState(false);
  const [selectedEmployeeForToggle, setSelectedEmployeeForToggle] = useState<Employee | null>(null);

  // Schedule modal
  const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onClose: onScheduleClose } = useDisclosure();
  const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(defaultSchedule());
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Vacation modal
  const { isOpen: isVacationOpen, onOpen: onVacationOpen, onClose: onVacationClose } = useDisclosure();
  const [vacationEmployee, setVacationEmployee] = useState<Employee | null>(null);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [vacationLoading, setVacationLoading] = useState(false);
  const [vacationForm, setVacationForm] = useState(EMPTY_VACATION);
  const [vacationSaving, setVacationSaving] = useState(false);
  const [vacationError, setVacationError] = useState('');
  const [deletingVacationId, setDeletingVacationId] = useState<string | null>(null);

  const { confirm, dialog } = useConfirm();

  // Found during live pre-launch testing: the Gesamt/Aktiv/Inaktiv stats tile was computed from
  // `employees`, which only ever holds the toggle-filtered set — with "Inaktive anzeigen" off
  // (the default), inactive employees are never even fetched, so the tile always showed 0
  // Inaktiv regardless of how many actually exist. Counts are now always based on the complete
  // list, independent of what "Inaktive anzeigen" is currently showing.
  const [allEmployeesCount, setAllEmployeesCount] = useState({ total: 0, active: 0 });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [filtered, all] = await Promise.all([
        getEmployees(!showInactive),
        getEmployees(false),
      ]);
      setEmployees(filtered);
      setAllEmployeesCount({ total: all.length, active: all.filter(e => e.isActive).length });
    }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [showInactive]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormActive(true);
    setModalErr(null);
    setResetPassword(false);
    setShowPassword(false);
    setEditPhotoUrl(null);
    setEditTagline("");
    setPendingPhotoFile(null);
    setPendingPhotoPreviewUrl(null);
    onOpen();
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      name: emp.name,
      role: emp.role,
      specialty: emp.specialty ?? "",
      username: emp.username ?? "",
      location: emp.location ?? ""
    });
    setFormActive(emp.isActive);
    setModalErr(null);
    setResetPassword(false);
    setShowNewPassword(false);
    setEditPhotoUrl(emp.photoUrl ?? null);
    setEditTagline(emp.tagline ?? "");
    setPendingPhotoFile(null);
    setPendingPhotoPreviewUrl(null);
    onOpen();
  }

  async function handleEditPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // No employee id exists yet while creating — stage the file and a local preview, then
    // actually upload it right after the employee is created (see handleSubmit).
    if (!editing) {
      setPendingPhotoFile(file);
      setPendingPhotoPreviewUrl(URL.createObjectURL(file));
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      return;
    }

    setPhotoUploading(true); setModalErr(null);
    try {
      const res = await uploadEmployeePhoto(editing.id, file);
      setEditPhotoUrl(res.photoUrl);
      await load();
    } catch (err: any) {
      setModalErr(err.response?.data?.message || s.uploadError);
    } finally {
      setPhotoUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  }

  async function handleEditPhotoDelete() {
    if (!editing || !editPhotoUrl) return;
    setPhotoDeleting(true); setModalErr(null);
    try {
      await deleteEmployeePhoto(editing.id);
      setEditPhotoUrl(null);
      await load();
    } catch (err: any) {
      setModalErr(err.response?.data?.message || s.deletePhotoError);
    } finally {
      setPhotoDeleting(false);
    }
  }

  async function handleEditTaglineSave() {
    if (!editing) return;
    setTaglineSaving(true); setModalErr(null);
    try {
      const res = await updateEmployeeTagline(editing.id, editTagline);
      setEditTagline(res.tagline ?? "");
      await load();
    } catch (err: any) {
      setModalErr(err.response?.data?.message || s.saveTaglineError);
    } finally {
      setTaglineSaving(false);
    }
  }

  async function handleSuggestTagline() {
    if (!editing) return;
    setSuggestingTagline(true); setModalErr(null);
    try {
      const res = await suggestEmployeeTagline(editing.id);
      setEditTagline(res.suggestion);
    } catch (err: any) {
      setModalErr(err.response?.data?.message || s.aiSuggestionUnavailable);
    } finally {
      setSuggestingTagline(false);
    }
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.role.trim()) {
      setModalErr(s.nameRoleRequired);
      return;
    }

    if (!editing && (!form.username?.trim() || !form.password?.trim())) {
      setModalErr(s.usernamePasswordRequired);
      return;
    }

    if (editing && resetPassword && !form.password?.trim()) {
      setModalErr(s.newPasswordRequired);
      return;
    }

    setSubmitting(true);
    setModalErr(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        role: form.role.trim(),
        specialty: form.specialty?.trim() || null,
        location: form.location?.trim() || null
      };

      if (form.username?.trim()) {
        payload.username = form.username.trim();
      }

      if (editing) {
        payload.isActive = formActive;
        if (resetPassword && form.password?.trim()) {
          payload.newPassword = form.password.trim();
        }
        await updateEmployee(editing.id, payload);
      } else {
        if (form.password?.trim()) {
          payload.password = form.password.trim();
        }
        const created = await createEmployee(payload);
        if (pendingPhotoFile) {
          try {
            await uploadEmployeePhoto(created.id, pendingPhotoFile);
          } catch (photoErr: any) {
            // The employee itself was created successfully — don't block/reopen the modal over
            // a photo-only failure, just surface it so the admin knows to retry via "Bearbeiten".
            toast.error(photoErr.response?.data?.message || s.uploadError);
          }
        }
      }

      await load();
      onClose();
    } catch (e: any) {
      setModalErr(e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(emp: Employee) {
    setSelectedEmployeeForDelete(emp);
    onDeleteModalOpen();
  }

  async function handleDeleteConfirm() {
    if (!selectedEmployeeForDelete) return;

    setDeleting(true);
    try {
      await deleteEmployee(selectedEmployeeForDelete.id);
      await load();
      onDeleteModalClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
      setSelectedEmployeeForDelete(null);
    }
  }

  function handleToggle(emp: Employee) {
    setSelectedEmployeeForToggle(emp);
    onToggleModalOpen();
  }

  async function handleToggleConfirm() {
    if (!selectedEmployeeForToggle) return;

    setToggling(true);
    try {
      await updateEmployee(selectedEmployeeForToggle.id, {
        name: selectedEmployeeForToggle.name,
        role: selectedEmployeeForToggle.role,
        specialty: selectedEmployeeForToggle.specialty,
        isActive: !selectedEmployeeForToggle.isActive
      });
      await load();
      onToggleModalClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setToggling(false);
      setSelectedEmployeeForToggle(null);
    }
  }

  async function openSchedule(emp: Employee) {
    setScheduleEmployee(emp);
    setSchedule(defaultSchedule());
    setScheduleError('');
    setScheduleSaved(false);
    setScheduleLoading(true);
    onScheduleOpen();
    try {
      const res = await api.get(`/employees/${emp.id}/schedule`);
      const data: any[] = res.data?.data ?? [];
      if (data.length > 0) {
        setSchedule(DAYS.map((d) => {
          const found = data.find((s: any) => s.dayOfWeek === d.value);
          return found
            ? { dayOfWeek: d.value, isWorkingDay: found.isWorkingDay, startTime: found.startTime ?? '09:00', endTime: found.endTime ?? '18:00' }
            : { dayOfWeek: d.value, isWorkingDay: d.value >= 1 && d.value <= 5, startTime: '09:00', endTime: '18:00' };
        }));
      }
    } catch { /* use defaults */ }
    finally { setScheduleLoading(false); }
  }

  async function saveSchedule() {
    if (!scheduleEmployee) return;
    setScheduleSaving(true);
    setScheduleError('');
    try {
      await api.put(`/employees/${scheduleEmployee.id}/schedule`, schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        isWorkingDay: s.isWorkingDay,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '18:00',
      })));
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch (e: any) {
      setScheduleError(e.response?.data?.message || s.saveGenericError);
    } finally {
      setScheduleSaving(false);
    }
  }

  const updateScheduleItem = (dayOfWeek: number, field: keyof ScheduleItem, value: string | boolean) =>
    setSchedule((prev) => prev.map((s) => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s));

  // ── Vacation handlers ─────────────────────────────────────────────────────

  async function openVacation(emp: Employee) {
    setVacationEmployee(emp);
    setVacationForm(EMPTY_VACATION);
    setVacationError('');
    setVacations([]);
    setVacationLoading(true);
    onVacationOpen();
    try {
      const res = await api.get(`/admin/vacations?employeeId=${emp.id}`);
      setVacations(res.data ?? []);
    } catch {
      setVacationError(s.loadAbsencesError);
    } finally {
      setVacationLoading(false);
    }
  }

  async function createVacation() {
    if (!vacationEmployee) return;
    if (!vacationForm.startDate || !vacationForm.endDate) {
      setVacationError(s.startEndDateRequired);
      return;
    }
    if (vacationForm.startDate > vacationForm.endDate) {
      setVacationError(s.startBeforeEndRequired);
      return;
    }
    setVacationSaving(true);
    setVacationError('');
    try {
      await api.post('/admin/vacations', {
        employeeId: vacationEmployee.id,
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        type: vacationForm.type,
        note: vacationForm.note || null,
      });
      const res = await api.get(`/admin/vacations?employeeId=${vacationEmployee.id}`);
      setVacations(res.data ?? []);
      setVacationForm(EMPTY_VACATION);
      toast.success(s.absenceAddedToast);
    } catch (e: any) {
      setVacationError(e.response?.data?.message || s.saveGenericError);
    } finally {
      setVacationSaving(false);
    }
  }

  async function deleteVacation(id: string) {
    setDeletingVacationId(id);
    try {
      await api.delete(`/admin/vacations/${id}`);
      setVacations(prev => prev.filter(v => v.id !== id));
      toast.success(s.absenceDeletedToast);
    } catch (e: any) {
      toast.error(e.response?.data?.message || s.deleteGenericError);
    } finally {
      setDeletingVacationId(null);
    }
  }

  const activeCount = allEmployeesCount.active;
  const inactiveCount = allEmployeesCount.total - allEmployeesCount.active;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">{t.admin.employees}</h1>
            <p className="text-sm text-gb-textSecondary">{s.pageSubtitle}</p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
            startContent={<Plus size={18} />}
            onPress={openCreate}
          >
            {s.addEmployee}
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            onDeleteModalClose();
            setSelectedEmployeeForDelete(null);
          }}
          size="lg"
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
                      <h2 className="text-lg font-bold text-[#1E1E1E]">{s.deleteTitle}</h2>
                      <p className="text-xs text-gb-textSecondary">
                        {selectedEmployeeForDelete?.name}
                      </p>
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {selectedEmployeeForDelete && (
                    <div className="space-y-4">
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <p className="text-sm text-red-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            {s.deleteWarning}
                          </span>
                        </p>
                      </div>

                      <div className="bg-[#F6F5FA] p-4 rounded-xl border border-[#ECEBF2]/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(selectedEmployeeForDelete.name)}`}>
                            {initials(selectedEmployeeForDelete.name)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E1E1E]">{selectedEmployeeForDelete.name}</p>
                            <p className="text-sm text-gb-textSecondary">{selectedEmployeeForDelete.role}</p>
                            {selectedEmployeeForDelete.location && (
                              <p className="text-xs text-gb-textSecondary mt-1 flex items-center gap-1">
                                <MapPin size={10} /> {selectedEmployeeForDelete.location}
                              </p>
                            )}
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            className={selectedEmployeeForDelete.isActive ? "bg-[#6355E4]/10 text-[#6355E4]" : "bg-[#6b7280]/10 text-[#6b7280]"}
                          >
                            {selectedEmployeeForDelete.isActive ? t.admin.active : t.admin.inactive}
                          </Chip>
                        </div>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            {s.deleteImpact}
                          </span>
                        </p>
                      </div>

                      <div className="bg-[#6355E4]/5 p-4 rounded-xl border border-[#6355E4]/20">
                        <p className="text-sm text-[#6355E4] flex items-start gap-2">
                          <UserX size={16} className="shrink-0 mt-0.5" />
                          <span>
                            {s.deleteAlternative}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                    onPress={() => {
                      onModalClose();
                      setSelectedEmployeeForDelete(null);
                    }}
                    isDisabled={deleting}
                    startContent={<X size={14} />}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                    onPress={handleDeleteConfirm}
                    isLoading={deleting}
                    startContent={!deleting && <Trash2 size={14} />}
                  >
                    {s.deleteFinal}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Toggle Active/Inactive Modal */}
        <Modal
          isOpen={isToggleModalOpen}
          onClose={() => {
            onToggleModalClose();
            setSelectedEmployeeForToggle(null);
          }}
          size="lg"
          placement="center"
          classNames={MODAL_CLS}
        >
          <ModalContent>
            {(onModalClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedEmployeeForToggle?.isActive ? "bg-amber-500" : "bg-[#6355E4]"}`}>
                      {selectedEmployeeForToggle?.isActive
                        ? <UserX size={20} className="text-white" />
                        : <UserCheck size={20} className="text-white" />
                      }
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">
                        {selectedEmployeeForToggle?.isActive ? s.deactivateTitle : s.activateTitle}
                      </h2>
                      <p className="text-xs text-gb-textSecondary">{selectedEmployeeForToggle?.name}</p>
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {selectedEmployeeForToggle && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${selectedEmployeeForToggle.isActive ? "bg-amber-50 border-amber-200" : "bg-[#6355E4]/5 border-[#6355E4]/20"}`}>
                        <p className={`text-sm flex items-start gap-2 ${selectedEmployeeForToggle.isActive ? "text-amber-700" : "text-[#6355E4]"}`}>
                          {selectedEmployeeForToggle.isActive
                            ? <UserX size={16} className="shrink-0 mt-0.5" />
                            : <UserCheck size={16} className="shrink-0 mt-0.5" />
                          }
                          <span>
                            <strong>
                              {selectedEmployeeForToggle.isActive
                                ? s.confirmDeactivate
                                : s.confirmActivate}
                            </strong>
                            <br />
                            {selectedEmployeeForToggle.isActive
                              ? s.deactivatedDesc
                              : s.activatedDesc}
                          </span>
                        </p>
                      </div>

                      <div className="bg-[#F6F5FA] p-4 rounded-xl border border-[#ECEBF2]/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(selectedEmployeeForToggle.name)}`}>
                            {initials(selectedEmployeeForToggle.name)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E1E1E]">{selectedEmployeeForToggle.name}</p>
                            <p className="text-sm text-gb-textSecondary">{selectedEmployeeForToggle.role}</p>
                            {selectedEmployeeForToggle.location && (
                              <p className="text-xs text-gb-textSecondary mt-1 flex items-center gap-1">
                                <MapPin size={10} /> {selectedEmployeeForToggle.location}
                              </p>
                            )}
                          </div>
                          <Chip size="sm" variant="flat"
                            className={selectedEmployeeForToggle.isActive ? "bg-[#6355E4]/10 text-[#6355E4]" : "bg-[#6b7280]/10 text-[#6b7280]"}>
                            {selectedEmployeeForToggle.isActive ? t.admin.active : t.admin.inactive}
                          </Chip>
                        </div>
                      </div>

                      {selectedEmployeeForToggle.isActive && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <p className="text-sm text-amber-700 flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>
                              {s.toggleImpact}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                    onPress={() => {
                      onModalClose();
                      setSelectedEmployeeForToggle(null);
                    }}
                    isDisabled={toggling}
                    startContent={<X size={14} />}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    className={selectedEmployeeForToggle?.isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/20"
                      : "bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                    }
                    onPress={handleToggleConfirm}
                    isLoading={toggling}
                    startContent={!toggling && (selectedEmployeeForToggle?.isActive ? <UserX size={14} /> : <UserCheck size={14} />)}
                  >
                    {selectedEmployeeForToggle?.isActive ? s.deactivateBtn : s.activateBtn}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: s.statTotal, value: allEmployeesCount.total, cls: "text-[#1E1E1E]", glow: "#ECEBF2" },
            { label: t.admin.active, value: activeCount, cls: "text-[#6355E4]", glow: "#6355E4" },
            { label: t.admin.inactive, value: inactiveCount, cls: "text-gb-textSecondary", glow: "#ECEBF2" },
          ].map(({ label, value, cls, glow }) => (
            <GlowingEffect key={label} glowColor={glow} spread={40}>
              <Card className="border border-[#ECEBF2]/30 shadow-md relative z-[1]">
                <CardBody className="p-4">
                  <div className={`text-2xl sm:text-3xl font-bold ${cls}`}>{value}</div>
                  <div className="text-xs text-gb-textSecondary mt-0.5">{label}</div>
                </CardBody>
              </Card>
            </GlowingEffect>
          ))}
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-white border border-[#ECEBF2]/30 rounded-xl shadow-sm w-fit">
          <Switch
            isSelected={showInactive}
            onValueChange={setShowInactive}
            size="sm"
            color="default"
          />
          <span className="text-sm text-gb-textSecondary">{s.showInactiveLabel}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm mb-4">
            <AlertCircle size={16} />{error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#6355E4]" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#F6F5FA] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-[#ECEBF2]" />
            </div>
            <p className="text-gb-textSecondary font-medium">{s.emptyStateText}</p>
            <Button
              className="mt-4 bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold"
              startContent={<Plus size={16} />}
              onPress={openCreate}
            >
              {s.addFirstEmployee}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <GlowingEffect key={emp.id} glowColor="#6355E4" spread={45} disabled={!emp.isActive}>
                <Card
                  className={`border shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 relative z-[1] ${emp.isActive ? "border-[#ECEBF2]/30" : "border-[#ECEBF2]/10 opacity-60"}`}>
                  <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {emp.photoUrl ? (
                      <Image
                        src={emp.photoUrl.startsWith('http') ? emp.photoUrl : `${apiOrigin}${emp.photoUrl}`}
                        alt={emp.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(emp.name)}`}>
                        {initials(emp.name)}
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[#1E1E1E]">{emp.name}</span>
                        <Chip size="sm" variant="flat"
                          className={emp.isActive ? "bg-[#6355E4]/10 text-[#6355E4]" : "bg-[#6b7280]/10 text-[#6b7280]"}>
                          {emp.isActive ? t.admin.active : t.admin.inactive}
                        </Chip>
                      </div>
                      <p className="text-sm text-gb-textSecondary font-medium">{emp.role}</p>
                      {emp.location && (
                        <p className="text-xs text-gb-textSecondary mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {emp.location}
                        </p>
                      )}
                      {emp.specialty && <p className="text-xs text-gb-textSecondary mt-1 italic">{emp.specialty}</p>}
                      {emp.tagline && <p className="text-xs text-[#6355E4] mt-1">"{emp.tagline}"</p>}
                      {emp.username && (
                        <p className="text-xs text-gb-textSecondary mt-1 flex items-center gap-1">
                          <Key size={10} /> {emp.username}
                        </p>
                      )}
                      {!emp.hasPassword && emp.username && (
                        <p className="text-xs text-amber-600 mt-1 font-medium">{s.noPasswordSet}</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        isIconOnly size="sm" variant="flat"
                        className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
                        onPress={() => openEdit(emp)}
                        title={s.editAction}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        isIconOnly size="sm" variant="flat"
                        className="bg-[#F6F5FA] text-gb-textSecondary hover:bg-[#ECEBF2]/30"
                        onPress={() => openSchedule(emp)}
                        title={s.scheduleAction}
                      >
                        <Clock size={14} />
                      </Button>
                      <Button
                        isIconOnly size="sm" variant="flat"
                        className="bg-blue-50 text-blue-500 hover:bg-blue-100"
                        onPress={() => openVacation(emp)}
                        title={s.vacationAction}
                      >
                        <CalendarDays size={14} />
                      </Button>
                      <Button
                        isIconOnly size="sm" variant="flat"
                        className={emp.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-[#6355E4]/10 text-[#6355E4] hover:bg-[#6355E4]/20"}
                        onPress={() => handleToggle(emp)}
                        title={emp.isActive ? s.deactivateBtn : s.activateBtn}
                      >
                        {emp.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </Button>
                      <Button
                        isIconOnly size="sm" variant="flat"
                        className="bg-red-50 text-red-500 hover:bg-red-100"
                        onPress={() => handleDelete(emp)}
                        title={s.deleteAction}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
                </Card>
              </GlowingEffect>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => { onClose(); setModalErr(null); }}
        size="md" placement="center" classNames={MODAL_CLS}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6355E4] flex items-center justify-center">
                    {editing ? <Edit size={16} className="text-white" /> : <Plus size={18} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">
                      {editing ? s.editEmployeeTitle : s.addEmployeeTitle}
                    </h2>
                    <p className="text-xs text-gb-textSecondary">
                      {editing ? fillTemplate(s.editEmployeeSubtitleTemplate, { name: editing.name }) : s.newEmployeeSubtitle}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {modalErr && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                      <AlertCircle size={14} />{modalErr}
                    </div>
                  )}

                  {(() => {
                    const displayPhotoUrl = editing ? editPhotoUrl : pendingPhotoPreviewUrl;
                    const displayName = editing ? editing.name : (form.name || '?');
                    return (
                    <div className="p-3 bg-[#F6F5FA] rounded-xl border border-[#ECEBF2]/30 space-y-3">
                      <div className="flex items-center gap-4">
                        {displayPhotoUrl ? (
                          <Image
                            src={displayPhotoUrl.startsWith('http') || displayPhotoUrl.startsWith('blob:') ? displayPhotoUrl : `${apiOrigin}${displayPhotoUrl}`}
                            alt={displayName}
                            width={56}
                            height={56}
                            unoptimized={displayPhotoUrl.startsWith('blob:')}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(displayName)}`}>
                            {initials(displayName)}
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleEditPhotoUpload}
                          />
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-medium"
                            isDisabled={photoUploading || photoDeleting}
                            isLoading={photoUploading}
                            startContent={!photoUploading && <Upload size={13} />}
                            onPress={() => editFileInputRef.current?.click()}
                          >
                            {s.uploadPhoto}
                          </Button>
                          {displayPhotoUrl && (
                            <Button
                              size="sm"
                              variant="flat"
                              className="bg-red-50 text-red-500 font-medium"
                              isDisabled={photoUploading || photoDeleting}
                              isLoading={photoDeleting}
                              startContent={!photoDeleting && <Trash2 size={13} />}
                              onPress={editing ? handleEditPhotoDelete : () => { setPendingPhotoFile(null); setPendingPhotoPreviewUrl(null); }}
                            >
                              {t.admin.delete}
                            </Button>
                          )}
                        </div>
                      </div>
                      {editing && (
                      <div className="flex gap-2 items-end">
                        <Input
                          label={s.taglineLabel}
                          placeholder={s.taglinePlaceholder}
                          value={editTagline}
                          maxLength={60}
                          onChange={(e) => setEditTagline(e.target.value)}
                          classNames={INPUT_CLS}
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          className="bg-[#EEEBFC] text-[#6355E4] font-medium shrink-0"
                          isDisabled={suggestingTagline}
                          isLoading={suggestingTagline}
                          startContent={!suggestingTagline && <Sparkles size={13} />}
                          onPress={handleSuggestTagline}
                          title={s.aiSuggestTitle}
                        >
                          {s.aiBtn}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#6355E4] text-white font-medium shrink-0"
                          isDisabled={taglineSaving || editTagline === (editing.tagline ?? "")}
                          isLoading={taglineSaving}
                          startContent={!taglineSaving && <Save size={13} />}
                          onPress={handleEditTaglineSave}
                        >
                          {t.save}
                        </Button>
                      </div>
                      )}
                      <p className="text-[10px] text-gb-textSecondary">{s.photoTaglineHint}</p>
                    </div>
                    );
                  })()}

                  <Input
                    label={t.admin.name}
                    placeholder={s.namePlaceholder}
                    value={form.name}
                    isRequired={true}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    classNames={INPUT_CLS}
                  />

                  <Input
                    label={s.roleLabel}
                    placeholder={s.rolePlaceholder}
                    value={form.role}
                    isRequired={true}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    classNames={INPUT_CLS}
                  />

                  <Input
                    label={s.specialtyLabel}
                    placeholder={s.specialtyPlaceholder}
                    value={form.specialty ?? ""}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    classNames={INPUT_CLS}
                  />

                  <Input
                    label={s.locationFieldLabel}
                    placeholder={s.locationFieldPlaceholder}
                    value={form.location ?? ""}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    classNames={INPUT_CLS}
                    startContent={<MapPin size={16} className="text-gb-textSecondary" />}
                  />

                  <Input
                    label={s.usernameLabel}
                    placeholder={s.usernamePlaceholder}
                    value={form.username ?? ""}
                    isRequired={!editing ? true : false}
                    isDisabled={submitting || (!!editing && !resetPassword)}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    classNames={INPUT_CLS}
                    startContent={<Key size={16} className="text-gb-textSecondary" />}
                  />

                  {!editing && (
                    <Input
                      label={s.passwordLabel}
                      type={showPassword ? "text" : "password"}
                      placeholder={s.passwordPlaceholder}
                      value={form.password ?? ""}
                      isRequired={true}
                      isDisabled={submitting}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      classNames={INPUT_CLS}
                      startContent={<Lock size={16} className="text-gb-textSecondary" />}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gb-textSecondary hover:text-[#6355E4] transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  )}

                  {editing && (
                    <>
                      {!resetPassword ? (
                        <div className="p-3 bg-[#F6F5FA] rounded-xl border border-[#ECEBF2]/30">
                          <p className="text-sm text-gb-textSecondary mb-2">{s.changePasswordPrompt}</p>
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-[#6355E4]/10 text-[#6355E4] font-semibold"
                            startContent={<Lock size={14} />}
                            onPress={() => setResetPassword(true)}
                          >
                            {s.setNewPasswordBtn}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            label={s.newPasswordLabel}
                            type={showNewPassword ? "text" : "password"}
                            placeholder={s.passwordPlaceholder}
                            value={form.password ?? ""}
                            isRequired={true}
                            isDisabled={submitting}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            classNames={INPUT_CLS}
                            startContent={<Lock size={16} className="text-gb-textSecondary" />}
                            endContent={
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="text-gb-textSecondary hover:text-[#6355E4] transition-colors"
                                tabIndex={-1}
                              >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-red-50 text-red-500"
                            onPress={() => {
                              setResetPassword(false);
                              setForm({ ...form, password: "" });
                            }}
                          >
                            {t.cancel}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {editing && (
                    <div className="flex items-center gap-3 p-3 bg-[#F6F5FA] rounded-xl border border-[#ECEBF2]/30">
                      <Switch
                        isSelected={formActive}
                        onValueChange={setFormActive}
                        size="sm"
                        color="primary"
                        isDisabled={submitting}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1E1E1E]">{formActive ? t.admin.active : t.admin.inactive}</p>
                        <p className="text-xs text-gb-textSecondary">
                          {formActive ? s.activeStatusDesc : s.inactiveStatusDesc}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="gap-2">
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  onPress={close}
                  isDisabled={submitting}
                  startContent={<X size={14} />}
                >
                  {t.cancel}
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  isDisabled={
                    !form.name.trim() ||
                    !form.role.trim() ||
                    (!Boolean(editing) && (!form.username?.trim() || !form.password?.trim())) ||
                    (Boolean(editing) && resetPassword && !form.password?.trim())
                  }
                  startContent={!submitting && <Save size={14} />}
                >
                  {editing ? t.save : s.addBtn}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleOpen} onClose={onScheduleClose} size="md" placement="center" classNames={MODAL_CLS}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ECEBF2] flex items-center justify-center">
                    <Clock size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">{s.scheduleTitle}</h2>
                    <p className="text-xs text-gb-textSecondary">{scheduleEmployee?.name}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {scheduleLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[#ECEBF2]" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const item = schedule.find((s) => s.dayOfWeek === day.value)!;
                      return (
                        <div key={day.value} className={`rounded-xl p-3 border-2 transition-colors ${item.isWorkingDay ? 'border-[#ECEBF2]/40 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`sched-${day.value}`}
                              checked={item.isWorkingDay}
                              onChange={(e) => updateScheduleItem(day.value, 'isWorkingDay', e.target.checked)}
                              className="w-4 h-4 accent-[#ECEBF2] cursor-pointer"
                            />
                            <label htmlFor={`sched-${day.value}`} className={`font-semibold text-sm cursor-pointer w-8 ${item.isWorkingDay ? 'text-[#1E1E1E]' : 'text-gb-textSecondary'}`}>
                              {day.label}
                            </label>
                            {item.isWorkingDay ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={item.startTime}
                                  onChange={(e) => updateScheduleItem(day.value, 'startTime', e.target.value)}
                                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-[#1E1E1E] bg-white"
                                />
                                <span className="text-gb-textSecondary text-xs">–</span>
                                <input
                                  type="time"
                                  value={item.endTime}
                                  onChange={(e) => updateScheduleItem(day.value, 'endTime', e.target.value)}
                                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-[#1E1E1E] bg-white"
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-gb-textSecondary">{s.dayOff}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {scheduleError && <p className="text-xs text-red-600">{scheduleError}</p>}
                    {scheduleSaved && <p className="text-xs text-green-600">{s.scheduleSavedConfirmation}</p>}
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="gap-2">
                <Button variant="flat" className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold" onPress={close} startContent={<X size={14} />}>
                  {t.close}
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#ECEBF2] to-[#D8D7E2] text-white font-semibold"
                  onPress={saveSchedule}
                  isLoading={scheduleSaving}
                  startContent={!scheduleSaving && <Save size={14} />}
                >
                  {t.save}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Vacation / Absence Modal */}
      <Modal isOpen={isVacationOpen} onClose={onVacationClose} size="lg" placement="center" classNames={MODAL_CLS}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
                    <Plane size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">{s.vacationTitle}</h2>
                    <p className="text-xs text-gb-textSecondary">{vacationEmployee?.name}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-5">
                  {/* Existing vacations list */}
                  <div>
                    <p className="text-xs font-semibold text-gb-textSecondary uppercase tracking-wider mb-2">{s.recordedAbsences}</p>
                    {vacationLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-4 border-blue-400" />
                      </div>
                    ) : vacations.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <CalendarDays size={24} className="mx-auto text-gray-300 mb-1" />
                        <p className="text-sm text-gb-textSecondary">{s.noAbsencesYet}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vacations.map((v) => (
                          <div key={v.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-[#1E1E1E]">
                                  {new Date(v.startDate).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                                  {' – '}
                                  {new Date(v.endDate).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  className={
                                    v.type === 'SickLeave' ? 'bg-red-100 text-red-700' :
                                    v.type === 'PersonalDay' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                  }
                                >
                                  {vacationTypeLabel(v.type)}
                                </Chip>
                              </div>
                              {v.note && <p className="text-xs text-gb-textSecondary mt-0.5 truncate">{v.note}</p>}
                            </div>
                            <Button
                              isIconOnly size="sm" variant="flat"
                              className="bg-red-50 text-red-400 hover:bg-red-100 shrink-0"
                              isLoading={deletingVacationId === v.id}
                              onPress={() => deleteVacation(v.id)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add new vacation form */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gb-textSecondary uppercase tracking-wider mb-3">{s.newAbsenceSection}</p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gb-textSecondary font-medium mb-1 block">{s.fromLabel}</label>
                          <input
                            type="date"
                            value={vacationForm.startDate}
                            onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full text-sm border border-[#ECEBF2]/40 bg-[#F6F5FA] rounded-xl px-3 py-2 text-[#1E1E1E] focus:outline-none focus:border-[#6355E4]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gb-textSecondary font-medium mb-1 block">{s.toLabel}</label>
                          <input
                            type="date"
                            value={vacationForm.endDate}
                            min={vacationForm.startDate || undefined}
                            onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full text-sm border border-[#ECEBF2]/40 bg-[#F6F5FA] rounded-xl px-3 py-2 text-[#1E1E1E] focus:outline-none focus:border-[#6355E4]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gb-textSecondary font-medium mb-1 block">{s.typeLabel}</label>
                        <select
                          value={vacationForm.type}
                          onChange={(e) => setVacationForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full text-sm border border-[#ECEBF2]/40 bg-[#F6F5FA] rounded-xl px-3 py-2 text-[#1E1E1E] focus:outline-none focus:border-[#6355E4]"
                        >
                          {VACATION_TYPES.map(vt => (
                            <option key={vt.value} value={vt.value}>{vt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gb-textSecondary font-medium mb-1 block">{s.noteLabel}</label>
                        <input
                          type="text"
                          placeholder={s.notePlaceholder}
                          value={vacationForm.note}
                          onChange={(e) => setVacationForm(prev => ({ ...prev, note: e.target.value }))}
                          className="w-full text-sm border border-[#ECEBF2]/40 bg-[#F6F5FA] rounded-xl px-3 py-2 text-[#1E1E1E] focus:outline-none focus:border-[#6355E4]"
                        />
                      </div>

                      {vacationError && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} /> {vacationError}
                        </p>
                      )}

                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                        onPress={createVacation}
                        isLoading={vacationSaving}
                        isDisabled={!vacationForm.startDate || !vacationForm.endDate}
                        startContent={!vacationSaving && <Plus size={15} />}
                      >
                        {s.submitAbsenceBtn}
                      </Button>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold" onPress={close} startContent={<X size={14} />}>
                  {t.close}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {dialog}
    </div>
  );
}
