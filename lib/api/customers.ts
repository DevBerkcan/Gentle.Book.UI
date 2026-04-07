// lib/api/customers.ts
import api from './client';

export interface CustomerListItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  totalBookings: number;
  lastVisit: string | null;
  createdAt: string;
}

export interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  lastVisit: string | null;
  totalBookings: number;
  noShowCount: number;
  notes: string | null;
  fullName: string;
  employeeId: string | null;
  recentBookings: CustomerBookingItem[];
}

export interface CustomerBookingItem {
  id: string;
  bookingNumber: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  currency: string;
}

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  lastVisit: string | null;
  totalBookings: number;
  noShowCount: number;
  notes: string | null;
  fullName: string;
  employeeId: string | null;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const customersApi = {
  // Get all customers (with pagination and search)
  getAll: async (
    search?: string,
    page: number = 1,
    pageSize: number = 20,
    all: boolean = false
  ): Promise<PagedResponse<CustomerListItem>> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (all) params.append('all', 'true');
    
    const response = await api.get(`/customers?${params}`);
    return response.data;
  },

  // Get customer by ID
  getById: async (id: string): Promise<CustomerDetail> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  create: async (data: CreateCustomerRequest): Promise<CustomerResponse> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id: string, data: UpdateCustomerRequest): Promise<CustomerResponse> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Search customers (for dropdown)
  search: async (q: string, limit: number = 10): Promise<CustomerListItem[]> => {
    const response = await api.get(`/customers/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    return response.data;
  },
};