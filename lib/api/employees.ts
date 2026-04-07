// lib/api/employees.ts
import api from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  username?: string | null;
  hasPassword: boolean;
}

export interface CreateEmployeeDto {
  name: string;
  role: string;
  specialty?: string | null;
  location?: string | null;
  username?: string | null;
  password?: string | null;
}

export interface UpdateEmployeeDto {
  name: string;
  role: string;
  specialty?: string | null;
  location?: string | null;
  isActive: boolean;

  newPassword?: string | null;
}

// ── Functions ─────────────────────────────────────────────────────────────────

/**
 * List employees.
 * activeOnly = false returns inactive employees too (admin use).
 */
export async function getEmployees(activeOnly = true): Promise<Employee[]> {
  const response = await api.get(`/employees`, {
    params: { activeOnly }
  });
  return response.data;
}

/**
 * Create a new employee.
 * Username and password are required for new employees.
 */
export async function createEmployee(
  data: CreateEmployeeDto
): Promise<Employee> {
  const response = await api.post('/employees', data);
  return response.data;
}

/**
 * Update an employee.
 * If newPassword is provided, it will update the password.
 */
export async function updateEmployee(
  id: string,
  data: UpdateEmployeeDto
): Promise<Employee> {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
}

/**
 * Delete an employee.
 * The backend will reject if the employee has active bookings.
 */
export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

/**
 * Toggle employee active status.
 */
export async function toggleEmployeeActive(id: string): Promise<{ id: string; isActive: boolean }> {
  const response = await api.patch(`/employees/${id}/toggle-active`);
  return response.data;
}

/**
 * Bootstrap: set an initial password for an employee by username.
 * This endpoint still uses the admin secret for bootstrap purposes.
 */
export async function setEmployeePassword(
  username: string,
  password: string
): Promise<void> {
  const response = await api.post('/employee-auth/set-password', { 
    username, 
    password 
  },);
  return response.data;
}