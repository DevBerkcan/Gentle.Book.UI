"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";
import { Chip } from "@nextui-org/chip";
import { Spinner } from "@nextui-org/spinner";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  X,
  Save,
  User as UserIcon,
  Clock,
  CalendarDays,
  AlertTriangle,
  Download
} from "lucide-react";
import { customersApi, CustomerListItem, CustomerDetail } from "@/lib/api/customers";
import { adminApi } from "@/lib/api/admin";
import { CustomerLoyaltyPanel } from "@/components/admin/customers/CustomerLoyaltyPanel";
import { CustomerLoyaltyCardModal } from "@/components/admin/customers/CustomerLoyaltyCardModal";
import { useConfirm } from "@/components/ConfirmDialog";
import moment from "moment";
import "moment/locale/de";
import { formatPrice } from "@/lib/utils/currency";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";

const modalClassNames = {
  base: "bg-white border border-[#ECEBF2]/30 shadow-2xl",
  header: "border-b border-[#ECEBF2]/20 bg-gradient-to-r from-[#F6F5FA] to-white",
  footer: "border-t border-[#ECEBF2]/20",
  body: "py-5",
};

const inputClassNames = {
  inputWrapper: "bg-[#F6F5FA] border border-[#ECEBF2]/30 hover:border-[#6355E4] data-[focus=true]:border-[#6355E4]",
};

type ModalMode = "create" | "edit" | "view";

