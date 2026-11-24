// lib/api/treatmentPackages.ts
// Behandlungspakete — see Gentle.Book.API/Controllers/TreatmentPackagesController.cs.
import api from './client';

export type TreatmentPackageStatus = 'Active' | 'UsedUp' | 'Cancelled';

export interface TreatmentPackage {
  id: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  name: string;
  totalSessions: number;
  previouslyUsedSessions: number;
  usedSessions: number;
  openSessions: number;
  reservedSessions: number;
  bookableSessions: number;
  status: TreatmentPackageStatus;
  nextAppointmentDate: string | null;
  nextAppointmentTime: string | null;
  bookingLinkPath: string;
  createdAt: string;
}

export type FollowUpReasonCode =
  | 'no_appointment_yet'
  | 'missing_follow_up'
  | 'cancelled_without_replacement'
  | 'no_show_without_replacement'
  | 'last_not_completed';

export interface FollowUp {
  packageId: string;
  packageName: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceId: string;
  serviceName: string;
  totalSessions: number;
  usedSessions: number;
  openSessions: number;
  reasonCode: FollowUpReasonCode;
  reason: string;
  lastAppointmentDate: string | null;
  bookingLinkPath: string;
}

export interface BookingPackageInfo {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerInternalNotes: string | null;
  packagesEnabled: boolean;
  canAssign: boolean;
  assignedPackage: TreatmentPackage | null;
  candidates: TreatmentPackage[];
}

/** Absolute URL for a package's personal booking link (path comes from the API). */
export function absoluteBookingLink(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

/** Clipboard copy with a fallback for non-secure contexts (e.g. LAN http testing). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export const treatmentPackagesApi = {
  getForCustomer: async (customerId: string): Promise<TreatmentPackage[]> =>
    (await api.get(`/treatment-packages?customerId=${encodeURIComponent(customerId)}`)).data,

  getOne: async (id: string): Promise<{ package: TreatmentPackage; customer: { firstName: string; lastName: string; email: string | null; phone: string | null } }> =>
    (await api.get(`/treatment-packages/${id}`)).data,

  create: async (data: { customerId: string; serviceId: string; totalSessions: number; name?: string | null; previouslyUsedSessions?: number }): Promise<TreatmentPackage> =>
    (await api.post('/treatment-packages', data)).data,

  update: async (id: string, data: { name?: string; totalSessions?: number; previouslyUsedSessions?: number; status?: 'Active' | 'Cancelled' }): Promise<TreatmentPackage> =>
    (await api.patch(`/treatment-packages/${id}`, data)).data,

  renewLink: async (id: string): Promise<TreatmentPackage> =>
    (await api.post(`/treatment-packages/${id}/booking-link/renew`)).data,

  getFollowUps: async (): Promise<FollowUp[]> =>
    (await api.get('/treatment-packages/follow-ups')).data,

  getForBooking: async (bookingId: string): Promise<BookingPackageInfo> =>
    (await api.get(`/treatment-packages/for-booking/${bookingId}`)).data,

  assignToBooking: async (bookingId: string, treatmentPackageId: string | null): Promise<BookingPackageInfo> =>
    (await api.put(`/treatment-packages/for-booking/${bookingId}`, { treatmentPackageId })).data,
};
