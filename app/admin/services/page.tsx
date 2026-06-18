"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Edit, Trash2, Loader2, Search, X, Check,
    Clock, DollarSign, Eye, EyeOff, Users, Tag,
    ArrowLeft, Save, AlertCircle, ChevronLeft, ChevronRight,
    Sparkles, Scissors, Heart, Droplets, Zap, Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@nextui-org/card";
import { Input, Textarea } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Switch } from "@nextui-org/switch";
import { Button } from "@nextui-org/button";
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
    getAdminServices,
    getAdminCategories,
    getEmployeesForAssignment,
    createAdminService,
    updateAdminService,
    deleteAdminService,
    toggleServiceActive,
    createAdminCategory,
    updateAdminCategory,
    deleteAdminCategory,
    bulkAssignServicesToEmployee,
    getTenantDefaultCurrency,
    type AdminService,
    type AdminServiceCategory,
    type EmployeeForAssignment,
    type CreateServiceData,
    type UpdateServiceData,
    type CreateCategoryData,
    type UpdateCategoryData
} from "@/lib/api/admin-services";
import { formatPrice } from "@/lib/utils/currency";

const modalClassNames = {
    base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
    header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
    footer: "border-t border-[#E8C7C3]/20",
    body: "py-5",
};

const inputClassNames = {
    inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]",
};

type ViewMode = "services" | "categories" | "assignments";
type ModalMode = "create" | "edit" | "view" | "create-category" | "edit-category" | "view-category" | null;

const SERVICES_GUIDE_STORAGE_KEY = "admin-services-guide-seen";

const servicesGuideSteps = [
    {
        title: "Kategorie erstellen",
        description: "Erstelle zuerst eine Kategorie. Kategorien strukturieren deine Leistungen, zum Beispiel Gesicht, Beratung oder Laser.",
    },
    {
        title: "Service zur Kategorie anlegen",
        description: "Danach legst du einen Service an und wählst die passende Kategorie aus. Dort definierst du Dauer, Preis und Beschreibung.",
    },
    {
        title: "Mitarbeiter zuweisen",
        description: "Zum Schluss ordnest du zu, welche Mitarbeiter den Service ausführen. Erst dann kann der Service sauber gebucht werden.",
    },
];

const currencyLabels: Record<string, string> = {
    EUR: "EUR - Euro",
    USD: "USD - US-Dollar",
    CHF: "CHF - Schweizer Franken",
};

const currencySymbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    CHF: "CHF",
};

// Category icons mapping for visual appeal
const categoryIcons: Record<string, React.ReactNode> = {
    'Gesicht': <Heart className="w-5 h-5" />,
    'Hyaluron': <Droplets className="w-5 h-5" />,
    'Fettwegspritze': <Zap className="w-5 h-5" />,
    'Profhilo': <Sparkles className="w-5 h-5" />,
    'Mesotherapie': <Droplets className="w-5 h-5" />,
    'Skinbooster': <Droplets className="w-5 h-5" />,
    'PRP': <Heart className="w-5 h-5" />,
    'Polynukleotide': <Sparkles className="w-5 h-5" />,
    'Botox': <Zap className="w-5 h-5" />,
    'Infusionstherapie': <Droplets className="w-5 h-5" />,
    'BioPeelX': <Sparkles className="w-5 h-5" />,
    'Radiofrequenz': <Zap className="w-5 h-5" />,
    'Premium Gesichtsbehandlungen': <Sparkles className="w-5 h-5" />,
    'Dermalogica': <Heart className="w-5 h-5" />,
    'Fruchtsäurepeeling': <Sparkles className="w-5 h-5" />,
    'Microneedling DermaPen 4': <Zap className="w-5 h-5" />,
    'HIFU Lifting': <Zap className="w-5 h-5" />,
    'Filler': <Droplets className="w-5 h-5" />,
    'Skin & Biorevitalisierung': <Heart className="w-5 h-5" />,
    'Medizinisches Microneedling Dermapen 4': <Zap className="w-5 h-5" />,
    'HIFU - Ultraschall-Lifting': <Zap className="w-5 h-5" />,
    'Radiofrequenz-Microneedling': <Zap className="w-5 h-5" />,
    'NABEAU Signature': <Sparkles className="w-5 h-5" />,
};