export default function CustomersPage() {
  const { isEmployee } = useAuth();
  const { t, lang } = useTranslation();
  const dateLocale = lang === 'de' ? 'de-DE' : 'en-US';
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteReason, setDeleteReason] = useState("");
  const [regularCustomerThreshold, setRegularCustomerThreshold] = useState<number | null>(null);
  const [showLoyaltyCard, setShowLoyaltyCard] = useState(false);

  useEffect(() => {
    adminApi.getLoyaltySettings()
      .then((s) => setRegularCustomerThreshold(s.rewardEveryNVisits > 0 ? s.rewardEveryNVisits : null))
      .catch(() => {});
  }, []);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const { confirm, dialog: confirmDialog } = useConfirm();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersApi.getAll(searchTerm || undefined, page, pageSize);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      setError(err.message || t.admin.customersPage.loadError);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, t]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  async function loadCustomerDetails(id: string) {
    try {
      const customer = await customersApi.getById(id);
      setSelectedCustomer(customer);
    } catch (err: any) {
      /* silent */
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    });
    setModalError(null);
    onOpen();
  }

  function openEditModal(customer: CustomerDetail) {
    setModalMode("edit");
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
    });
    setModalError(null);
    onOpen();
  }

  function openViewModal(customer: CustomerListItem) {
    setModalMode("view");
    loadCustomerDetails(customer.id);
    setModalError(null);
    onOpen();
  }

  function openDeleteModal(customer: CustomerListItem) {
    setSelectedCustomer(null);
    loadCustomerDetails(customer.id).then(() => {
      onDeleteModalOpen();
    });
  }

  function handleClose() {
    onClose();
    setModalError(null);
    setSelectedCustomer(null);
  }

  async function handleSubmit() {
    if (!formData.firstName || !formData.lastName) {
      setModalError(t.admin.customersPage.firstLastNameRequired);
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      if (modalMode === "create") {
        await customersApi.create({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
        });
      } else if (modalMode === "edit" && selectedCustomer) {
        await customersApi.update(selectedCustomer.id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
        });
      }

      await loadCustomers();
      handleClose();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || t.admin.customersPage.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!selectedCustomer) return;

    setDeleting(true);
    try {
      await customersApi.delete(selectedCustomer.id);
      await loadCustomers();
      onDeleteModalClose();
      setDeleteReason("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t.admin.customersPage.deleteError);
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportCustomer(customer: CustomerListItem) {
    try {
      const data = await customersApi.export(customer.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `kunde-${customer.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t.admin.customersPage.deleteError);
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      loadCustomers();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "success";
      case "Pending": return "warning";
      case "Completed": return "primary";
      case "Cancelled": return "danger";
      case "NoShow": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Confirmed": return t.admin.bookingStatus.confirmed;
      case "Pending": return t.admin.bookingStatus.pending;
      case "Completed": return t.admin.bookingStatus.completed;
      case "Cancelled": return t.admin.bookingStatus.cancelled;
      case "NoShow": return t.admin.bookingStatus.noShow;
      default: return status;
    }
  };

  const MobileCustomerCard = ({ customer }: { customer: CustomerListItem }) => (
    <div className="bg-white border border-[#ECEBF2]/30 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6355E4] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {customer.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-[#1E1E1E] text-base flex items-center gap-1.5">
              {customer.fullName}
              {regularCustomerThreshold != null && customer.totalBookings >= regularCustomerThreshold && (
                <span title={t.admin.customersPage.regularCustomerTitle}>🎉</span>
              )}
            </div>
            <div className="text-xs text-[#8A8A8A] mt-0.5">ID: {customer.id.slice(-8)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
            <Mail size={14} className="text-[#6355E4] shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
            <Phone size={14} className="text-[#6355E4] shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
          <Calendar size={14} className="text-[#6355E4] shrink-0" />
          <span>
            {t.admin.customersPage.lastVisitLabel}{customer.lastVisit
              ? new Date(customer.lastVisit).toLocaleDateString(dateLocale)
              : t.admin.customersPage.noVisitYet}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#ECEBF2]/20">
        <Chip size="sm" variant="flat" className="bg-[#6355E4]/10 text-[#6355E4]">
          {fillTemplate(t.admin.customersPage.bookingsCountTemplate, { count: customer.totalBookings })}
        </Chip>
        <div className="flex gap-2">
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
            onPress={async () => {
              const details = await customersApi.getById(customer.id);
              openEditModal(details);
            }}
          >
            <Edit size={14} />
          </Button>
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
            onPress={() => handleExportCustomer(customer)}
          >
            <Download size={14} />
          </Button>
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            className="bg-red-50 text-red-500 hover:bg-red-100"
            onPress={() => openDeleteModal(customer)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] to-white py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">{t.admin.customersPage.title}</h1>
              {totalCount > 0 && (
                <span className="bg-[#6355E4]/10 text-[#6355E4] text-sm font-semibold px-3 py-1 rounded-full">
                  {totalCount}
                </span>
              )}
            </div>
            <p className="text-sm text-[#8A8A8A]">{t.admin.customersPage.subtitle}</p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
            startContent={<Plus size={18} />}
            onPress={openCreateModal}
          >
            {t.admin.customersPage.newCustomer}
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border border-[#ECEBF2]/30 shadow-lg">
          <CardBody className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder={t.admin.customersPage.searchPlaceholder}
                startContent={<Search size={18} className="text-[#8A8A8A]" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                classNames={inputClassNames}
                className="flex-1"
              />
              <Button
                className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold"
                onPress={() => {
                  setPage(1);
                  loadCustomers();
                }}
              >
                {t.admin.bookingsPage.searchLabel}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Customers Table/Cards */}
        <Card className="border border-[#ECEBF2]/30 shadow-xl">
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A8A]">
                <UserIcon className="mx-auto mb-4 text-[#ECEBF2]" size={48} />
                <p className="font-medium">{t.admin.customersPage.noCustomersFound}</p>
                {searchTerm && (
                  <Button
                    size="sm"
                    className="mt-3 bg-[#F6F5FA] text-[#1E1E1E]"
                    onPress={() => {
                      setSearchTerm("");
                      setPage(1);
                      loadCustomers();
                    }}
                  >
                    {t.admin.customersPage.resetSearch}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F6F5FA] border-b border-[#ECEBF2]/30">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">{t.admin.customer}</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">{t.admin.customersPage.contactHeader}</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">{t.admin.bookings}</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">{t.admin.customersPage.lastVisitHeader}</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">{t.admin.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEBF2]/10">
                      {customers.map((customer, index) => (
                        <tr
                          key={customer.id}
                          className={`hover:bg-[#F6F5FA]/60 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#F6F5FA]/20"
                            }`}
                          onClick={() => openViewModal(customer)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#6355E4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {customer.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
                                  {customer.fullName}
                                  {regularCustomerThreshold != null && customer.totalBookings >= regularCustomerThreshold && (
                                    <span title={t.admin.customersPage.regularCustomerTitle}>🎉</span>
                                  )}
                                </div>
                                <div className="text-xs text-[#8A8A8A]">ID: {customer.id.slice(-8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {customer.email && (
                              <div className="flex items-center gap-1 text-xs text-[#8A8A8A] mb-1">
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate max-w-[200px]">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-xs text-[#8A8A8A]">
                                <Phone size={12} className="shrink-0" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Chip size="sm" variant="flat" className="bg-[#6355E4]/10 text-[#6355E4]">
                              {customer.totalBookings}
                            </Chip>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#8A8A8A]">
                            {customer.lastVisit
                              ? new Date(customer.lastVisit).toLocaleDateString(dateLocale)
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                isIconOnly
                                variant="flat"
                                className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
                                onPress={async () => {
                                  const details = await customersApi.getById(customer.id);
                                  openEditModal(details);
                                }}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                isIconOnly
                                variant="flat"
                                className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
                                onPress={() => handleExportCustomer(customer)}
                              >
                                <Download size={14} />
                              </Button>
                              <Button
                                size="sm"
                                isIconOnly
                                variant="flat"
                                className="bg-red-50 text-red-500 hover:bg-red-100"
                                onPress={() => openDeleteModal(customer)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4">
                  {customers.map((customer) => (
                    <MobileCustomerCard key={customer.id} customer={customer} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[#ECEBF2]/20">
                    <div className="text-sm text-[#8A8A8A]">
                      {fillTemplate(t.admin.bookingsPage.pageOfTemplate, { page, total: totalPages })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={page <= 1}
                        onPress={() => setPage(p => Math.max(1, p - 1))}
                        startContent={<ChevronLeft size={15} />}
                        className="bg-[#F6F5FA] text-[#1E1E1E] font-semibold"
                      >
                        {t.back}
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={page >= totalPages}
                        onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                        endContent={<ChevronRight size={15} />}
                        className="bg-[#F6F5FA] text-[#1E1E1E] font-semibold"
                      >
                        {t.next}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen && (modalMode === "create" || modalMode === "edit")}
        onClose={handleClose}
        size="lg"
        placement="center"
        classNames={modalClassNames}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6355E4] flex items-center justify-center">
                    {modalMode === "edit" ? (
                      <Edit size={15} className="text-white" />
                    ) : (
                      <Plus size={15} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">
                      {modalMode === "edit" ? t.admin.customersPage.editCustomer : t.admin.customersPage.createCustomer}
                    </h2>
                    <p className="text-xs text-[#8A8A8A]">
                      {modalMode === "edit"
                        ? t.admin.customersPage.updateCustomerDataDesc
                        : t.admin.customersPage.addNewCustomerDesc}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  {modalError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                      <AlertCircle size={14} /> {modalError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t.admin.calendarPage.firstName}
                      placeholder={t.admin.calendarPage.firstNamePlaceholder}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      isRequired
                      isDisabled={submitting}
                      classNames={inputClassNames}
                    />
                    <Input
                      label={t.admin.calendarPage.lastName}
                      placeholder={t.admin.calendarPage.lastNamePlaceholder}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      isRequired
                      isDisabled={submitting}
                      classNames={inputClassNames}
                    />
                  </div>

                  <Input
                    label={t.admin.email}
                    type="email"
                    placeholder={t.admin.customersPage.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    isDisabled={submitting}
                    classNames={inputClassNames}
                    startContent={<Mail size={16} className="text-[#8A8A8A]" />}
                  />

                  <Input
                    label={t.admin.phone}
                    placeholder={t.admin.customersPage.phonePlaceholder}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    isDisabled={submitting}
                    classNames={inputClassNames}
                    startContent={<Phone size={16} className="text-[#8A8A8A]" />}
                  />

                  <Input
                    label={t.admin.calendarPage.notesOptionalField}
                    placeholder={t.admin.customersPage.notesPlaceholder}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    isDisabled={submitting}
                    classNames={inputClassNames}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="gap-2">
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  onPress={handleClose}
                  isDisabled={submitting}
                  startContent={<X size={14} />}
                >
                  {t.cancel}
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  startContent={!submitting && <Save size={14} />}
                >
                  {modalMode === "edit" ? t.save : t.admin.customersPage.createAction}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isOpen && modalMode === "view"}
        onClose={handleClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={modalClassNames}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6355E4] flex items-center justify-center">
                    <UserIcon size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E1E1E]">{t.admin.customersPage.customerDetails}</h2>
                    {selectedCustomer && (
                      <p className="text-xs text-[#8A8A8A]">{fillTemplate(t.admin.customersPage.customerSinceTemplate, { date: moment(selectedCustomer.createdAt).locale(lang).format("MMMM YYYY") })}</p>
                    )}
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedCustomer ? (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">{t.admin.customersPage.personalData}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#8A8A8A]">{t.admin.calendarPage.firstName}</p>
                          <p className="text-sm font-medium text-[#1E1E1E]">{selectedCustomer.firstName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8A8A8A]">{t.admin.calendarPage.lastName}</p>
                          <p className="text-sm font-medium text-[#1E1E1E]">{selectedCustomer.lastName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">{t.admin.customersPage.contactHeader}</h3>
                      <div className="space-y-2">
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-[#6355E4] shrink-0" />
                            <a href={`mailto:${selectedCustomer.email}`} className="text-sm text-[#1E1E1E] hover:text-[#6355E4] break-all">
                              {selectedCustomer.email}
                            </a>
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-[#6355E4] shrink-0" />
                            <a href={`tel:${selectedCustomer.phone}`} className="text-sm text-[#1E1E1E] hover:text-[#6355E4]">
                              {selectedCustomer.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">{t.admin.customersPage.statistics}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">{t.admin.customersPage.totalBookingsLabel}</p>
                          <p className="text-xl font-bold text-[#6355E4]">{selectedCustomer.totalBookings}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">{t.admin.bookingStatus.noShow}</p>
                          <p className="text-xl font-bold text-red-500">{selectedCustomer.noShowCount}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">{t.admin.customersPage.lastVisitHeader}</p>
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {selectedCustomer.lastVisit
                              ? new Date(selectedCustomer.lastVisit).toLocaleDateString(dateLocale)
                              : "—"}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">{t.admin.customersPage.customerSinceLabel}</p>
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {new Date(selectedCustomer.createdAt).toLocaleDateString(dateLocale)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Loyalty Points (Agency) */}
                    <CustomerLoyaltyPanel customerId={selectedCustomer.id} />

                    {/* Stammkunden-Kundenkarte (Agency) */}
                    {regularCustomerThreshold != null && (
                      <button
                        type="button"
                        onClick={() => setShowLoyaltyCard(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#F6F5FA] text-[#6355E4] hover:bg-[#ECEBF2] transition-colors border border-[#ECEBF2]/40"
                      >
                        {t.admin.customersPage.printLoyaltyCard}
                      </button>
                    )}

                    {/* Notes */}
                    {selectedCustomer.notes && (
                      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-2">{t.admin.calendarPage.notes}</h3>
                        <p className="text-sm text-[#1E1E1E] italic">"{selectedCustomer.notes}"</p>
                      </div>
                    )}

                    {/* Recent Bookings */}
                    {selectedCustomer.recentBookings.length > 0 && (
                      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">{t.admin.customersPage.recentBookings}</h3>
                        <div className="space-y-2">
                          {selectedCustomer.recentBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="bg-white p-3 rounded-lg border border-[#ECEBF2]/20"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div>
                                  <p className="font-semibold text-[#1E1E1E] text-sm">{booking.serviceName}</p>
                                  <p className="text-xs text-[#8A8A8A] mt-1">
                                    {new Date(booking.bookingDate).toLocaleDateString(dateLocale)} · {booking.startTime} – {booking.endTime}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                                  <Chip color={getStatusColor(booking.status)} size="sm" variant="flat">
                                    {getStatusLabel(booking.status)}
                                  </Chip>
                                  <p className="text-xs font-semibold text-[#6355E4] whitespace-nowrap">
                                    {formatPrice(booking.price, booking.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  startContent={<X size={14} />}
                  onPress={handleClose}
                >
                  {t.close}
                </Button>
                {selectedCustomer && (
                  <Button
                    className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                    onPress={() => {
                      handleClose();
                      openEditModal(selectedCustomer);
                    }}
                  >
                    <Edit size={14} className="mr-2" />
                    {t.admin.edit}
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          onDeleteModalClose();
          setDeleteReason("");
        }}
        size="lg"
        placement="center"
        classNames={modalClassNames}
      >
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E1E1E]">{t.admin.customersPage.deleteCustomer}</h2>
                    <p className="text-xs text-[#8A8A8A]">
                      {selectedCustomer?.fullName}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedCustomer && (
                  <div className="space-y-4">
                    {/* Warning Message */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                      <p className="text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>
                          {t.admin.customersPage.deleteWarning}
                        </span>
                      </p>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-[#F6F5FA] p-4 rounded-xl border border-[#ECEBF2]/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#6355E4] flex items-center justify-center text-white font-bold shrink-0">
                          {selectedCustomer.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1E1E]">{selectedCustomer.fullName}</p>
                          <p className="text-xs text-[#8A8A8A]">{fillTemplate(t.admin.customersPage.customerSinceTemplate, { date: new Date(selectedCustomer.createdAt).toLocaleDateString(dateLocale) })}</p>
                        </div>
                      </div>

                      {/* Booking Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-[#6355E4] shrink-0" />
                            <span className="text-xs text-[#8A8A8A]">{t.admin.bookings}</span>
                          </div>
                          <p className="text-xl font-bold text-[#1E1E1E]">{selectedCustomer.totalBookings}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#6355E4] shrink-0" />
                            <span className="text-xs text-[#8A8A8A]">{t.admin.customersPage.lastVisitHeader}</span>
                          </div>
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {selectedCustomer.lastVisit
                              ? new Date(selectedCustomer.lastVisit).toLocaleDateString(dateLocale)
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Impact Warning */}
                    {selectedCustomer.totalBookings > 0 && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            {fillTemplate(t.admin.customersPage.impactWarningTemplate, { count: selectedCustomer.totalBookings })}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  onPress={() => {
                    onModalClose();
                    setDeleteReason("");
                  }}
                  isDisabled={deleting}
                  startContent={<X size={14} />}
                >
                  {t.cancel}
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                  onPress={handleDeleteCustomer}
                  isLoading={deleting}
                  startContent={!deleting && <Trash2 size={14} />}
                >
                  {t.admin.customersPage.anonymizeConfirmBtn}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {confirmDialog}

      {selectedCustomer && regularCustomerThreshold != null && (
        <CustomerLoyaltyCardModal
          open={showLoyaltyCard}
          onClose={() => setShowLoyaltyCard(false)}
          customerName={selectedCustomer.fullName}
          totalBookings={selectedCustomer.totalBookings}
          threshold={regularCustomerThreshold}
        />
      )}
    </div>
  );
}
