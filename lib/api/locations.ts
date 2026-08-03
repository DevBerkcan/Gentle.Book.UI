import api from "@/lib/api/client";

export interface BusinessLocation {
  id: string;
  name: string;
  street?: string | null;
  postalCode?: string | null;
  city: string;
  countryCode: string;
  currency: string;
  timeZone: string;
  isDefault: boolean;
  isActive: boolean;
  serviceCount: number;
}

export type BusinessLocationInput = Omit<BusinessLocation, "id" | "serviceCount">;

export async function getBusinessLocations(): Promise<BusinessLocation[]> {
  const response = await api.get("/tenant/locations");
  return response.data?.data ?? response.data ?? [];
}

export async function createBusinessLocation(data: BusinessLocationInput): Promise<void> {
  await api.post("/tenant/locations", data);
}

export async function updateBusinessLocation(id: string, data: BusinessLocationInput): Promise<void> {
  await api.put(`/tenant/locations/${id}`, data);
}

export async function deleteBusinessLocation(id: string): Promise<void> {
  await api.delete(`/tenant/locations/${id}`);
}

// ── Standort-Admins (Agency-exklusiv) ─────────────────────────────────────

export interface LocationAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locationId: string;
  locationName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export async function getLocationAdmins(): Promise<LocationAdmin[]> {
  const response = await api.get("/tenant/location-admins");
  return response.data ?? [];
}

export async function inviteLocationAdmin(locationId: string, email: string, firstName: string, lastName?: string): Promise<void> {
  await api.post(`/tenant/locations/${locationId}/admin`, { email, firstName, lastName });
}

export async function removeLocationAdmin(id: string): Promise<void> {
  await api.delete(`/tenant/location-admins/${id}`);
}