export default function AdminServicesPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>("services");
    const [services, setServices] = useState<AdminService[]>([]);
    const [categories, setCategories] = useState<AdminServiceCategory[]>([]);
    const [employees, setEmployees] = useState<EmployeeForAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showServicesGuide, setShowServicesGuide] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [tenantCurrency, setTenantCurrency] = useState("EUR");

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<AdminService | AdminServiceCategory | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeForAssignment | null>(null);
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());


    // Form state for service - change from employeeId to employeeIds array
    const [serviceForm, setServiceForm] = useState<Partial<CreateServiceData>>({
        name: "",
        description: "",
        durationMinutes: 30,
        bufferTimeMinutes: 0,
        price: 0,
        displayOrder: 0,
        categoryId: "",
        employeeIds: [],
    });

    // Form state for category
    const [categoryForm, setCategoryForm] = useState<Partial<CreateCategoryData>>({
        name: "",
        description: "",
        displayOrder: 0,
    });

    useEffect(() => {
        loadData();
    }, [page, viewMode]);

    useEffect(() => {
        getTenantDefaultCurrency()
            .then((currency) => {
                setTenantCurrency(currency);
                setServiceForm((prev) => ({ ...prev, currency: prev.currency || currency }));
            })
            .catch(() => {
                setTenantCurrency("EUR");
                setServiceForm((prev) => ({ ...prev, currency: prev.currency || "EUR" }));
            });
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            let servicesData: AdminService[] = [];
            let categoriesData: AdminServiceCategory[] = [];
            let employeesData: EmployeeForAssignment[] = employees;

            if (viewMode === "services") {
                [servicesData, categoriesData] = await Promise.all([
                    getAdminServices(),
                    getAdminCategories(),
                ]);
            } else if (viewMode === "categories") {
                categoriesData = await getAdminCategories();
                servicesData = categoriesData.flatMap((category) => category.services);
            } else {
                [servicesData, categoriesData, employeesData] = await Promise.all([
                    getAdminServices(),
                    getAdminCategories(),
                    getEmployeesForAssignment(),
                ]);
            }

            if (servicesData.length === 0 && categoriesData.length === 0) {
                const guideSeen = window.localStorage.getItem(SERVICES_GUIDE_STORAGE_KEY);
                if (!guideSeen) {
                    setGuideStep(0);
                    setShowServicesGuide(true);
                    window.localStorage.setItem(SERVICES_GUIDE_STORAGE_KEY, "true");
                }
            }

            // Filter based on search term
            let filteredServices = servicesData;
            let filteredCategories = categoriesData;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredServices = servicesData.filter(s =>
                    s.name.toLowerCase().includes(term) ||
                    s.categoryName.toLowerCase().includes(term) ||
                    s.assignedEmployees?.some(emp => emp.name.toLowerCase().includes(term)) // Updated to check multiple employees
                );

                filteredCategories = categoriesData.filter(c =>
                    c.name.toLowerCase().includes(term) ||
                    (c.description?.toLowerCase().includes(term))
                );
            }

            // Apply pagination based on view mode
            if (viewMode === "services") {
                setTotalCount(filteredServices.length);
                setTotalPages(Math.ceil(filteredServices.length / pageSize));
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                setServices(filteredServices.slice(start, end));
                setCategories(categoriesData); // Keep full categories for modals
            } else if (viewMode === "categories") {
                setTotalCount(filteredCategories.length);
                setTotalPages(Math.ceil(filteredCategories.length / pageSize));
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                setCategories(filteredCategories.slice(start, end));
                setServices(servicesData); // Derived from categories for category detail modals
            } else {
                setEmployees(employeesData);
                setServices(servicesData);
                setCategories(categoriesData);
            }

        } catch (err: any) {
            setError(err.message || "Fehler beim Laden der Daten");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setPage(1);
            loadData();
        }
    };

    const openServicesGuide = () => {
        setGuideStep(0);
        setShowServicesGuide(true);
    };

    const closeServicesGuide = () => {
        setShowServicesGuide(false);
    };

    const handleCreateService = async () => {
        try {
            if (!serviceForm.name || !serviceForm.categoryId || !serviceForm.currency) {
                setModalError("Bitte füllen Sie alle Pflichtfelder aus");
                return;
            }
            setSubmitting(true);
            setModalError(null);
            const newService = await createAdminService({
                name: serviceForm.name,
                description: serviceForm.description || null,
                durationMinutes: serviceForm.durationMinutes!,
                bufferTimeMinutes: serviceForm.bufferTimeMinutes ?? 0,
                price: serviceForm.price!,
                currency: tenantCurrency,
                displayOrder: serviceForm.displayOrder!,
                categoryId: serviceForm.categoryId,
                employeeIds: serviceForm.employeeIds || [],
            });
            setServices(prev => [newService, ...prev]);
            handleClose();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };
    const handleUpdateService = async () => {
        try {
            if (!selectedItem || !('categoryId' in selectedItem)) return;
            setSubmitting(true);
            setModalError(null);
            const updated = await updateAdminService(selectedItem.id, {
                name: serviceForm.name!,
                description: serviceForm.description || null,
                durationMinutes: serviceForm.durationMinutes!,
                bufferTimeMinutes: serviceForm.bufferTimeMinutes ?? 0,
                price: serviceForm.price!,
                currency: tenantCurrency,
                displayOrder: serviceForm.displayOrder!,
                categoryId: serviceForm.categoryId!,
                employeeIds: serviceForm.employeeIds || [],
                isActive: selectedItem.isActive,
            });
            setServices(services.map(s => s.id === updated.id ? updated : s));
            handleClose();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteService = async () => {
        try {
            if (!selectedItem || !('categoryId' in selectedItem)) return;
            setSubmitting(true);
            setModalError(null);
            await deleteAdminService(selectedItem.id);
            setServices(services.filter(s => s.id !== selectedItem.id));
            onDeleteModalClose();
            setSelectedItem(null);
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (service: AdminService) => {
        try {
            const result = await toggleServiceActive(service.id);
            setServices(services.map(s =>
                s.id === service.id ? { ...s, isActive: result.isActive } : s
            ));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCreateCategory = async () => {
        try {
            if (!categoryForm.name) {
                setModalError("Bitte geben Sie einen Namen ein");
                return;
            }
            setSubmitting(true);
            setModalError(null);
            const newCategory = await createAdminCategory(categoryForm as CreateCategoryData);
            setCategories(prev => [newCategory, ...prev].slice(0, pageSize));
            const nextTotalCount = totalCount + 1;
            setTotalCount(nextTotalCount);
            setTotalPages(Math.max(1, Math.ceil(nextTotalCount / pageSize)));
            setViewMode("categories");
            handleClose();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateCategory = async () => {
        try {
            if (!selectedItem || !('services' in selectedItem)) return;
            setSubmitting(true);
            setModalError(null);
            const updated = await updateAdminCategory(selectedItem.id, {
                name: categoryForm.name!,
                description: categoryForm.description || null,
                displayOrder: categoryForm.displayOrder!,
                isActive: selectedItem.isActive,
            });
            setCategories(categories.map(c => c.id === updated.id ? updated : c));
            handleClose();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        try {
            if (!selectedItem || !('services' in selectedItem)) return;
            setSubmitting(true);
            await deleteAdminCategory(selectedItem.id);
            setCategories(categories.filter(c => c.id !== selectedItem.id));
            onDeleteModalClose();
            setSelectedItem(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkAssign = async () => {
        try {
            if (!selectedEmployee) return;
            setSubmitting(true);
            await bulkAssignServicesToEmployee(selectedEmployee.id, Array.from(selectedServices));
            await loadData();
            setSelectedEmployee(null);
            setSelectedServices(new Set());
            setViewMode("services");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForms = () => {
        setServiceForm({
            name: "",
            description: "",
            durationMinutes: 30,
            bufferTimeMinutes: 0,
            price: 0,
            displayOrder: 0,
            categoryId: "",
            employeeIds: [],
            currency: tenantCurrency,
        });
        setCategoryForm({
            name: "",
            description: "",
            displayOrder: 0,
        });
        setSelectedItem(null);
        setModalError(null);
    };

    const handleClose = () => {
        onClose();
        resetForms();
    };

    const openServiceModal = async (mode: "create" | "edit" | "view", service?: AdminService) => {
        // Ensure employees are loaded
        if (employees.length === 0) {
            try {
                const employeesData = await getEmployeesForAssignment();
                setEmployees(employeesData);
            } catch (err) {
                console.error("Failed to load employees:", err);
            }
        }

        if (mode === "edit" && service) {
            setSelectedItem(service);

            // Get the employee IDs
            const employeeIds = service.assignedEmployees?.map(emp => emp.id) || [];
            setServiceForm({
                name: service.name,
                description: service.description,
                durationMinutes: service.durationMinutes,
                bufferTimeMinutes: service.bufferTimeMinutes ?? 0,
                price: service.price,
                currency: tenantCurrency,
                displayOrder: service.displayOrder,
                categoryId: service.categoryId,
                employeeIds: employeeIds,
            });
        } else if (mode === "create") {
            setServiceForm((prev) => ({ ...prev, currency: tenantCurrency }));
        } else if (mode === "view" && service) {
            setSelectedItem(service);
        }
        setModalMode(mode);
        onOpen();
    };

    const openCategoryModal = (mode: "create" | "edit" | "view", category?: AdminServiceCategory) => {
        if (mode === "edit" && category) {
            setSelectedItem(category);
            setCategoryForm({
                name: category.name,
                description: category.description,
                displayOrder: category.displayOrder,
            });
        } else if (mode === "view" && category) {
            setSelectedItem(category);
        }
        setModalMode(mode === "create" ? "create-category" : mode === "edit" ? "edit-category" : "view-category");
        onOpen();
    };

    const openDeleteModal = (item: AdminService | AdminServiceCategory) => {
        setSelectedItem(item);
        onDeleteModalOpen();
    };

    const MobileServiceCard = ({ service }: { service: AdminService }) => (
        <div className="bg-white border border-[#E8C7C3]/30 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {service.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-[#1E1E1E] text-base">{service.name}</div>
                        <div className="text-xs text-[#8A8A8A] mt-0.5">{service.categoryName}</div>
                    </div>
                </div>
                <Chip
                    size="sm"
                    variant="flat"
                    className={service.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                >
                    {service.isActive ? "Aktiv" : "Inaktiv"}
                </Chip>
            </div>

            <div className="space-y-2 mb-3">
                {service.description && (
                    <p className="text-sm text-[#8A8A8A] line-clamp-2">{service.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs bg-[#F5EDEB] px-3 py-1.5 rounded-full">
                        <Clock size={12} className="text-[#017172]" />
                        {service.durationMinutes} Min
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-[#F5EDEB] px-3 py-1.5 rounded-full">
                        <DollarSign size={12} className="text-[#017172]" />
                        {formatPrice(service.price, service.currency)}
                    </span>
                    {/* Replace the single employeeName with multiple employees */}
                    {service.assignedEmployees && service.assignedEmployees.length > 0 && (
                        <div className="flex flex-wrap gap-1 w-full mt-1">
                            {service.assignedEmployees.slice(0, 2).map(emp => (
                                <span key={emp.id} className="flex items-center gap-1 text-xs bg-[#F5EDEB] px-2 py-1 rounded-full">
                                    <Users size={10} className="text-[#017172]" />
                                    {emp.name.split(' ')[0]}
                                </span>
                            ))}
                            {service.assignedEmployees.length > 2 && (
                                <span className="text-xs bg-[#F5EDEB] px-2 py-1 rounded-full">
                                    +{service.assignedEmployees.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8C7C3]/20">
                <div className="text-xs text-[#8A8A8A]">
                    Reihenfolge: {service.displayOrder}
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                        onPress={() => openServiceModal("view", service)}
                    >
                        <Eye size={14} />
                    </Button>
                    <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                        onPress={() => openServiceModal("edit", service)}
                    >
                        <Edit size={14} />
                    </Button>
                    <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        className="bg-red-50 text-red-500 hover:bg-red-100"
                        onPress={() => openDeleteModal(service)}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );

    const MobileCategoryCard = ({ category }: { category: AdminServiceCategory }) => {
        const icon = categoryIcons[category.name] || <Tag className="w-5 h-5" />;
        return (
            <div className="bg-white border border-[#E8C7C3]/30 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center text-white">
                            {icon}
                        </div>
                        <div>
                            <div className="font-semibold text-[#1E1E1E] text-base">{category.name}</div>
                            <div className="text-xs text-[#8A8A8A] mt-0.5">
                                {category.services.length} Services
                            </div>
                        </div>
                    </div>
                    <Chip
                        size="sm"
                        variant="flat"
                        className={category.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                    >
                        {category.isActive ? "Aktiv" : "Inaktiv"}
                    </Chip>
                </div>

                {category.description && (
                    <p className="text-sm text-[#8A8A8A] mb-3 line-clamp-2">{category.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#E8C7C3]/20">
                    <div className="text-xs text-[#8A8A8A]">
                        Reihenfolge: {category.displayOrder}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            isIconOnly
                            variant="flat"
                            className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                            onPress={() => openCategoryModal("view", category)}
                        >
                            <Eye size={14} />
                        </Button>
                        <Button
                            size="sm"
                            isIconOnly
                            variant="flat"
                            className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                            onPress={() => openCategoryModal("edit", category)}
                        >
                            <Edit size={14} />
                        </Button>
                        <Button
                            size="sm"
                            isIconOnly
                            variant="flat"
                            className="bg-red-50 text-red-500 hover:bg-red-100"
                            onPress={() => openDeleteModal(category)}
                            isDisabled={category.services.length > 0}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading && services.length === 0 && categories.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] via-[#F5EDEB] to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#E8C7C3] animate-spin mx-auto mb-4" />
                    <p className="text-[#8A8A8A]">Daten werden geladen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Link
                                href="/admin"
                                className="p-2 hover:bg-[#E8C7C3]/20 rounded-lg transition-colors lg:hidden"
                            >
                                <ArrowLeft size={20} className="text-[#8A8A8A]" />
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">Service Verwaltung</h1>
                            {totalCount > 0 && viewMode !== "assignments" && (
                                <span className="bg-[#017172]/10 text-[#017172] text-sm font-semibold px-3 py-1 rounded-full">
                                    {totalCount}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-[#8A8A8A]">Services, Kategorien und Mitarbeiter-Zuordnung verwalten</p>
                    </div>
                    {viewMode === "services" && (
                        <Button
                            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                            startContent={<Plus size={18} />}
                            onPress={() => openServiceModal("create")}
                        >
                            Neuer Service
                        </Button>
                    )}
                    {viewMode === "categories" && (
                        <Button
                            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                            startContent={<Plus size={18} />}
                            onPress={() => openCategoryModal("create")}
                        >
                            Neue Kategorie
                        </Button>
                    )}
                </div>

                {/* View Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        className={`flex-1 py-6 font-medium transition-all ${viewMode === "services"
                            ? "bg-gradient-to-r from-[#017172] to-[#015f60] text-white shadow-lg shadow-[#017172]/20"
                            : "bg-white text-[#8A8A8A] border border-[#E8C7C3]/30 hover:bg-[#F5EDEB]"
                            }`}
                        onPress={() => {
                            setViewMode("services");
                            setPage(1);
                            setSearchTerm("");
                        }}
                    >
                        Services
                    </Button>
                    <Button
                        className={`flex-1 py-6 font-medium transition-all ${viewMode === "categories"
                            ? "bg-gradient-to-r from-[#017172] to-[#015f60] text-white shadow-lg shadow-[#017172]/20"
                            : "bg-white text-[#8A8A8A] border border-[#E8C7C3]/30 hover:bg-[#F5EDEB]"
                            }`}
                        onPress={() => {
                            setViewMode("categories");
                            setPage(1);
                            setSearchTerm("");
                        }}
                    >
                        Kategorien
                    </Button>
                    <Button
                        className={`flex-1 py-6 font-medium transition-all ${viewMode === "assignments"
                            ? "bg-gradient-to-r from-[#017172] to-[#015f60] text-white shadow-lg shadow-[#017172]/20"
                            : "bg-white text-[#8A8A8A] border border-[#E8C7C3]/30 hover:bg-[#F5EDEB]"
                            }`}
                        onPress={() => {
                            setViewMode("assignments");
                            setSearchTerm("");
                        }}
                    >
                        Mitarbeiter-Zuordnung
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex flex-col gap-3 rounded-lg border border-[#017172]/20 bg-[#017172]/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#017172] shadow-sm">
                            <Info size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#1E1E1E]">So legst du Services richtig an</p>
                            <p className="mt-0.5 text-sm text-[#5F5F5F]">
                                Zuerst eine Kategorie erstellen, danach Services in dieser Kategorie anlegen und Mitarbeiter zuweisen.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="flat"
                        className="self-start bg-white text-[#017172] font-semibold sm:self-center"
                        startContent={<Info size={15} />}
                        onPress={openServicesGuide}
                    >
                        Anleitung öffnen
                    </Button>
                </motion.div>

                {/* Search Bar - Only show for services and categories */}
                {viewMode !== "assignments" && (
                    <Card className="mb-6 border border-[#E8C7C3]/30 shadow-lg">
                        <CardBody className="p-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={viewMode === "services"
                                        ? "Services suchen (Name, Kategorie, Mitarbeiter)..."
                                        : "Kategorien suchen (Name, Beschreibung)..."
                                    }
                                    startContent={<Search size={18} className="text-[#8A8A8A]" />}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    classNames={inputClassNames}
                                    className="flex-1"
                                />
                                <Button
                                    className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold"
                                    onPress={() => {
                                        setPage(1);
                                        loadData();
                                    }}
                                >
                                    Suchen
                                </Button>
                                {searchTerm && (
                                    <Button
                                        className="bg-[#F5EDEB] text-[#1E1E1E] font-semibold"
                                        onPress={() => {
                                            setSearchTerm("");
                                            setPage(1);
                                            loadData();
                                        }}
                                    >
                                        <X size={16} className="mr-2" />
                                        Zurücksetzen
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Error Display */}
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                {/* Content Card */}
                <Card className="border border-[#E8C7C3]/30 shadow-xl">
                    <CardBody className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Spinner size="lg" />
                            </div>
                        ) : viewMode === "services" ? (
                            // Services View
                            services.length === 0 ? (
                                <div className="text-center py-16 text-[#8A8A8A]">
                                    <Scissors className="mx-auto mb-4 text-[#E8C7C3]" size={48} />
                                    <p className="font-medium">Keine Services gefunden</p>
                                    {searchTerm && (
                                        <Button
                                            size="sm"
                                            className="mt-3 bg-[#F5EDEB] text-[#1E1E1E]"
                                            onPress={() => {
                                                setSearchTerm("");
                                                setPage(1);
                                                loadData();
                                            }}
                                        >
                                            Suche zurücksetzen
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[#F5EDEB] border-b border-[#E8C7C3]/30">
                                                <tr>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Service</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Details</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Kategorie</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Mitarbeiter</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Status</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Aktionen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E8C7C3]/10">
                                                {services.map((service, index) => (
                                                    <tr
                                                        key={service.id}
                                                        className={`hover:bg-[#F5EDEB]/60 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#F5EDEB]/20"
                                                            }`}
                                                        onClick={() => openServiceModal("view", service)}
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                                    {service.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-[#1E1E1E] text-sm">{service.name}</div>
                                                                    <div className="text-xs text-[#8A8A8A]">ID: {service.id.slice(-8)}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1 text-xs bg-[#F5EDEB] px-2 py-1 rounded-full">
                                                                    <Clock size={10} className="text-[#017172]" />
                                                                    {service.durationMinutes} Min
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs bg-[#F5EDEB] px-2 py-1 rounded-full">
                                                                    <DollarSign size={10} className="text-[#017172]" />
                                                                    {formatPrice(service.price, service.currency)}
                                                                </span>
                                                                <span className="text-xs text-[#8A8A8A]">
                                                                    #{service.displayOrder}
                                                                </span>
                                                            </div>
                                                            {service.description && (
                                                                <p className="text-xs text-[#8A8A8A] mt-1 line-clamp-1 max-w-[200px]">
                                                                    {service.description}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <Chip size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172]">
                                                                {service.categoryName}
                                                            </Chip>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {service.assignedEmployees && service.assignedEmployees.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {service.assignedEmployees.slice(0, 2).map(emp => (
                                                                        <Chip key={emp.id} size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172] text-xs">
                                                                            {emp.name.split(' ')[0]}
                                                                        </Chip>
                                                                    ))}
                                                                    {service.assignedEmployees.length > 2 && (
                                                                        <Chip size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172] text-xs">
                                                                            +{service.assignedEmployees.length - 2}
                                                                        </Chip>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-[#8A8A8A]">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                className={service.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                                                            >
                                                                {service.isActive ? "Aktiv" : "Inaktiv"}
                                                            </Chip>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <Button
                                                                    size="sm"
                                                                    isIconOnly
                                                                    variant="flat"
                                                                    className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                                                                    onPress={() => openServiceModal("edit", service)}
                                                                >
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    isIconOnly
                                                                    variant="flat"
                                                                    className={`${service.isActive
                                                                        ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                                                        : "bg-green-50 text-green-600 hover:bg-green-100"
                                                                        }`}
                                                                    onPress={() => handleToggleActive(service)}
                                                                >
                                                                    {service.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    isIconOnly
                                                                    variant="flat"
                                                                    className="bg-red-50 text-red-500 hover:bg-red-100"
                                                                    onPress={() => openDeleteModal(service)}
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
                                        {services.map((service) => (
                                            <MobileServiceCard key={service.id} service={service} />
                                        ))}
                                    </div>
                                </>
                            )
                        ) : viewMode === "categories" ? (
                            // Categories View
                            categories.length === 0 ? (
                                <div className="text-center py-16 text-[#8A8A8A]">
                                    <Tag className="mx-auto mb-4 text-[#E8C7C3]" size={48} />
                                    <p className="font-medium">Keine Kategorien gefunden</p>
                                    {searchTerm && (
                                        <Button
                                            size="sm"
                                            className="mt-3 bg-[#F5EDEB] text-[#1E1E1E]"
                                            onPress={() => {
                                                setSearchTerm("");
                                                setPage(1);
                                                loadData();
                                            }}
                                        >
                                            Suche zurücksetzen
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[#F5EDEB] border-b border-[#E8C7C3]/30">
                                                <tr>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Kategorie</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Beschreibung</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Services</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Reihenfolge</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Status</th>
                                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Aktionen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E8C7C3]/10">
                                                {categories.map((category, index) => {
                                                    const icon = categoryIcons[category.name] || <Tag className="w-4 h-4" />;
                                                    return (
                                                        <tr
                                                            key={category.id}
                                                            className={`hover:bg-[#F5EDEB]/60 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#F5EDEB]/20"
                                                                }`}
                                                            onClick={() => openCategoryModal("view", category)}
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-[#017172] flex items-center justify-center text-white shrink-0">
                                                                        {icon}
                                                                    </div>
                                                                    <div className="font-semibold text-[#1E1E1E] text-sm">
                                                                        {category.name}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <p className="text-sm text-[#8A8A8A] line-clamp-1 max-w-[250px]">
                                                                    {category.description || "—"}
                                                                </p>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <Chip size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172]">
                                                                    {category.services.length}
                                                                </Chip>
                                                            </td>
                                                            <td className="px-5 py-4 text-sm text-[#8A8A8A]">
                                                                {category.displayOrder}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className={category.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                                                                >
                                                                    {category.isActive ? "Aktiv" : "Inaktiv"}
                                                                </Chip>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    <Button
                                                                        size="sm"
                                                                        isIconOnly
                                                                        variant="flat"
                                                                        className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                                                                        onPress={() => openCategoryModal("edit", category)}
                                                                    >
                                                                        <Edit size={14} />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        isIconOnly
                                                                        variant="flat"
                                                                        className="bg-red-50 text-red-500 hover:bg-red-100"
                                                                        onPress={() => openDeleteModal(category)}
                                                                        isDisabled={category.services.length > 0}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden p-4">
                                        {categories.map((category) => (
                                            <MobileCategoryCard key={category.id} category={category} />
                                        ))}
                                    </div>
                                </>
                            )
                        ) : (
                            // Assignments View
                            <div className="p-6">
                                {employees.length === 0 ? (
                                    <div className="text-center py-16 text-[#8A8A8A]">
                                        <Users className="mx-auto mb-4 text-[#E8C7C3]" size={48} />
                                        <p className="font-medium">Keine Mitarbeiter gefunden</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {employees.map((employee) => (
                                            <Card key={employee.id} className="border border-[#E8C7C3]/30 hover:shadow-lg transition-shadow">
                                                <CardBody className="p-5">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-lg">
                                                                {employee.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-[#1E1E1E] text-lg">{employee.name}</h3>
                                                                <p className="text-sm text-[#8A8A8A]">{employee.role}</p>
                                                                {employee.specialty && (
                                                                    <p className="text-xs text-[#017172] mt-1">{employee.specialty}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Chip size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172]">
                                                            {employee.serviceCount} Services
                                                        </Chip>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-[#8A8A8A] mb-2">Zugewiesene Services:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {services
                                                                .filter(s => s.assignedEmployees?.some(emp => emp.id === employee.id))
                                                                .slice(0, 5)
                                                                .map(s => (
                                                                    <Chip
                                                                        key={s.id}
                                                                        size="sm"
                                                                        variant="flat"
                                                                        className="bg-[#F5EDEB] text-[#1E1E1E]"
                                                                    >
                                                                        {s.name}
                                                                    </Chip>
                                                                ))}
                                                            {employee.serviceCount > 5 && (
                                                                <Chip size="sm" variant="flat" className="bg-[#F5EDEB] text-[#1E1E1E]">
                                                                    +{employee.serviceCount - 5} weitere
                                                                </Chip>
                                                            )}
                                                            {employee.serviceCount === 0 && (
                                                                <p className="text-xs text-[#8A8A8A]">Keine Services zugewiesen</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        fullWidth
                                                        className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                                                        onPress={() => {
                                                            setSelectedEmployee(employee);
                                                            setSelectedServices(new Set(
                                                                services
                                                                    .filter(s => s.assignedEmployees?.some(emp => emp.id === employee.id))
                                                                    .map(s => s.id)
                                                            ));
                                                        }}
                                                    >
                                                        Services zuweisen
                                                    </Button>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagination - Only for services and categories */}
                        {viewMode !== "assignments" && totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-[#E8C7C3]/20">
                                <div className="text-sm text-[#8A8A8A]">
                                    Seite {page} von {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        isDisabled={page <= 1}
                                        onPress={() => setPage(p => Math.max(1, p - 1))}
                                        startContent={<ChevronLeft size={15} />}
                                        className="bg-[#F5EDEB] text-[#1E1E1E] font-semibold"
                                    >
                                        Zurück
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        isDisabled={page >= totalPages}
                                        onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                                        endContent={<ChevronRight size={15} />}
                                        className="bg-[#F5EDEB] text-[#1E1E1E] font-semibold"
                                    >
                                        Weiter
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Assignment Modal */}
                <Modal
                    isOpen={selectedEmployee !== null}
                    onClose={() => {
                        setSelectedEmployee(null);
                        setSelectedServices(new Set());
                    }}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={modalClassNames}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
                                            <Users size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-[#1E1E1E]">Services zuweisen</h2>
                                            {selectedEmployee && (
                                                <p className="text-xs text-[#8A8A8A]">
                                                    {selectedEmployee.name} · {selectedEmployee.role}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </ModalHeader>

                                <ModalBody>
                                    <AssignmentModalContent
                                        employee={selectedEmployee!}
                                        services={services}
                                        selectedServices={selectedServices}
                                        setSelectedServices={setSelectedServices}
                                        onAssign={handleBulkAssign}
                                        onClose={onClose}
                                        submitting={submitting}
                                    />
                                </ModalBody>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Service Modals */}
                <ServiceModals
                    isOpen={isOpen}
                    modalMode={modalMode}
                    selectedItem={selectedItem}
                    serviceForm={serviceForm}
                    setServiceForm={setServiceForm}
                    categories={categories}
                    employees={employees}
                    tenantCurrency={tenantCurrency}
                    modalError={modalError}
                    submitting={submitting}
                    onSave={modalMode === "create" ? handleCreateService : handleUpdateService}
                    onClose={handleClose}
                />

                {/* Category Modals */}
                <CategoryModals
                    isOpen={isOpen}
                    modalMode={modalMode}
                    selectedItem={selectedItem}
                    categoryForm={categoryForm}
                    setCategoryForm={setCategoryForm}
                    modalError={modalError}
                    submitting={submitting}
                    onSave={modalMode === "create-category" ? handleCreateCategory : handleUpdateCategory}
                    onClose={handleClose}
                />

                {/* View Modals */}
                <ViewModals
                    isOpen={isOpen}
                    modalMode={modalMode}
                    selectedItem={selectedItem}
                    categories={categories}
                    employees={employees}
                    services={services}
                    onClose={handleClose}
                    onEdit={() => {
                        if (selectedItem && 'categoryId' in selectedItem) {
                            handleClose();
                            openServiceModal("edit", selectedItem as AdminService);
                        } else if (selectedItem && 'services' in selectedItem) {
                            handleClose();
                            openCategoryModal("edit", selectedItem as AdminServiceCategory);
                        }
                    }}
                />

                {/* Delete Confirmation Modal */}
                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    selectedItem={selectedItem}
                    submitting={submitting}
                    deleteError={modalError}
                    onConfirm={'categoryId' in (selectedItem || {}) ? handleDeleteService : handleDeleteCategory}
                    onClose={() => {
                        onDeleteModalClose();
                        setSelectedItem(null);
                        setModalError(null);
                    }}
                />

                <AnimatePresence>
                    {showServicesGuide && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="w-full max-w-lg rounded-lg border border-[#E8C7C3]/40 bg-white shadow-2xl"
                                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                            >
                                <div className="flex items-start justify-between gap-4 border-b border-[#E8C7C3]/30 p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#017172]/10 text-[#017172]">
                                            <Info size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#017172]">
                                                Schritt {guideStep + 1} von {servicesGuideSteps.length}
                                            </p>
                                            <h2 className="mt-1 text-lg font-bold text-[#1E1E1E]">
                                                {servicesGuideSteps[guideStep].title}
                                            </h2>
                                        </div>
                                    </div>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-[#8A8A8A]"
                                        onPress={closeServicesGuide}
                                        aria-label="Anleitung schließen"
                                    >
                                        <X size={18} />
                                    </Button>
                                </div>

                                <div className="p-5">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={guideStep}
                                            initial={{ opacity: 0, x: 18 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -18 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <p className="text-sm leading-6 text-[#5F5F5F]">
                                                {servicesGuideSteps[guideStep].description}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>

                                    <div className="mt-6 flex gap-2">
                                        {servicesGuideSteps.map((step, index) => (
                                            <button
                                                key={step.title}
                                                type="button"
                                                className={`h-2 flex-1 rounded-full transition-colors ${
                                                    index === guideStep ? "bg-[#017172]" : "bg-[#E8C7C3]/45"
                                                }`}
                                                onClick={() => setGuideStep(index)}
                                                aria-label={`Schritt ${index + 1} anzeigen`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse gap-2 border-t border-[#E8C7C3]/30 p-5 sm:flex-row sm:justify-between">
                                    <Button
                                        variant="flat"
                                        className="bg-[#F5EDEB] text-[#1E1E1E] font-semibold"
                                        isDisabled={guideStep === 0}
                                        startContent={<ChevronLeft size={16} />}
                                        onPress={() => setGuideStep((step) => Math.max(0, step - 1))}
                                    >
                                        Zurück
                                    </Button>
                                    {guideStep < servicesGuideSteps.length - 1 ? (
                                        <Button
                                            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold"
                                            endContent={<ChevronRight size={16} />}
                                            onPress={() => setGuideStep((step) => Math.min(servicesGuideSteps.length - 1, step + 1))}
                                        >
                                            Weiter
                                        </Button>
                                    ) : (
                                        <Button
                                            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold"
                                            startContent={<Plus size={16} />}
                                            onPress={() => {
                                                closeServicesGuide();
                                                setViewMode("categories");
                                                setPage(1);
                                                setSearchTerm("");
                                                openCategoryModal("create");
                                            }}
                                        >
                                            Kategorie erstellen
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Service Modal Component
function ServiceModals({
    isOpen,
    modalMode,
    selectedItem,
    serviceForm,
    setServiceForm,
    categories,
    employees,
    tenantCurrency,
    modalError,
    submitting,
    onSave,
    onClose
}: {
    isOpen: boolean;
    modalMode: ModalMode | null;
    selectedItem: AdminService | AdminServiceCategory | null;
    serviceForm: Partial<CreateServiceData>;
    setServiceForm: (form: any) => void;
    categories: AdminServiceCategory[];
    employees: EmployeeForAssignment[];
    tenantCurrency: string;
    modalError: string | null;
    submitting: boolean;
    onSave: () => void;
    onClose: () => void;
}) {
    const isCreateOrEdit = modalMode === "create" || modalMode === "edit";
    const [showCurrencyInfo, setShowCurrencyInfo] = useState(false);
    const selectedCurrency = (tenantCurrency || serviceForm.currency || "EUR").toUpperCase();
    const selectedCurrencyLabel = currencyLabels[selectedCurrency] || selectedCurrency;
    const selectedCurrencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
    const employeeOptions = [
        { id: "none", name: "Bitte wählen", role: "" },
        ...employees,
    ];

    return (
        <Modal
            isOpen={isOpen && (modalMode === "create" || modalMode === "edit")}
            onClose={onClose}
            size="2xl"
            placement="center"
            classNames={modalClassNames}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#017172] flex items-center justify-center">
                                    {modalMode === "edit" ? (
                                        <Edit size={15} className="text-white" />
                                    ) : (
                                        <Plus size={15} className="text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#1E1E1E]">
                                        {modalMode === "edit" ? "Service bearbeiten" : "Neuen Service erstellen"}
                                    </h2>
                                    <p className="text-xs text-[#8A8A8A]">
                                        {modalMode === "edit"
                                            ? "Servicedaten aktualisieren"
                                            : "Neuen Service zum System hinzufügen"}
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

                                <Input
                                    label="Name *"
                                    placeholder="z.B. Medizinisches Microneedling"
                                    value={serviceForm.name || ""}
                                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    isRequired
                                    isDisabled={submitting}
                                    classNames={inputClassNames}
                                />

                                <Textarea
                                    label="Beschreibung"
                                    placeholder="Beschreibung des Services..."
                                    value={serviceForm.description || ""}
                                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                    isDisabled={submitting}
                                    classNames={inputClassNames}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Dauer (Minuten) *"
                                        type="number"
                                        min={5}
                                        value={serviceForm.durationMinutes?.toString() || "30"}
                                        onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: parseInt(e.target.value) })}
                                        isRequired
                                        isDisabled={submitting}
                                        endContent={<Clock size={16} className="text-[#8A8A8A]" />}
                                        classNames={inputClassNames}
                                    />
                                    <Input
                                        label="Pufferzeit (Min)"
                                        type="number"
                                        min={0}
                                        max={120}
                                        value={(serviceForm.bufferTimeMinutes ?? 0).toString()}
                                        onChange={(e) => setServiceForm({ ...serviceForm, bufferTimeMinutes: parseInt(e.target.value) || 0 })}
                                        isDisabled={submitting}
                                        description="Pause nach dem Termin"
                                        classNames={inputClassNames}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        className="text-left"
                                        onClick={() => setShowCurrencyInfo(true)}
                                        disabled={submitting}
                                    >
                                        <Input
                                            label="Währung *"
                                            value={selectedCurrencyLabel}
                                            isReadOnly
                                            isDisabled={submitting}
                                            description="Wird zentral in den Einstellungen verwaltet"
                                            classNames={inputClassNames}
                                        />
                                    </button>
                                    <Input
                                        label="Preis*"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={serviceForm.price?.toString() || "0"}
                                        onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                                        isRequired
                                        isDisabled={submitting}
                                        startContent={<span className="text-sm font-semibold text-[#8A8A8A]">{selectedCurrencySymbol}</span>}
                                        classNames={inputClassNames}
                                    />
                                </div>

                                {showCurrencyInfo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-2 rounded-lg border border-[#017172]/20 bg-[#017172]/5 p-3 text-sm text-[#5F5F5F]"
                                    >
                                        <Info size={16} className="mt-0.5 shrink-0 text-[#017172]" />
                                        <div className="flex-1">
                                            Die Währung gilt systemweit. Bitte ändern Sie die Währung unter Einstellungen, wenn alle Preise eine andere Währung verwenden sollen.
                                        </div>
                                        <button
                                            type="button"
                                            className="text-[#8A8A8A] hover:text-[#1E1E1E]"
                                            onClick={() => setShowCurrencyInfo(false)}
                                            aria-label="Währungshinweis schließen"
                                        >
                                            <X size={15} />
                                        </button>
                                    </motion.div>
                                )}

                                <Input
                                    label="Sortierreihenfolge"
                                    type="number"
                                    min={0}
                                    value={serviceForm.displayOrder?.toString() || "0"}
                                    onChange={(e) => setServiceForm({ ...serviceForm, displayOrder: parseInt(e.target.value) })}
                                    isDisabled={submitting}
                                    classNames={inputClassNames}
                                />

                                {/* Kategorie Select */}
                                <Select
                                    label="Kategorie *"
                                    placeholder="Kategorie auswählen"
                                    selectedKeys={serviceForm.categoryId ? [serviceForm.categoryId] : []}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value) {
                                            setServiceForm({ ...serviceForm, categoryId: value });
                                        }
                                    }}
                                    isRequired
                                    isDisabled={submitting}
                                    classNames={{
                                        trigger: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]",
                                        label: "text-[#8A8A8A]",
                                        value: "text-[#1E1E1E]",
                                    }}
                                >
                                    {categories.filter(cat => cat.isActive).map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* Mitarbeiter Multi-Select */}
                                <Select
                                    label="Mitarbeiter (optional)"
                                    placeholder="Bitte wählen"
                                    selectionMode="multiple"
                                    selectedKeys={new Set(serviceForm.employeeIds || [])}
                                    onSelectionChange={(keys) => {
                                        if (keys === "all") {
                                            setServiceForm({ ...serviceForm, employeeIds: employees.map((emp) => emp.id) });
                                            return;
                                        }

                                        const selectedKeys = Array.from(keys) as string[];
                                        if (selectedKeys.includes("none")) {
                                            setServiceForm({ ...serviceForm, employeeIds: [] });
                                            return;
                                        }

                                        setServiceForm({
                                            ...serviceForm,
                                            employeeIds: selectedKeys
                                        });
                                    }}
                                    isDisabled={submitting}
                                    renderValue={(items) => {
                                        if (items.length === 0) {
                                            return <span className="text-[#8A8A8A]">Bitte wählen</span>;
                                        }

                                        return (
                                            <div className="flex flex-wrap gap-1">
                                                {items.map((item) => (
                                                    <Chip key={item.key} size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172]">
                                                        {item.textValue}
                                                    </Chip>
                                                ))}
                                            </div>
                                        );
                                    }}
                                    classNames={{
                                        trigger: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]",
                                        label: "text-[#8A8A8A]",
                                        value: "text-[#1E1E1E]",
                                    }}
                                >
                                    {employeeOptions.map((emp) => (
                                        <SelectItem key={emp.id} textValue={emp.role ? `${emp.name} - ${emp.role}` : emp.name}>
                                            {emp.role ? `${emp.name} - ${emp.role}` : emp.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </ModalBody>

                        <ModalFooter className="gap-2">
                            <Button
                                variant="flat"
                                className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                                onPress={onClose}
                                isDisabled={submitting}
                                startContent={<X size={14} />}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                                onPress={onSave}
                                isLoading={submitting}
                                startContent={!submitting && <Save size={14} />}
                            >
                                {modalMode === "edit" ? "Speichern" : "Erstellen"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

// Category Modal Component
function CategoryModals({
    isOpen,
    modalMode,
    selectedItem,
    categoryForm,
    setCategoryForm,
    modalError,
    submitting,
    onSave,
    onClose
}: {
    isOpen: boolean;
    modalMode: ModalMode | null;
    selectedItem: AdminService | AdminServiceCategory | null;
    categoryForm: Partial<CreateCategoryData>;
    setCategoryForm: (form: any) => void;
    modalError: string | null;
    submitting: boolean;
    onSave: () => void;
    onClose: () => void;
}) {
    const isCreateOrEdit = modalMode === "create-category" || modalMode === "edit-category";

    return (
        <Modal
            isOpen={isOpen && (modalMode === "create-category" || modalMode === "edit-category")}
            onClose={onClose}
            size="lg"
            placement="center"
            classNames={modalClassNames}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#017172] flex items-center justify-center">
                                    {modalMode === "edit-category" ? (
                                        <Edit size={15} className="text-white" />
                                    ) : (
                                        <Plus size={15} className="text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#1E1E1E]">
                                        {modalMode === "edit-category" ? "Kategorie bearbeiten" : "Neue Kategorie erstellen"}
                                    </h2>
                                    <p className="text-xs text-[#8A8A8A]">
                                        {modalMode === "edit-category"
                                            ? "Kategoriedaten aktualisieren"
                                            : "Neue Kategorie zum System hinzufügen"}
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

                                <Input
                                    label="Name *"
                                    placeholder="z.B. Microneedling"
                                    value={categoryForm.name || ""}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    isRequired
                                    isDisabled={submitting}
                                    classNames={inputClassNames}
                                />

                                <Textarea
                                    label="Beschreibung"
                                    placeholder="Beschreibung der Kategorie..."
                                    value={categoryForm.description || ""}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    isDisabled={submitting}
                                    classNames={inputClassNames}
                                />

                                <Input
                                    label="Sortierreihenfolge"
                                    type="number"
                                    min={0}
                                    value={categoryForm.displayOrder?.toString() || "0"}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) })}
                                    isDisabled={submitting}
                                    classNames={inputClassNames}
                                />
                            </div>
                        </ModalBody>

                        <ModalFooter className="gap-2">
                            <Button
                                variant="flat"
                                className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                                onPress={onClose}
                                isDisabled={submitting}
                                startContent={<X size={14} />}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                                onPress={onSave}
                                isLoading={submitting}
                                startContent={!submitting && <Save size={14} />}
                            >
                                {modalMode === "edit-category" ? "Speichern" : "Erstellen"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

// View Modals Component
function ViewModals({
    isOpen,
    modalMode,
    selectedItem,
    categories,
    employees,
    services,
    onClose,
    onEdit
}: {
    isOpen: boolean;
    modalMode: ModalMode | null;
    selectedItem: AdminService | AdminServiceCategory | null;
    categories: AdminServiceCategory[];
    employees: EmployeeForAssignment[];
    services: AdminService[];
    onClose: () => void;
    onEdit: () => void;
}) {
    const isView = modalMode === "view" || modalMode === "view-category";
    const isService = modalMode === "view" && selectedItem && 'categoryId' in selectedItem;
    const isCategory = modalMode === "view-category" && selectedItem && 'services' in selectedItem;

    if (!isView || !selectedItem) return null;

    // Use a ref to track if this is the first render
    const [hasClosed, setHasClosed] = useState(false);

    const handleClose = () => {
        setHasClosed(true);
        // Call onClose after a tiny delay to ensure state updates
        setTimeout(() => {
            onClose();
        }, 10);
    };

    // If we've closed, don't render anything
    if (hasClosed) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={modalClassNames}
        >
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
                                    {isService ? <Scissors size={18} className="text-white" /> : <Tag size={18} className="text-white" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#1E1E1E]">
                                        {isService ? "Service Details" : "Kategorie Details"}
                                    </h2>
                                    <p className="text-xs text-[#8A8A8A]">
                                        {isService ? (selectedItem as AdminService).name : (selectedItem as AdminServiceCategory).name}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody>
                            {isService ? (
                                <ServiceViewContent
                                    service={selectedItem as AdminService}
                                    categories={categories}
                                    employees={employees}
                                />
                            ) : (
                                <CategoryViewContent
                                    category={selectedItem as AdminServiceCategory}
                                    services={services}
                                />
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="flat"
                                className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                                onPress={handleClose}
                                startContent={<X size={14} />}
                            >
                                Schließen
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                                onPress={() => {
                                    setHasClosed(true);
                                    setTimeout(() => {
                                        onClose();
                                        setTimeout(() => onEdit(), 50);
                                    }, 10);
                                }}
                                startContent={<Edit size={14} />}
                            >
                                Bearbeiten
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
// Service View Content
function ServiceViewContent({ service, categories, employees }: { service: AdminService; categories: AdminServiceCategory[]; employees: EmployeeForAssignment[] }) {
    const category = categories.find(c => c.id === service.categoryId);

    return (
        <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Grunddaten</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-[#8A8A8A]">Name</p>
                        <p className="text-sm font-medium text-[#1E1E1E]">{service.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#8A8A8A]">Status</p>
                        <Chip
                            size="sm"
                            variant="flat"
                            className={service.isActive ? "bg-green-100 text-green-700 mt-1" : "bg-red-100 text-red-700 mt-1"}
                        >
                            {service.isActive ? "Aktiv" : "Inaktiv"}
                        </Chip>
                    </div>
                </div>
            </div>

            {/* Description */}
            {service.description && (
                <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                    <h3 className="font-semibold text-[#1E1E1E] text-sm mb-2">Beschreibung</h3>
                    <p className="text-sm text-[#1E1E1E]">{service.description}</p>
                </div>
            )}

            {/* Service Details */}
            <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Leistungsdetails</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Dauer</p>
                        <p className="text-base font-bold text-[#017172]">{service.durationMinutes} Min</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Preis</p>
                        <p className="text-base font-bold text-[#017172]">{formatPrice(service.price, service.currency)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Sortierreihenfolge</p>
                        <p className="text-sm font-semibold text-[#1E1E1E]">{service.displayOrder}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Zuordnung</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Kategorie</p>
                        <p className="text-sm font-semibold text-[#1E1E1E]">{category?.name || "—"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Mitarbeiter</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {service.assignedEmployees && service.assignedEmployees.length > 0 ? (
                                service.assignedEmployees.map(emp => (
                                    <Chip key={emp.id} size="sm" variant="flat" className="bg-[#017172]/10 text-[#017172]">
                                        {emp.name}
                                    </Chip>
                                ))
                            ) : (
                                <p className="text-sm font-semibold text-[#1E1E1E]">—</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Category View Content
function CategoryViewContent({ category, services }: { category: AdminServiceCategory; services: AdminService[] }) {
    const categoryServices = services.filter(s => s.categoryId === category.id);

    return (
        <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Grunddaten</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-[#8A8A8A]">Name</p>
                        <p className="text-sm font-medium text-[#1E1E1E]">{category.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#8A8A8A]">Status</p>
                        <Chip
                            size="sm"
                            variant="flat"
                            className={category.isActive ? "bg-green-100 text-green-700 mt-1" : "bg-red-100 text-red-700 mt-1"}
                        >
                            {category.isActive ? "Aktiv" : "Inaktiv"}
                        </Chip>
                    </div>
                </div>
            </div>

            {/* Description */}
            {category.description && (
                <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                    <h3 className="font-semibold text-[#1E1E1E] text-sm mb-2">Beschreibung</h3>
                    <p className="text-sm text-[#1E1E1E]">{category.description}</p>
                </div>
            )}

            {/* Category Details */}
            <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Kategoriedetails</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Sortierreihenfolge</p>
                        <p className="text-base font-bold text-[#1E1E1E]">{category.displayOrder}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8A8A8A]">Services in dieser Kategorie</p>
                        <p className="text-base font-bold text-[#017172]">{categoryServices.length}</p>
                    </div>
                </div>
            </div>

            {/* Services in this category */}
            {categoryServices.length > 0 && (
                <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                    <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Services in dieser Kategorie</h3>
                    <div className="space-y-2">
                        {categoryServices.slice(0, 5).map((service) => (
                            <div key={service.id} className="bg-white p-3 rounded-lg border border-[#E8C7C3]/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-[#1E1E1E] text-sm">{service.name}</p>
                                        <p className="text-xs text-[#8A8A8A] mt-1">
                                            {service.durationMinutes} Min · {formatPrice(service.price, service.currency)}
                                        </p>
                                    </div>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        className={service.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                                    >
                                        {service.isActive ? "Aktiv" : "Inaktiv"}
                                    </Chip>
                                </div>
                            </div>
                        ))}
                        {categoryServices.length > 5 && (
                            <p className="text-xs text-[#8A8A8A] text-center mt-2">
                                + {categoryServices.length - 5} weitere Services
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Assignment Modal Content
function AssignmentModalContent({
    employee,
    services,
    selectedServices,
    setSelectedServices,
    onAssign,
    onClose,
    submitting
}: {
    employee: EmployeeForAssignment;
    services: AdminService[];
    selectedServices: Set<string>;
    setSelectedServices: (services: Set<string>) => void;
    onAssign: () => void;
    onClose: () => void;
    submitting: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleService = (serviceId: string) => {
        const newSet = new Set(selectedServices);
        if (newSet.has(serviceId)) {
            newSet.delete(serviceId);
        } else {
            newSet.add(serviceId);
        }
        setSelectedServices(newSet);
    };

    const selectAll = () => {
        setSelectedServices(new Set(filteredServices.map(s => s.id)));
    };

    const deselectAll = () => {
        setSelectedServices(new Set());
    };

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <Input
                    placeholder="Services durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    startContent={<Search size={18} className="text-[#8A8A8A]" />}
                    classNames={inputClassNames}
                />
            </div>

            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[#8A8A8A]">
                    {selectedServices.size} von {filteredServices.length} ausgewählt
                </p>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        className="bg-[#F5EDEB] text-[#1E1E1E]"
                        onPress={selectAll}
                        isDisabled={submitting}
                    >
                        Alle auswählen
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        className="bg-[#F5EDEB] text-[#1E1E1E]"
                        onPress={deselectAll}
                        isDisabled={submitting}
                    >
                        Alle abwählen
                    </Button>
                </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                {filteredServices.map((service) => (
                    <Card
                        key={service.id}
                        isPressable
                        onPress={() => toggleService(service.id)}
                        className={`w-full transition-all cursor-pointer ${selectedServices.has(service.id)
                            ? "ring-2 ring-[#017172] ring-offset-2"
                            : "hover:ring-2 hover:ring-[#017172]/30 hover:ring-offset-1"
                            }`}
                    >
                        <CardBody className="p-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedServices.has(service.id)
                                    ? "bg-[#017172] border-[#017172]"
                                    : "border-[#8A8A8A]"
                                    }`}>
                                    {selectedServices.has(service.id) && (
                                        <Check size={14} className="text-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-[#1E1E1E] text-sm">
                                        {service.name}
                                    </h4>
                                    <p className="text-xs text-[#8A8A8A]">
                                        {service.categoryName} · {service.durationMinutes} Min · {formatPrice(service.price, service.currency)}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end gap-3">
                <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={onClose}
                    startContent={<X size={14} />}
                    isDisabled={submitting}
                >
                    Abbrechen
                </Button>
                <Button
                    className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                    onPress={onAssign}
                    startContent={!submitting && <Save size={14} />}
                    isLoading={submitting}
                >
                    Zuweisung speichern
                </Button>
            </div>
        </div>
    );
}

// Delete Modal Component
function DeleteModal({
    isOpen,
    selectedItem,
    submitting,
    deleteError,
    onConfirm,
    onClose
}: {
    isOpen: boolean;
    selectedItem: AdminService | AdminServiceCategory | null;
    submitting: boolean;
    deleteError?: string | null;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const isService = selectedItem && 'categoryId' in selectedItem;
    const isCategory = selectedItem && 'services' in selectedItem;
    
    const title = isService ? "Service löschen" : isCategory ? "Kategorie löschen" : "Löschen";
    const name = selectedItem?.name || "";
    
    // For services - check if there are employee assignments
    const hasEmployeeAssignments = isService && (selectedItem as AdminService).assignedEmployees?.length > 0;
    const employeeCount = isService ? (selectedItem as AdminService).assignedEmployees?.length || 0 : 0;
    
    // For categories - check if there are services
    const hasServices = isCategory && (selectedItem as AdminServiceCategory).services.length > 0;
    const servicesCount = isCategory ? (selectedItem as AdminServiceCategory).services.length : 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
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
                                    <AlertCircle size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#1E1E1E]">{title}</h2>
                                    <p className="text-xs text-[#8A8A8A]">{name}</p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody>
                            <div className="space-y-4">
                                {/* Warning Message */}
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                    <p className="text-sm text-red-700 flex items-start gap-2">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Achtung:</strong> Das Löschen {isService ? "eines Services" : "einer Kategorie"} ist endgültig und kann nicht rückgängig gemacht werden.
                                        </span>
                                    </p>
                                </div>

                                {/* Item Info */}
                                <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold shrink-0">
                                            {name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1E1E1E]">{name}</p>
                                            <p className="text-xs text-[#8A8A8A]">
                                                {isService ? "Service" : "Kategorie"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Impact Warning for Services with Employee Assignments */}
                                {isService && hasEmployeeAssignments && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                        <p className="text-sm text-amber-700 flex items-start gap-2 mb-3">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span className="font-semibold">Folgende Daten werden gelöscht:</span>
                                        </p>
                                        
                                        <div className="space-y-2 pl-7">
                                            {hasEmployeeAssignments && (
                                                <div className="flex items-center gap-2 text-sm text-amber-700">
                                                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                    <span>
                                                        <strong>{employeeCount}</strong> {employeeCount === 1 ? 'Mitarbeiter-Zuordnung' : 'Mitarbeiter-Zuordnungen'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-amber-700 mt-3 pt-2 border-t border-amber-200">
                                            <strong>Hinweis:</strong> Dieser Service wird aus allen Systemen entfernt. 
                                            Alle Buchungen und zugehörigen Daten (E-Mail-Logs) werden unwiderruflich gelöscht.
                                        </p>
                                    </div>
                                )}

                                {/* Simple warning for Services without assignments */}
                                {isService && !hasEmployeeAssignments && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                        <p className="text-sm text-amber-700 flex items-start gap-2">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Hinweis:</strong> Beim Löschen dieses Services werden auch alle 
                                                zugehörigen Buchungen und E-Mail-Logs unwiderruflich gelöscht.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* Impact Warning for Categories with Services */}
                                {isCategory && hasServices && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                        <p className="text-sm text-amber-700 flex items-start gap-2">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Auswirkung:</strong> Diese Kategorie enthält <strong>{servicesCount} Services</strong>.
                                                Sie können die Kategorie erst löschen, wenn alle Services entfernt oder einer anderen Kategorie zugewiesen wurden.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* Backend error (e.g. future bookings exist) */}
                                {deleteError && (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-300">
                                        <p className="text-sm text-red-700 flex items-start gap-2">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span>{deleteError}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="flat"
                                className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                                onPress={onModalClose}
                                isDisabled={submitting}
                                startContent={<X size={14} />}
                            >
                                Abbrechen
                            </Button>
                            
                            {/* Show delete button for services even with assignments (cascade delete) */}
                            {isService && (
                                <Button
                                    className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                                    onPress={onConfirm}
                                    isLoading={submitting}
                                    startContent={!submitting && <Trash2 size={14} />}
                                >
                                    {hasEmployeeAssignments 
                                        ? "Trotzdem löschen" 
                                        : "Endgültig löschen"}
                                </Button>
                            )}
                            
                            {/* Show delete button for categories only if no services */}
                            {isCategory && !hasServices && (
                                <Button
                                    className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                                    onPress={onConfirm}
                                    isLoading={submitting}
                                    startContent={!submitting && <Trash2 size={14} />}
                                >
                                    Endgültig löschen
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
