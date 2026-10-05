/**
 * Payroll Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 * 
 * Backend endpoints:
 * - GET /api/payroll - Get payroll list
 * - GET /api/payroll/:id - Get payroll by ID
 * - GET /api/payroll/:id/payslip - Download payslip
 */

import { apiService } from './api';
import { Payroll, PaginatedResponse } from '@/types';

export const payrollService = {
  /**
   * Get payroll list
   * GET /api/payroll
   */
  getPayrolls: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    month?: number;
    year?: number;
    companyId?: string;
  }): Promise<PaginatedResponse<Payroll>> => {
    const response = await apiService.get<PaginatedResponse<Payroll>>('/payroll', {
      params,
    });
    return response.data;
  },

  /**
   * Get payroll by ID
   * GET /api/payroll/:id
   */
  getPayrollById: async (id: string): Promise<Payroll> => {
    const response = await apiService.get<Payroll>(`/payroll/${id}`);
    return response.data;
  },

  /**
   * Download payslip
   * GET /api/payroll/:id/payslip
   */
  downloadPayslip: async (id: number): Promise<{ url: string }> => {
    const response = await apiService.get<{ url: string }>(`/payroll/${id}/payslip`);
    return response.data;
  },
};
