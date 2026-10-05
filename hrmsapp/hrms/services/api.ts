/**
 * API Service Layer with Axios
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/utils/constants';
import { ApiResponse } from '@/types';
import { getItem, setItem, removeItem } from '@/utils/storage';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Log API base URL for debugging
    console.log('API Base URL:', API_BASE_URL);
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await getItem(STORAGE_KEYS.AUTH_TOKEN);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error reading auth token:', error);
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle token refresh and errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { token } = response.data.data;
              await setItem(STORAGE_KEYS.AUTH_TOKEN, token);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }

              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - logout user
            try {
              await removeItem(STORAGE_KEYS.AUTH_TOKEN);
              await removeItem(STORAGE_KEYS.REFRESH_TOKEN);
              // User data can stay in AsyncStorage (less sensitive)
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            } catch (clearError) {
              console.error('Error clearing tokens:', clearError);
            }
            // Navigate to login - handled by auth store
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error: any) {
      // Enhance error with network error detection
      if (!error.response && error.message) {
        error.code = 'NETWORK_ERROR';
        error.message = 'Network error. Please check your connection.';
      }
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log('🔵 API POST Request:', {
        fullUrl,
        baseURL: API_BASE_URL,
        endpoint: url,
        data: data ? { ...data, password: '***' } : null,
      });
      
      const response = await this.api.post<ApiResponse<T>>(url, data, config);
      console.log('✅ API POST Success:', {
        url: fullUrl,
        status: response.status,
      });
      return response.data;
    } catch (error: any) {
      // Log detailed error information
      const fullUrl = `${API_BASE_URL}${url}`;
      console.error('❌ API POST Error:', {
        fullUrl,
        baseURL: API_BASE_URL,
        endpoint: url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        message: error.message,
        code: error.code,
      });
      
      // Enhance error with network error detection
      if (!error.response && error.message) {
        error.code = 'NETWORK_ERROR';
        error.message = `Network error. Cannot reach ${fullUrl}. Please ensure the backend server is running on port 5000.`;
      } else if (error.response?.status === 404) {
        error.message = `API endpoint not found: ${fullUrl}. Please verify:\n1. Backend server is running (http://localhost:5000/health)\n2. The endpoint exists: POST /api/auth/login\n3. Check browser console for the exact URL being called.`;
      }
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();
