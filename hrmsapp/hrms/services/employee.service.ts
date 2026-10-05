/**
 * Employee Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 * 
 * Backend endpoints:
 * - GET /api/users - Get all employees/users
 * - GET /api/users/:id - Get employee by ID
 * - POST /api/users - Create employee
 * - PUT /api/users/:id - Update employee
 * - DELETE /api/users/:id - Delete employee
 * - PATCH /api/users/:id/status - Activate/Deactivate employee
 */

import { apiService } from './api';
import { Employee, PaginatedResponse } from '@/types';

export const employeeService = {
  /**
   * Get all employees
   * GET /api/users
   * 
   * Backend response (from backend/controllers/userController.js):
   * {
   *   success: true,
   *   message: 'Users retrieved successfully',
   *   data: users[], // Array of user objects
   *   count: number
   * }
   */
  getEmployees: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
    department?: string;
    isActive?: boolean;
    role?: string;
  }): Promise<PaginatedResponse<Employee>> => {
    const response = await apiService.get<any>('/users', {
      params,
    });
    
    // Backend returns: { success: true, data: users[], count: number }
    const users = response.data || [];
    const count = (response as any).count || users.length;
    
    // Convert to PaginatedResponse format
    return {
      data: users.map((user: any) => ({
        ...user,
        id: String(user.id),
        employeeId: user.employeeCode || String(user.id),
      })),
      total: count,
      page: params?.page || 1,
      limit: params?.limit || users.length,
      totalPages: Math.ceil(count / (params?.limit || users.length)),
    };
  },

  /**
   * Get employee by ID
   * GET /api/users/:id
   */
  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await apiService.get<Employee>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create employee
   * POST /api/users
   */
  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await apiService.post<Employee>('/users', data);
    return response.data;
  },

  /**
   * Update employee
   * PUT /api/users/:id
   */
  updateEmployee: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await apiService.put<Employee>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete employee
   * DELETE /api/users/:id
   */
  deleteEmployee: async (id: string): Promise<void> => {
    await apiService.delete(`/users/${id}`);
  },

  /**
   * Activate/Deactivate employee
   * PATCH /api/users/:id/status
   */
  toggleEmployeeStatus: async (id: string, isActive: boolean): Promise<Employee> => {
    const response = await apiService.patch<Employee>(`/users/${id}/status`, {
      isActive,
    });
    return response.data;
  },
};
