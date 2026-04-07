"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/de";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Spinner } from "@nextui-org/spinner";
import { Select, SelectItem } from "@nextui-org/select";
import { Input, Textarea } from "@nextui-org/input";
import {
  Calendar as CalendarIconLucide, Clock, User, Phone, Mail, Plus, AlertCircle,
  CheckCircle, XCircle, Ban, Scissors, MessageCircle, Hash, CreditCard,
  CalendarDays, ChevronRight, Search
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { Switch } from "@nextui-org/switch";
import { CalendarRange, X } from "lucide-react";

import { adminApi, BookingListItem, Service, CreateManualBookingDto, ManualBookingResponse } from "@/lib/api/admin";
import { bookingApi, TimeSlot, Employee, getAvailability } from "@/lib/api/booking";
import { blockedTimeSlotsApi, BlockedTimeSlot, CreateBlockedTimeSlotDto, CreateBlockedDateRangeDto } from "@/lib/api/blockedTimeSlots";
import { useAuth } from "@/lib/contexts/AuthContext";
import { formatPrice } from "@/lib/utils/currency";

moment.locale('de');
const localizer = momentLocalizer(moment);

interface BookingEvent {
  id: string; title: string; start: Date; end: Date;
  resource: BookingListItem; type: 'booking'; status: string;
}
interface BlockedEvent {
  id: string; title: string; start: Date; end: Date;
  resource: BlockedTimeSlot; type: 'blocked';
}
type CalendarEvent = BookingEvent | BlockedEvent;

const statusColors = {
  Confirmed: "#10b981", Pending: "#f59e0b", Completed: "#3b82f6",
  Cancelled: "#ef4444", NoShow: "#6b7280"
};
const statusLabels = {
  Confirmed: "Bestätigt", Pending: "Ausstehend", Completed: "Abgeschlossen",
  Cancelled: "Storniert", NoShow: "Nicht erschienen"
};
const statusIcons = {
  Confirmed: CheckCircle, Pending: Clock, Completed: CheckCircle,
  Cancelled: XCircle, NoShow: XCircle
};

const modalClassNames = {
  base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
  header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
  footer: "border-t border-[#E8C7C3]/20 bg-[#F5EDEB]/30",
  body: "py-4"
};

export default function AdminCalendarPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['Admin', 'Owner']);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false);
  const [isBlockedSlotModalOpen, setIsBlockedSlotModalOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updating, setUpdating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingBlocked, setSubmittingBlocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<ManualBookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isRange, setIsRange] = useState(false);
  const [singleForm, setSingleForm] = useState<CreateBlockedTimeSlotDto>({
    blockDate: "",
    startTime: "",
    endTime: "",
    reason: ""
  });
  const [rangeForm, setRangeForm] = useState<CreateBlockedDateRangeDto>({
    fromDate: "",
    toDate: "",
    startTime: "",
    endTime: "",
    reason: ""
  });

  // Add these states with the other useState declarations
