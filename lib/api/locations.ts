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
