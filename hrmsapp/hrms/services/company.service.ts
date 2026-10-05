/**
 * Company Service
 */

import { apiService } from './api';
import { Company, PaginatedResponse } from '@/types';

export const companyService = {
  /**
   * Get all companies
   */
  getCompanies: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Company>> => {
    const response = await apiService.get<PaginatedResponse<Company>>('/companies', {
      params,
    });
    return response.data;
  },

  /**
   * Get company by ID
   */
  getCompanyById: async (id: string): Promise<Company> => {
    const response = await apiService.get<Company>(`/companies/${id}`);
    return response.data;
  },

  /**
   * Create company
   */
  createCompany: async (data: Partial<Company>): Promise<Company> => {
    const response = await apiService.post<Company>('/companies', data);
    return response.data;
  },

  /**
   * Update company
   */
  updateCompany: async (id: string, data: Partial<Company>): Promise<Company> => {
    const response = await apiService.put<Company>(`/companies/${id}`, data);
    return response.data;
  },

  /**
   * Delete company
   */
  deleteCompany: async (id: string): Promise<void> => {
    await apiService.delete(`/companies/${id}`);
  },
};
