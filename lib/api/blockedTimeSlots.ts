// lib/api/blockedTimeSlots.ts
import api from './client';

export interface BlockedTimeSlot {
  id: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdAt: string;
  employeeId: string | null;
}

export interface CreateBlockedTimeSlotDto {
  blockDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface CreateBlockedDateRangeDto {
  fromDate: string;
  toDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface UpdateBlockedTimeSlotDto {
  blockDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export const blockedTimeSlotsApi = {
  // Get all blocked slots (admin sees all with all=true)
  getAll: async (startDate?: Date, endDate?: Date, all: boolean = false) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (all) params.append('all', 'true');
      
      const query = params.toString() ? `?${params.toString()}` : '';
      
      const response = await api.get(`/blockedtimeslots${query}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked time slots:', error);
      return [];
    }
  },

  // Get blocked slots for a specific date (public)
  getByDate: async (date: Date, employeeId?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('date', date.toISOString());
      if (employeeId) params.append('employeeId', employeeId);
      
      const response = await api.get(`/blockedtimeslots/by-date?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked time slots by date:', error);
      return [];
    }
  },

  // Get single blocked slot by ID
  getById: async (id: string) => {
    try {
      const response = await api.get(`/blockedtimeslots/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching blocked time slot ${id}:`, error);
      return null;
    }
  },

  // Create a single blocked slot
  create: async (data: CreateBlockedTimeSlotDto) => {
    try {
      const response = await api.post('/blockedtimeslots', data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Erstellen des blockierten Zeitraums',
        data: null,
      };
    }
  },

  // Create a range of blocked slots
  createRange: async (data: CreateBlockedDateRangeDto) => {
    try {
      const response = await api.post('/blockedtimeslots/range', data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Erstellen der blockierten Zeiträume',
        data: null,
      };
    }
  },

  // Update a blocked slot
  update: async (id: string, data: UpdateBlockedTimeSlotDto) => {
    try {
      const response = await api.put(`/blockedtimeslots/${id}`, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Aktualisieren des blockierten Zeitraums',
        data: null,
      };
    }
  },

  // Delete a blocked slot
  delete: async (id: string) => {
    try {
      await api.delete(`/blockedtimeslots/${id}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Löschen des blockierten Zeitraums',
      };
    }
  },
};