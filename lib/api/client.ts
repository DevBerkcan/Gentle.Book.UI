// lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('employee');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);


// Helper to extract data from response
export const extractData = <T>(response: any, isList = true): T => {
  try {
    const { data } = response;
    
    if (!data) {
      return (isList ? [] : null) as T;
    }
    
    // Handle different response structures
    const responseData = data.data !== undefined ? data.data : 
                        data.Data !== undefined ? data.Data : 
                        data;
    
    return responseData as T;
  } catch (error) {
    console.error('Error extracting data:', error);
    return (isList ? [] : null) as T;
  }
};

export default api;