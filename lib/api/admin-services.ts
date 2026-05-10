// lib/api/admin-services.ts
import api, { extractData } from './client';

// Employee basic info for assignments
export interface EmployeeBasicDto {
  id: string;
  name: string;
  role: string;
  specialty: string | null;
}

// Updated AdminService with array of employees AND backward compatibility fields
export interface AdminService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferTimeMinutes: number;
  price: number;
  currency: string;
  displayOrder: number;
  categoryId: string;
  categoryName: string;
  assignedEmployees: EmployeeBasicDto[];
  employeeId?: string | null;
  employeeName?: string | null;
  isActive: boolean;
}

export interface AdminServiceCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  services: AdminService[];
}

// Updated to use array of employee IDs with backward compatibility
export interface CreateServiceData {
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferTimeMinutes: number;
  price: number;
  currency: string;
  displayOrder: number;
  categoryId: string;
  employeeIds?: string[] | null;
  employeeId?: string | null;
}

// Updated to use array of employee IDs with backward compatibility
export interface UpdateServiceData {
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferTimeMinutes: number;
  price: number;
  currency: string;
  displayOrder: number;
  categoryId: string;
  employeeIds?: string[] | null;  // Primary - array of employee IDs
  employeeId?: string | null;      // Backward compatibility - single employee ID
  isActive: boolean;
}

export interface CreateCategoryData {
  name: string;
  description?: string | null;
  displayOrder: number;
}

export interface UpdateCategoryData {
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface EmployeeForAssignment {
  id: string;
  name: string;
  role: string;
  specialty: string | null;
  serviceCount: number;
}

// Helper function to add backward compatibility fields
function addBackwardCompatibility(service: AdminService): AdminService {
  return {
    ...service,
    employeeId: service.assignedEmployees && service.assignedEmployees.length > 0 
      ? service.assignedEmployees[0].id 
      : null,
    employeeName: service.assignedEmployees && service.assignedEmployees.length > 0 
      ? service.assignedEmployees[0].name 
      : null,
  };
}

// Helper function to prepare payload for API
function prepareServicePayload(data: CreateServiceData | UpdateServiceData): any {
  const payload = { ...data };
  
  // If employeeIds is provided, use it
  if (data.employeeIds !== undefined) {
    payload.employeeIds = data.employeeIds;
  } 
  // Otherwise, if employeeId is provided (backward compatibility), convert to array
  else if (data.employeeId !== undefined) {
    payload.employeeIds = data.employeeId ? [data.employeeId] : [];
  }
  
  // Remove backward compatibility field to avoid confusion
  delete payload.employeeId;
  
  return payload;
}

// Get all services for admin
export async function getAdminServices(): Promise<AdminService[]> {
  const response = await api.get('/admin/services');
  const services = extractData<AdminService[]>(response, true);
  
  // Add backward compatibility fields to each service
  return services.map(service => addBackwardCompatibility(service));
}

// Get service by ID
export async function getAdminService(id: string): Promise<AdminService> {
  const response = await api.get(`/admin/services/${id}`);
  const service = extractData<AdminService>(response, false);
  
  // Add backward compatibility fields
  return addBackwardCompatibility(service);
}

// Create new service - accepts both array and single employee ID
export async function createAdminService(data: CreateServiceData): Promise<AdminService> {
  const payload = prepareServicePayload(data);
  const response = await api.post('/admin/services', payload);
  const service = extractData<AdminService>(response, false);
  
  // Add backward compatibility fields
  return addBackwardCompatibility(service);
}

// Update service - accepts both array and single employee ID
export async function updateAdminService(id: string, data: UpdateServiceData): Promise<AdminService> {
  const payload = prepareServicePayload(data);
  const response = await api.put(`/admin/services/${id}`, payload);
  const service = extractData<AdminService>(response, false);
  
  // Add backward compatibility fields
  return addBackwardCompatibility(service);
}

// Delete service
export async function deleteAdminService(id: string): Promise<void> {
  await api.delete(`/admin/services/${id}`);
}

// Toggle service active status
export async function toggleServiceActive(id: string): Promise<{ isActive: boolean }> {
  const response = await api.patch(`/admin/services/${id}/toggle-active`);
  return extractData<{ isActive: boolean }>(response, false);
}

// Get all categories for admin
export async function getAdminCategories(): Promise<AdminServiceCategory[]> {
  const response = await api.get('/admin/services/categories');
  const categories = extractData<AdminServiceCategory[]>(response, true);
  
  // Add backward compatibility fields to all services in categories
  return categories.map(category => ({
    ...category,
    services: category.services.map(service => addBackwardCompatibility(service))
  }));
}

// Get category by ID
export async function getAdminCategory(id: string): Promise<AdminServiceCategory> {
  const response = await api.get(`/admin/services/categories/${id}`);
  const category = extractData<AdminServiceCategory>(response, false);
  
  // Add backward compatibility fields to all services in category
  return {
    ...category,
    services: category.services.map(service => addBackwardCompatibility(service))
  };
}

// Create new category
export async function createAdminCategory(data: CreateCategoryData): Promise<AdminServiceCategory> {
  const response = await api.post('/admin/services/categories', data);
  const category = extractData<AdminServiceCategory>(response, false);
  
  // Add backward compatibility fields to all services in category
  return {
    ...category,
    services: category.services.map(service => addBackwardCompatibility(service))
  };
}

// Update category
export async function updateAdminCategory(id: string, data: UpdateCategoryData): Promise<AdminServiceCategory> {
  const response = await api.put(`/admin/services/categories/${id}`, data);
  const category = extractData<AdminServiceCategory>(response, false);
  
  // Add backward compatibility fields to all services in category
  return {
    ...category,
    services: category.services.map(service => addBackwardCompatibility(service))
  };
}

// Delete category
export async function deleteAdminCategory(id: string): Promise<void> {
  await api.delete(`/admin/services/categories/${id}`);
}

// Get employees for assignment
export async function getEmployeesForAssignment(): Promise<EmployeeForAssignment[]> {
  const response = await api.get('/admin/services/employees');
  return extractData<EmployeeForAssignment[]>(response, true);
}

// Get services by employee
export async function getServicesByEmployee(employeeId: string): Promise<AdminService[]> {
  const response = await api.get(`/admin/services/employees/${employeeId}/services`);
  const services = extractData<AdminService[]>(response, true);
  
  // Add backward compatibility fields to each service
  return services.map(service => addBackwardCompatibility(service));
}

// Bulk assign services to employee
export async function bulkAssignServicesToEmployee(
  employeeId: string, 
  serviceIds: string[]
): Promise<void> {
  await api.post(`/admin/services/employees/${employeeId}/services/bulk`, serviceIds);
}