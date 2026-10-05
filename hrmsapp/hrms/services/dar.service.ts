/**
 * Daily Activity Report (DAR) Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 * 
 * Backend endpoints:
 * - POST /api/dar/create - Create a new DAR
 * - GET /api/dar/my - Get my DARs (for employee)
 * - GET /api/dar/team - Get team DARs (for manager)
 * - GET /api/dar/all - Get all DARs (for HR/Admin)
 * - GET /api/dar/:id - Get DAR by ID
 * - PUT /api/dar/:id - Update DAR
 * - POST /api/dar/:id/submit - Submit DAR
 * - POST /api/dar/:id/approve - Approve DAR
 * - POST /api/dar/:id/reject - Reject DAR
 * - GET /api/dar/stats - Get DAR statistics
 * - POST /api/dar/export - Export DARs
 */

import { apiService } from './api';
import {
  DAR,
  DARCreateRequest,
  DARUpdateRequest,
  DARApproveRequest,
  DARRejectRequest,
  DARFilterParams,
  DARStats,
  PaginatedResponse,
} from '@/types';

export const darService = {
  /**
   * Create a new DAR
   * POST /api/dar/create
   */
  create: async (data: DARCreateRequest): Promise<DAR> => {
    const response = await apiService.post<DAR>('/dar/create', data);
    return response.data;
  },

  /**
   * Get my DARs (for employee)
   * GET /api/dar/my
   */
  getMyDARs: async (params?: DARFilterParams): Promise<PaginatedResponse<DAR>> => {
    const response = await apiService.get<PaginatedResponse<DAR>>('/dar/my', { params });
    return response.data;
  },

  /**
   * Get team DARs (for manager)
   * GET /api/dar/team
   */
  getTeamDARs: async (params?: DARFilterParams): Promise<PaginatedResponse<DAR>> => {
    const response = await apiService.get<PaginatedResponse<DAR>>('/dar/team', { params });
    return response.data;
  },

  /**
   * Get all DARs (for HR/Admin)
   * GET /api/dar/all
   */
  getAllDARs: async (params?: DARFilterParams): Promise<PaginatedResponse<DAR>> => {
    const response = await apiService.get<PaginatedResponse<DAR>>('/dar/all', { params });
    return response.data;
  },

  /**
   * Get DAR by ID
   * GET /api/dar/:id
   */
  getById: async (id: string): Promise<DAR> => {
    const response = await apiService.get<DAR>(`/dar/${id}`);
    return response.data;
  },

  /**
   * Delete DAR
   * DELETE /api/dar/:id
   */
  delete: async (id: string): Promise<void> => {
    await apiService.delete(`/dar/${id}`);
  },

  /**
   * Update DAR
   * PUT /api/dar/:id
   */
  update: async (data: DARUpdateRequest): Promise<DAR> => {
    const response = await apiService.put<DAR>(`/dar/${data.id}`, data);
    return response.data;
  },

  /**
   * Submit DAR (change status from DRAFT to SUBMITTED)
   * POST /api/dar/:id/submit
   */
  submit: async (id: string): Promise<DAR> => {
    const response = await apiService.post<DAR>(`/dar/${id}/submit`);
    return response.data;
  },

  /**
   * Approve DAR (manager action)
   * POST /api/dar/:id/approve
   */
  approve: async (data: DARApproveRequest): Promise<DAR> => {
    const response = await apiService.post<DAR>(`/dar/${data.darId}/approve`, {
      comments: data.comments,
    });
    return response.data;
  },

  /**
   * Reject DAR (manager action)
   * POST /api/dar/:id/reject
   */
  reject: async (data: DARRejectRequest): Promise<DAR> => {
    const response = await apiService.post<DAR>(`/dar/${data.darId}/reject`, {
      reason: data.reason,
      comments: data.comments,
    });
    return response.data;
  },

  /**
   * Get DAR statistics
   * GET /api/dar/stats
   */
  getStats: async (userId?: string): Promise<DARStats> => {
    const response = await apiService.get<DARStats>('/dar/stats', { params: { userId } });
    return response.data;
  },

  /**
   * Export DARs (for HR/Admin)
   * POST /api/dar/export
   */
  export: async (params: DARFilterParams, format: 'EXCEL' | 'PDF' = 'EXCEL'): Promise<string> => {
    const response = await apiService.post<{ url: string }>('/dar/export', {
      ...params,
      format,
    });
    return response.data.url;
  },
};
