// lib/api/booking.ts
// Public-facing booking API.
// credentials: "include" is set on all calls so the JWT cookie is forwarded
// when the user is authenticated (e.g. an employee using the admin UI).
// Anonymous callers simply have no cookie and the server treats them as guests.

import api from '@/lib/api/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}

  export const bookingApi = {
  getEmployees,
  getServiceCategories,
  getServicesByCategory,
  getServices,
  getLocations,
  getAvailability,
  createBooking,
  requestMyBookingsLink,
  getMyBookings,
  cancelBooking,
  getEmployeesByService,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  displayOrder: number;
  currency: string;
  locationId?: string | null;
  locationName?: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  services: Service[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  serviceDuration: number;
  availableSlots: TimeSlot[];
  message?: string | null;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  specialty: string | null;
  isActive: boolean;
  location?: string | null;
  photoUrl?: string | null;
  tagline?: string | null;
}

export interface Location {
  id: string;
  name: string;
  street: string | null;
  postalCode: string | null;
  city: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  customer: CustomerInfo;
  customerNotes?: string;
  employeeId?: string | null;
  waitlistToken?: string;
}

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  status: string;
  confirmationSent: boolean;
  booking: {
    serviceId: string;
    serviceName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    price: number;
    currency: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  employee?: {
    id: string;
    name: string;
    role: string;
    specialty: string | null;
  } | null;
}

/**
 * Get employees by service ID - only returns employees that can perform this service
 */
export async function getEmployeesByService(serviceId: string, tenantSlug?: string): Promise<Employee[]> {
  const response = await api.get(`/employees/by-service/${serviceId}`, {
    params: { activeOnly: true, ...(tenantSlug ? { tenantSlug } : {}) },
  });
  return response.data;
}

// ── Employees ─────────────────────────────────────────────────────────────────

/**
 * Fetch active employees for the booking widget.
 * The /employees endpoint is [AllowAnonymous] for public use.
 * credentials:include so the JWT cookie is forwarded when present.
 */
export async function getEmployees(tenantSlug?: string): Promise<Employee[]> {
  const response = await api.get('/employees', {
    params: { activeOnly: true, ...(tenantSlug ? { tenantSlug } : {}) },
  });
  return response.data;
}

// ── Services ──────────────────────────────────────────────────────────────────

function withTenantParams(base: string, tenantSlug?: string, locationId?: string): string {
  const params = new URLSearchParams();
  if (tenantSlug) params.set('tenantSlug', tenantSlug);
  if (locationId) params.set('locationId', locationId);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function getServiceCategories(tenantSlug?: string, locationId?: string): Promise<ServiceCategory[]> {
  const url = withTenantParams(`${API_BASE_URL}/services/categories`, tenantSlug, locationId);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Kategorien");
  return res.json();
}

export async function getServicesByCategory(
  categoryId: string,
  tenantSlug?: string,
  locationId?: string
): Promise<Service[]> {
  const url = withTenantParams(`${API_BASE_URL}/services/categories/${categoryId}/services`, tenantSlug, locationId);
  const res = await fetch(url);
  if (!res.ok)
    throw new Error("Fehler beim Laden der Services für diese Kategorie");
  return res.json();
}

export async function getServices(tenantSlug?: string, locationId?: string): Promise<Service[]> {
  const url = withTenantParams(`${API_BASE_URL}/services`, tenantSlug, locationId);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Services");
  return res.json();
}

/**
 * Active locations for a tenant — only meaningful when a tenant has more than one.
 * Callers should skip rendering a location-picker step when this returns ≤1 item.
 */
export async function getLocations(tenantSlug?: string): Promise<Location[]> {
  const url = withTenantParams(`${API_BASE_URL}/services/locations`, tenantSlug);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der Standorte");
  return res.json();
}

export async function getTenantInfo(tenantSlug: string): Promise<{
  name?: string; companyName?: string; primaryColor?: string; tagline?: string; welcomeMessage?: string; logoUrl?: string; linktreeStyle?: string; industryType?: string; linktreeConfig?: string; unavailable?: boolean; notFound?: boolean;
}> {
  const res = await fetch(`${API_BASE_URL}/booking/${tenantSlug}/info`, { cache: 'no-store' });
  if (res.status === 423) return { name: tenantSlug, unavailable: true };
  if (res.status === 404) return { notFound: true };
  if (!res.ok) throw new Error("Buchungsseite konnte nicht geladen werden");
  return res.json();
}

export interface TenantLink {
  id: string;
  title: string;
  url: string;
  iconType: string;
  displayOrder: number;
}

export async function getTenantLinks(tenantSlug: string): Promise<TenantLink[]> {
  const res = await fetch(`${API_BASE_URL}/booking/${tenantSlug}/links`);
  if (!res.ok) return [];
  return res.json();
}

// lib/api/booking.ts - Update getAvailability

export async function getAvailability(
  serviceId: string,
  date: string,
  employeeId?: string,
  tenantSlug?: string,
  waitlistToken?: string,
): Promise<AvailabilityResponse> {
  const response = await api.get(`/availability/${serviceId}`, {
    params: {
      date,
      ...(employeeId ? { employeeId } : {}),
      ...(tenantSlug ? { tenantSlug } : {}),
      ...(waitlistToken ? { waitlistToken } : {}),
    },
  });
  return response.data;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * Create a booking.
 * credentials:include forwards the JWT cookie so the backend can
 * auto-assign the authenticated employee when no employeeId is specified.
 */
export async function createBooking(
  data: CreateBookingRequest,
  tenantSlug?: string,
): Promise<BookingResponse> {
  const url = tenantSlug
    ? `${API_BASE_URL}/bookings?tenantSlug=${tenantSlug}`
    : `${API_BASE_URL}/bookings`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Fehler beim Buchen");
  }
  return res.json();
}

/**
 * Request a magic link for the customer booking portal.
 * The backend always returns 200 (no e-mail enumeration).
 */
export async function requestMyBookingsLink(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/bookings/my-bookings/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Anfrage fehlgeschlagen. Bitte später erneut versuchen.");
}

/** Load bookings behind a valid magic-link token. */
export async function getMyBookings(token: string): Promise<BookingResponse[]> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/my?token=${encodeURIComponent(token)}`
  );
  if (res.status === 401) {
    throw new Error("Der Zugriffslink ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.");
  }
  if (!res.ok) throw new Error("Fehler beim Laden der Buchungen");
  return res.json();
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: reason || "Vom Kunden storniert",
      notifyCustomer: true,
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Fehler beim Stornieren");
  }
  return res.json();
}