const [employeeServices, setEmployeeServices] = useState<Service[]>([]);
const [loadingEmployeeServices, setLoadingEmployeeServices] = useState(false);

  const [bookingForm, setBookingForm] = useState<{
    serviceId: string;
    bookingDate: string;
    startTime: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    customerNotes: string;
  }>({
    serviceId: '',
    bookingDate: moment().format('YYYY-MM-DD'),
    startTime: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerNotes: ''
  });

  // Load employees from API on mount
  useEffect(() => {
    bookingApi.getEmployees()
      .then((data: Employee[]) => {
        setEmployees(data);
        if (data.length > 0) setSelectedEmployeeId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingEmployees(false));
  }, []);

  useEffect(() => { loadServices(); }, []);

  const [isServicePopoverOpen, setIsServicePopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (bookingForm.serviceId && bookingForm.bookingDate && selectedEmployeeId) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [bookingForm.serviceId, bookingForm.bookingDate, selectedEmployeeId]);


  // Add this function to load services by employee
async function loadServicesForEmployee(employeeId: string) {
  if (!employeeId) return;
  
  setLoadingEmployeeServices(true);
  try {
    // You'll need to add this function to your adminApi
    const data = await adminApi.getServicesByEmployee(employeeId);
    setEmployeeServices(data);
  } catch (error) {
    console.error("Error loading employee services:", error);
    setEmployeeServices([]);
  } finally {
    setLoadingEmployeeServices(false);
  }
}
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startOfMonth = moment(date).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment(date).endOf('month').format('YYYY-MM-DD');

      // Load bookings (admin sees all)
      const bookingsResponse = await adminApi.getBookings({
        fromDate: startOfMonth,
        toDate: endOfMonth,
        pageSize: 100
      });

      // Load blocked slots (admin sees all with all=true)
      const startDate = new Date(date);
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date(date);
      endDate.setMonth(endDate.getMonth() + 1);

      const blockedSlots = await blockedTimeSlotsApi.getAll(startDate, endDate, isAdmin);

      const bookingEvents: BookingEvent[] = bookingsResponse.items.map((booking: BookingListItem) => ({
        id: booking.id,
        title: `${booking.customerName} - ${booking.serviceName}`,
        start: new Date(`${booking.bookingDate}T${booking.startTime}`),
        end: new Date(`${booking.bookingDate}T${booking.endTime}`),
        resource: booking,
        type: 'booking',
        status: booking.status
      }));

      const blockedEvents: BlockedEvent[] = blockedSlots.map((slot: BlockedTimeSlot) => ({
        id: `blocked-${slot.id}`,
        title: `🚫 Blockiert${slot.reason ? `: ${slot.reason}` : ''}`,
        start: new Date(`${slot.blockDate}T${slot.startTime}`),
        end: new Date(`${slot.blockDate}T${slot.endTime}`),
        resource: slot,
        type: 'blocked'
      }));

      setEvents([...bookingEvents, ...blockedEvents]);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, [date, isAdmin]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  async function loadServices() {
    try {
      const data = await adminApi.getServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  }

  async function loadAvailableSlots() {
    if (!bookingForm.serviceId || !bookingForm.bookingDate || !selectedEmployeeId) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      // Pass employeeId to getAvailability
      const data = await getAvailability(bookingForm.serviceId, bookingForm.bookingDate, selectedEmployeeId);
      const available = data.availableSlots?.filter(slot => slot.isAvailable) || [];
      setAvailableSlots(available);

      if (bookingForm.startTime) {
        const isStillAvailable = available.some(slot => slot.startTime === bookingForm.startTime);
        if (!isStillAvailable) setBookingForm(prev => ({ ...prev, startTime: '' }));
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedEvent || selectedEvent.type !== 'booking') return;
    try {
      setUpdating(true);
      await adminApi.updateBookingStatus(selectedEvent.resource.id, { status: newStatus });
      setEvents(prev => prev.map(event =>
        event.id === selectedEvent.id && event.type === 'booking'
          ? { ...event, status: newStatus, resource: { ...event.resource, status: newStatus } as BookingListItem }
          : event
      ));
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

const resetManualBookingForm = () => {
  setSuccess(false);
  setCreatedBooking(null);
  setSelectedSlot(null);
  setError(null);
  setEmployeeServices([]); // Add this line
  if (employees.length > 0) setSelectedEmployeeId(employees[0].id);
  setBookingForm({
    serviceId: '',
    bookingDate: moment().format('YYYY-MM-DD'),
    startTime: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerNotes: ''
  });
  setAvailableSlots([]);

    if (employees.length > 0) {
    const firstEmployeeId = employees[0].id;
    setSelectedEmployeeId(firstEmployeeId);
    loadServicesForEmployee(firstEmployeeId);
  }
};

const handleCreateManualBooking = async () => {
  setError(null);
  setSubmitting(true);
  try {
    // First try to find in employeeServices, then fall back to global services
    const selectedService = employeeServices.find(s => s.id === bookingForm.serviceId) || 
                           services.find(s => s.id === bookingForm.serviceId);
    
    if (!selectedService) throw new Error("Service nicht gefunden");

    const availabilityCheck = await bookingApi.getAvailability(bookingForm.serviceId, bookingForm.bookingDate);
    const isSlotAvailable = availabilityCheck.availableSlots?.some(
      (slot: { startTime: string; isAvailable: any; }) => slot.startTime === bookingForm.startTime && slot.isAvailable
    );
    if (!isSlotAvailable) throw new Error("Dieser Zeitslot ist nicht mehr verfügbar.");

    const bookingData: CreateManualBookingDto = {
      serviceId: bookingForm.serviceId,
      bookingDate: bookingForm.bookingDate,
      startTime: bookingForm.startTime,
      firstName: bookingForm.firstName.trim(),
      lastName: bookingForm.lastName.trim(),
      email: bookingForm.email?.trim() || null,
      phone: bookingForm.phone?.trim() || null,
      customerNotes: bookingForm.customerNotes?.trim() || null,
      employeeId: selectedEmployeeId || null,
    };

    const booking = await adminApi.createManualBooking(bookingData);
    setCreatedBooking(booking);
    setSuccess(true);
    await loadEvents();

    setTimeout(() => {
      setIsManualBookingModalOpen(false);
      resetManualBookingForm();
    }, 3000);
  } catch (error: any) {
    console.error("Error creating manual booking:", error);
    setError(error.message || "Fehler beim Erstellen der Buchung");
  } finally {
    setSubmitting(false);
  }
};

  const handleCreateBlockedSlot = async () => {
    setError(null);
    setSubmittingBlocked(true);
    try {
      if (isRange) {
        if (!rangeForm.fromDate || !rangeForm.toDate || !rangeForm.startTime || !rangeForm.endTime) {
          throw new Error("Bitte alle Pflichtfelder ausfüllen");
        }
        const result = await blockedTimeSlotsApi.createRange(rangeForm);
        if (!result.success) throw new Error(result.message);
      } else {
        if (!singleForm.blockDate || !singleForm.startTime || !singleForm.endTime) {
          throw new Error("Bitte alle Pflichtfelder ausfüllen");
        }
        const result = await blockedTimeSlotsApi.create(singleForm);
        if (!result.success) throw new Error(result.message);
      }

      await loadEvents();
      setIsBlockedSlotModalOpen(false);

      // Reset forms
      setIsRange(false);
      setSingleForm({ blockDate: "", startTime: "", endTime: "", reason: "" });
      setRangeForm({ fromDate: "", toDate: "", startTime: "", endTime: "", reason: "" });

    } catch (error: any) {
      setError(error.message || "Fehler beim Erstellen des blockierten Slots");
    } finally {
      setSubmittingBlocked(false);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    if (event.type === 'blocked') {
      return {
        style: {
          backgroundColor: '#6b7280',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)',
          borderRadius: "4px",
          opacity: 0.8,
          color: "white",
          border: "2px dashed #9ca3af",
          display: "block"
        }
      };
    }
    const backgroundColor = statusColors[(event.status as keyof typeof statusColors)] || "#3b82f6";
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontWeight: 500,
        fontSize: '0.85rem'
      }
    };
  };

  const filteredEvents = filterStatus === "all" ? events
    : filterStatus === "blocked" ? events.filter(e => e.type === 'blocked')
      : events.filter(e => e.type === 'booking' && e.status === filterStatus);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsBookingModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setBookingForm({
      ...bookingForm,
      bookingDate: moment(slotInfo.start).format('YYYY-MM-DD'),
      startTime: '',
      serviceId: ''
    });
    setAvailableSlots([]);
    setIsManualBookingModalOpen(true);
  };

  const handleOpenManualBooking = () => {
    resetManualBookingForm();
    setIsManualBookingModalOpen(true);
  };

  const selectedService = services.find(s => s.id === bookingForm.serviceId);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-[#8A8A8A]">Kalender wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">Kalender</h1>
            <p className="text-[#8A8A8A] flex items-center gap-2 text-sm">
              Verwalten Sie Termine und blockierte Zeiten
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              className="bg-gradient-to-r from-[#6b7280] to-[#4b5563] text-white font-semibold shadow-lg"
              startContent={<Ban size={18} />}
              onPress={() => setIsBlockedSlotModalOpen(true)}
            >
              Zeitslot blockieren
            </Button>
            <Button
              className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
              startContent={<Plus size={18} />}
              onPress={handleOpenManualBooking}
            >
              Buchung erstellen
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-4 border border-[#E8C7C3]/20 shadow-xl">
          <CardBody className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <Select
                label="Filter nach Status"
                selectedKeys={filterStatus ? [filterStatus] : []}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="max-w-xs"
                classNames={{ trigger: "bg-white border border-[#E8C7C3]/30" }}
              >
                <SelectItem key="all" value="all">Alle Termine</SelectItem>
                <SelectItem key="blocked" value="blocked">Blockierte Zeiten</SelectItem>
                <SelectItem key="Confirmed" value="Confirmed">Bestätigt</SelectItem>
                <SelectItem key="Pending" value="Pending">Ausstehend</SelectItem>
                <SelectItem key="Completed" value="Completed">Abgeschlossen</SelectItem>
                <SelectItem key="Cancelled" value="Cancelled">Storniert</SelectItem>
                <SelectItem key="NoShow" value="NoShow">Nicht erschienen</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Calendar */}
        <Card className="border border-[#E8C7C3]/20 shadow-xl overflow-hidden">
          <CardBody className="p-0">
            <div className="h-[600px] lg:h-[700px]">
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultView={Views.MONTH}
                view={view}
                onView={(newView) => setView(newView as typeof view)}
                date={date}
                onNavigate={setDate}
                messages={{
                  next: "Nächster",
                  previous: "Vorheriger",
                  today: "Heute",
                  month: "Monat",
                  week: "Woche",
                  day: "Tag",
                  agenda: "Liste",
                  date: "Datum",
                  time: "Zeit",
                  event: "Termin",
                  noEventsInRange: "Keine Termine in diesem Zeitraum"
                }}
                formats={{
                  dateFormat: 'DD',
                  dayFormat: 'ddd DD.MM',
                  dayHeaderFormat: 'dddd DD.MM.YYYY',
                  dayRangeHeaderFormat: ({ start, end }) => `${moment(start).format('DD.MM.YYYY')} - ${moment(end).format('DD.MM.YYYY')}`,
                  monthHeaderFormat: 'MMMM YYYY',
                  agendaHeaderFormat: ({ start, end }) => `${moment(start).format('DD.MM.YYYY')} - ${moment(end).format('DD.MM.YYYY')}`
                }}
                culture="de"
              />
            </div>
          </CardBody>
        </Card>

        {/* Legend */}
        <Card className="mt-4 border border-[#E8C7C3]/20 shadow-xl">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {Object.entries(statusLabels).map(([status, label]) => {
                const Icon = statusIcons[status as keyof typeof statusIcons];
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }} />
                    <span className="text-[#1E1E1E] flex items-center gap-1">
                      {Icon && <Icon size={14} className="text-[#8A8A8A]" />}{label}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#6b7280]" />
                <span className="text-[#1E1E1E] flex items-center gap-1">
                  <Ban size={14} className="text-[#8A8A8A]" />Blockierte Zeit
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Booking Details Modal */}
        <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} size="2xl" scrollBehavior="inside" classNames={modalClassNames}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  {selectedEvent?.type === 'booking' ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-[#1E1E1E]">Termindetails</h2>
                        <p className="text-sm text-[#8A8A8A] flex items-center gap-1">
                          <Hash size={12} />{selectedEvent?.resource.bookingNumber}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: statusColors[selectedEvent?.status as keyof typeof statusColors] }}>
                        {statusLabels[selectedEvent?.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#6b7280] flex items-center justify-center">
                        <Ban size={20} className="text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">Blockierte Zeit</h2>
                    </div>
                  )}
                </ModalHeader>
                <ModalBody>
                  {selectedEvent?.type === 'booking' ? (
                    <div className="space-y-4">
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Scissors size={16} className="text-[#017172]" />
                          <span className="font-semibold text-[#1E1E1E]">Service</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-[#1E1E1E]">{selectedEvent.resource.serviceName}</p>
                            <p className="text-sm text-[#8A8A8A] flex items-center gap-1 mt-1">
                              <Clock size={13} />
                              {moment(selectedEvent.start).format('DD.MM.YYYY')} · {moment(selectedEvent.start).format('HH:mm')} – {moment(selectedEvent.end).format('HH:mm')}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-[#017172]">{formatPrice(selectedEvent.resource.price, selectedEvent.resource.currency)}</p>
                        </div>
                      </div>

                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <User size={16} className="text-[#017172]" />
                          <span className="font-semibold text-[#1E1E1E]">Kunde</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-sm">
                            {selectedEvent.resource.customerName.charAt(0)}
                          </div>
                          <p className="font-medium text-[#1E1E1E]">{selectedEvent.resource.customerName}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <a href={`mailto:${selectedEvent.resource.customerEmail}`}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-[#E8C7C3]/10 transition-colors text-sm">
                            <Mail size={14} className="text-[#017172]" />
                            <span className="truncate text-[#1E1E1E]">{selectedEvent.resource.customerEmail}</span>
                          </a>
                          <a href={`tel:${selectedEvent.resource.customerPhone}`}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-[#E8C7C3]/10 transition-colors text-sm">
                            <Phone size={14} className="text-[#017172]" />
                            <span className="text-[#1E1E1E]">{selectedEvent.resource.customerPhone}</span>
                          </a>
                        </div>
                      </div>

                      {selectedEvent.resource.customerNotes && (
                        <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle size={16} className="text-[#017172]" />
                            <span className="font-semibold text-[#1E1E1E]">Notizen</span>
                          </div>
                          <p className="text-sm text-[#1E1E1E] italic">"{selectedEvent.resource.customerNotes}"</p>
                        </div>
                      )}

                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <p className="font-semibold text-[#1E1E1E] mb-3">Status aktualisieren</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "Confirmed", label: "Bestätigt", color: statusColors.Confirmed },
                            { key: "Completed", label: "Abgeschlossen", color: statusColors.Completed },
                            { key: "Cancelled", label: "Stornieren", color: statusColors.Cancelled },
                            { key: "NoShow", label: "Nicht erschienen", color: statusColors.NoShow },
                          ].map(btn => (
                            <Button key={btn.key} size="sm"
                              style={{ backgroundColor: btn.color }}
                              className="text-white font-semibold text-xs"
                              onPress={() => handleStatusUpdate(btn.key)}
                              isLoading={updating}
                              isDisabled={selectedEvent.resource.status === btn.key}>
                              {btn.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg mb-3">
                        <Clock size={15} className="text-[#6b7280]" />
                        <span className="text-sm text-[#1E1E1E]">
                          {moment(selectedEvent?.start).format('DD.MM.YYYY')} · {moment(selectedEvent?.start).format('HH:mm')} – {moment(selectedEvent?.end).format('HH:mm')}
                        </span>
                      </div>
                      {selectedEvent?.resource.reason && (
                        <p className="text-sm text-[#8A8A8A] px-1"><strong>Grund:</strong> {selectedEvent.resource.reason}</p>
                      )}
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button 
                  variant="flat" 
                  className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold" 
                  startContent={<X size={14} />}
                  onPress={onClose}>
                    Schließen
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Blocked Slot Modal */}
        <Modal
          isOpen={isBlockedSlotModalOpen}
          onClose={() => {
            setIsBlockedSlotModalOpen(false);
            setError(null);
            setIsRange(false);
            setSingleForm({ blockDate: "", startTime: "", endTime: "", reason: "" });
            setRangeForm({ fromDate: "", toDate: "", startTime: "", endTime: "", reason: "" });
          }}
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
                      <Ban size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#1E1E1E]">Zeitslot blockieren</h2>
                      <p className="text-xs text-[#8A8A8A]">Zeiten als nicht verfügbar markieren</p>
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                        <AlertCircle size={14} />{error}
                      </div>
                    )}

                    {/* Range toggle */}
                    <div className="flex items-center gap-3 p-3 bg-[#F5EDEB] rounded-xl border border-[#E8C7C3]/30">
                      <Switch
                        isSelected={isRange}
                        onValueChange={setIsRange}
                        color="primary"
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1E1E1E]">Datumsbereich</p>
                        <p className="text-xs text-[#8A8A8A]">Mehrere Tage auf einmal blockieren</p>
                      </div>
                      <CalendarRange size={18} className="text-[#8A8A8A]" />
                    </div>

                    {/* Date(s) */}
                    {!isRange ? (
                      <Input
                        type="date"
                        label="Datum"
                        isRequired
                        value={singleForm.blockDate}
                        onChange={(e) => setSingleForm(f => ({ ...f, blockDate: e.target.value }))}
                        min={moment().format('YYYY-MM-DD')}
                        classNames={{ inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]" }}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="date"
                          label="Von Datum"
                          isRequired
                          value={rangeForm.fromDate}
                          onChange={(e) => setRangeForm(f => ({ ...f, fromDate: e.target.value }))}
                          min={moment().format('YYYY-MM-DD')}
                          classNames={{ inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]" }}
                        />
                        <Input
                          type="date"
                          label="Bis Datum"
                          isRequired
                          value={rangeForm.toDate}
                          onChange={(e) => setRangeForm(f => ({ ...f, toDate: e.target.value }))}
                          min={rangeForm.fromDate || moment().format('YYYY-MM-DD')}
                          classNames={{ inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]" }}
                        />
                      </div>
                    )}

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="time"
                        label="Von Uhrzeit"
                        isRequired
                        value={isRange ? rangeForm.startTime : singleForm.startTime}
                        onChange={(e) => isRange
                          ? setRangeForm(f => ({ ...f, startTime: e.target.value }))
                          : setSingleForm(f => ({ ...f, startTime: e.target.value }))
                        }
                        classNames={{ inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]" }}
                      />
                      <Input
                        type="time"
                        label="Bis Uhrzeit"
                        isRequired
                        value={isRange ? rangeForm.endTime : singleForm.endTime}
                        onChange={(e) => isRange
                          ? setRangeForm(f => ({ ...f, endTime: e.target.value }))
                          : setSingleForm(f => ({ ...f, endTime: e.target.value }))
                        }
                        classNames={{ inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]" }}
                      />
                    </div>

                    {/* Reason */}
                    <Input
                      label="Grund (optional)"
                      placeholder="z.B. Urlaub, Fortbildung…"
                      value={isRange ? rangeForm.reason : singleForm.reason}
                      onChange={(e) => isRange
                        ? setRangeForm(f => ({ ...f, reason: e.target.value }))
                        : setSingleForm(f => ({ ...f, reason: e.target.value }))
                      }
                      classNames={{ inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/30 hover:border-[#017172] data-[focus=true]:border-[#017172]" }}
                    />
                  </div>
                </ModalBody>
                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={onClose}
                    isDisabled={submittingBlocked}
                    startContent={<X size={14} />}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                    onPress={handleCreateBlockedSlot}
                    isLoading={submittingBlocked}
                    startContent={!submittingBlocked && <Ban size={15} />}
                  >
                    Blockieren
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Manual Booking Modal */}
        <Modal
          isOpen={isManualBookingModalOpen}
          onClose={() => { setIsManualBookingModalOpen(false); resetManualBookingForm(); }}
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
                      <Plus size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">Manuelle Buchung</h2>
                      {selectedSlot && <p className="text-xs text-[#8A8A8A]">{moment(selectedSlot.start).format('DD.MM.YYYY')}</p>}
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {success && createdBooking ? (
<div className="bg-[#F5EDEB] rounded-xl border-2 border-[#E8C7C3]/30 shadow-lg overflow-hidden">
  <div className="p-5 border-b-2 border-[#E8C7C3]/20">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
        <CheckCircle size={20} className="text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#1E1E1E]">Buchung erfolgreich!</h3>
        <p className="text-xs text-[#8A8A8A] font-mono">Nr: {createdBooking.bookingNumber}</p>
      </div>
    </div>
  </div>

  <div className="p-5 border-b-2 border-[#E8C7C3]/20">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
        <Scissors size={16} className="text-[#017172]" />
      </div>
      <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Service</span>
    </div>
    <div className="flex items-center justify-between">
      <p className="font-medium text-[#1E1E1E] text-base">{createdBooking.booking.serviceName}</p>
      <p className="text-xl font-bold text-[#017172]">{formatPrice(createdBooking.booking.price, createdBooking.booking.currency)} </p>
    </div>
  </div>

  <div className="p-5 border-b-2 border-[#E8C7C3]/20">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
        <CalendarIconLucide size={16} className="text-[#017172]" />
      </div>
      <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Datum & Zeit</span>
    </div>
    <div className="space-y-2">
      <p className="text-[#1E1E1E] font-medium">
        {new Date(createdBooking.booking.bookingDate).toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })}
      </p>
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-[#8A8A8A]" />
        <p className="text-[#1E1E1E]">
          {createdBooking.booking.startTime} – {createdBooking.booking.endTime} Uhr
        </p>
      </div>
    </div>
  </div>

  <div className="p-5 border-b-2 border-[#E8C7C3]/20">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
        <User size={16} className="text-[#017172]" />
      </div>
      <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Kunde</span>
    </div>
    <p className="text-[#1E1E1E] font-medium text-base">
      {createdBooking.customer.firstName} {createdBooking.customer.lastName}
    </p>
  </div>

  {createdBooking.employee && (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
          <User size={16} className="text-[#017172]" />
        </div>
        <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Fachkraft</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-sm">
          {createdBooking.employee.name.charAt(0)}
        </div>
        <p className="text-[#1E1E1E] font-medium">{createdBooking.employee.name}</p>
      </div>
    </div>
  )}
</div>
                  ) : (
                    <div className="space-y-4">
                      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

{/* Step 1: Employee */}
<div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
  <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">1. Fachkraft wählen</p>
  {loadingEmployees ? (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
      <Spinner size="sm" />
      <span className="text-sm text-[#8A8A8A]">Lade Mitarbeiter...</span>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      {employees.map(emp => (
        <button
          key={emp.id}
          onClick={() => {
            setSelectedEmployeeId(emp.id);
            setBookingForm({ ...bookingForm, serviceId: '' }); // Reset service selection
            loadServicesForEmployee(emp.id);
          }}
          className={`text-left p-3 rounded-xl border-2 transition-all ${
            selectedEmployeeId === emp.id
              ? 'border-[#017172] bg-[#017172]/5'
              : 'border-[#E8C7C3]/30 bg-white hover:border-[#017172]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              selectedEmployeeId === emp.id
                ? 'bg-[#017172] text-white'
                : 'bg-[#E8C7C3]/20 text-[#017172]'
            }`}>
              {emp.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-[#1E1E1E] text-sm">{emp.name}</p>
              <p className="text-[10px] text-[#8A8A8A]">{emp.role}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )}
</div>

                    {/* Step 2: Service with integrated search */}
<div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
  <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">2. Service auswählen</p>
  
  {!selectedEmployeeId ? (
    <div className="p-3 bg-white rounded-lg text-center text-sm text-[#8A8A8A]">
      Bitte zuerst eine Fachkraft auswählen
    </div>
  ) : loadingEmployeeServices ? (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
      <Spinner size="sm" />
      <span className="text-sm text-[#8A8A8A]">Lade Services...</span>
    </div>
  ) : (
    <Popover placement="bottom" isOpen={isServicePopoverOpen} onOpenChange={setIsServicePopoverOpen}>
      <PopoverTrigger>
<Button
  variant="flat"
  className="w-full justify-start bg-white border border-[#E8C7C3]/30 text-[#1E1E1E] h-12"
  endContent={<Search size={18} className="text-[#8A8A8A]" />}
  isDisabled={!selectedEmployeeId}
>
  {bookingForm.serviceId ? 
    (employeeServices.find(s => s.id === bookingForm.serviceId)?.name || 
     services.find(s => s.id === bookingForm.serviceId)?.name || 
     "Service auswählen...") 
    : "Service suchen oder auswählen..."}
</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <div className="w-full">
          <Input
            placeholder="Service suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-b border-[#E8C7C3]/20"
            startContent={<Search size={18} className="text-[#8A8A8A]" />}
            classNames={{
              inputWrapper: "bg-transparent shadow-none",
              base: "p-3"
            }}
            autoFocus
          />
          <div className="max-h-[300px] overflow-y-auto">
            {employeeServices.length > 0 ? (
              employeeServices
                .filter(service => 
                  service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  service.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(service => (
                  <button
                    key={service.id}
                    className="w-full text-left p-3 hover:bg-[#F5EDEB] transition-colors border-b border-[#E8C7C3]/10 last:border-0"
                    onClick={() => {
                      setBookingForm({ ...bookingForm, serviceId: service.id });
                      setSearchTerm('');
                      setIsServicePopoverOpen(false);
                    }}
                  >
                    <div className="font-medium text-[#1E1E1E]">{service.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#017172] font-semibold">
                        {formatPrice(service.price, service.currency)}
                      </span>
                      <span className="text-xs text-[#8A8A8A]">
                        {service.durationMinutes} Min
                      </span>
                    </div>
                    {service.description && (
                      <div className="text-xs text-[#8A8A8A] mt-1 line-clamp-2">
                        {service.description}
                      </div>
                    )}
                  </button>
                ))
            ) : (
              <div className="p-4 text-center text-[#8A8A8A]">
                Keine Services für diese Fachkraft gefunden
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )}
</div>

                      {/* Step 3: Date */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">3. Datum wählen</p>
                        <Input
                          type="date"
                          value={bookingForm.bookingDate}
                          min={moment().format('YYYY-MM-DD')}
                          max={moment().add(60, 'days').format('YYYY-MM-DD')}
                          onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                          isDisabled={submitting}
                          classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                        />
                      </div>

                      {/* Step 4: Time */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">4. Uhrzeit wählen</p>
                        {loadingSlots ? (
                          <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                            <Spinner size="sm" />
                            <span className="text-sm text-[#8A8A8A]">Lade verfügbare Zeiten...</span>
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map(slot => (
                              <Button
                                key={slot.startTime}
                                size="sm"
                                className={`${bookingForm.startTime === slot.startTime
                                  ? 'bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold'
                                  : 'bg-white border border-[#E8C7C3] text-[#1E1E1E] hover:border-[#017172]/40'
                                  }`}
                                onPress={() => setBookingForm({ ...bookingForm, startTime: slot.startTime })}
                                isDisabled={submitting}
                              >
                                {slot.startTime}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white rounded-lg text-center text-sm text-[#8A8A8A]">
                            {bookingForm.serviceId ? "Keine verfügbaren Zeiten" : "Bitte zuerst Service und Datum wählen"}
                          </div>
                        )}
                      </div>

                      {/* Step 5: Customer */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">5. Kundendaten</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            label="Vorname"
                            placeholder="Max"
                            value={bookingForm.firstName}
                            onChange={(e) => setBookingForm({ ...bookingForm, firstName: e.target.value })}
                            isRequired
                            isDisabled={submitting}
                            classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                          />
                          <Input
                            label="Nachname"
                            placeholder="Mustermann"
                            value={bookingForm.lastName}
                            onChange={(e) => setBookingForm({ ...bookingForm, lastName: e.target.value })}
                            isRequired
                            isDisabled={submitting}
                            classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                          />
                          <Input
                            label="E-Mail (optional)"
                            type="email"
                            value={bookingForm.email}
                            onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                            isDisabled={submitting}
                            classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                          />
                          <Input
                            label="Telefon (optional)"
                            type="tel"
                            value={bookingForm.phone}
                            onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                            isDisabled={submitting}
                            classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                          />
                        </div>
                        <div className="mt-3">
                          <Textarea
                            label="Notizen (optional)"
                            value={bookingForm.customerNotes}
                            onChange={(e) => setBookingForm({ ...bookingForm, customerNotes: e.target.value })}
                            isDisabled={submitting}
                            classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      {selectedService && (
                        <div className="bg-[#017172]/5 border border-[#017172]/20 p-3 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-[#1E1E1E] text-sm">{selectedService.name}</p>
                            <p className="text-xs text-[#8A8A8A]">
                              {selectedService.durationMinutes} Min
                              {employees.find(e => e.id === selectedEmployeeId)?.name
                                ? ` · ${employees.find(e => e.id === selectedEmployeeId)!.name}`
                                : ''}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-[#017172]">{formatPrice(selectedService.price, selectedService.currency)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={onClose}
                    startContent={<X size={14} />}
                    isDisabled={submitting}
                  >
                    {success ? "Schließen" : "Abbrechen"}
                  </Button>
                  {!success && !createdBooking && (
                    <Button
                      className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                      onPress={handleCreateManualBooking}
                      isLoading={submitting}
                      isDisabled={!bookingForm.serviceId || !bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.firstName || !bookingForm.lastName}
                      endContent={<ChevronRight size={18} />}
                    >
                      Buchung erstellen
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}