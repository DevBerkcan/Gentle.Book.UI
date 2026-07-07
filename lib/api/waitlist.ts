import api from './client';

export interface WaitlistEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'Pending' | 'Notified' | 'Booked' | 'Expired';
  createdAt: string;
  notifiedAt?: string;
  preferredDate?: string;
  serviceName?: string;
  employeeName?: string;
}

export interface JoinWaitlistDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  serviceId?: string;
  employeeId?: string;
  preferredDate?: string;
}

/** Public: customer joins the waitlist (no auth needed) */
export async function joinWaitlist(slug: string, dto: JoinWaitlistDto): Promise<{ message: string; id: string }> {
  const res = await api.post(`/public/${slug}/waitlist`, dto);
  return res.data;
}

/** Admin: get all waitlist entries */
export async function getWaitlist(params?: { status?: string; date?: string }): Promise<WaitlistEntry[]> {
  const res = await api.get('/waitlist', { params });
  return res.data;
}

/** Admin: delete a waitlist entry */
export async function deleteWaitlistEntry(id: string): Promise<void> {
  await api.delete(`/waitlist/${id}`);
}

/** Admin: mark entry as notified */
export async function markWaitlistNotified(id: string): Promise<void> {
  await api.patch(`/waitlist/${id}/mark-notified`);
}
