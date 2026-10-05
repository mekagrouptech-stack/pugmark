/**
 * Leave Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 * 
 * Backend endpoints:
 * - GET /api/leaves - Get all leaves
 * - GET /api/leaves/:id - Get leave by ID
 * - POST /api/leaves - Apply for leave
 * - PATCH /api/leaves/:id/approve - Approve leave
 * - PATCH /api/leaves/:id/reject - Reject leave
 * - PATCH /api/leaves/:id/cancel - Cancel leave
 * - GET /api/leaves/balance - Get leave balance
 */

import { apiService } from './api';
import { Leave, LeaveBalance, PaginatedResponse, LeaveType, LeaveStatus } from '@/types';

export const leaveService = {
  /**
   * Get all leaves
   * GET /api/leaves
   */
  getLeaves: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Leave>> => {
    // Backend returns: { success, message, data: Leave[], count }
    const response = await apiService.get<any>('/leaves', {
      params,
    });

    const leaves: Leave[] = response.data || [];
    const count: number = typeof response.count === 'number' ? response.count : leaves.length;

    return {
      data: leaves,
      total: count,
      page: params?.page || 1,
      limit: params?.limit || leaves.length,
      totalPages: leaves.length === 0 ? 0 : Math.ceil(count / (params?.limit || leaves.length)),
    };
  },

  /**
   * Get leave by ID
   * GET /api/leaves/:id
   */
  getLeaveById: async (id: string): Promise<Leave> => {
    const response = await apiService.get<Leave>(`/leaves/${id}`);
    return response.data;
  },

  /**
   * Apply for leave
   * POST /api/leaves
   */
  applyLeave: async (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<Leave> => {
    const response = await apiService.post<Leave>('/leaves', data);
    return response.data;
  },

  /**
   * Approve leave
   * PATCH /api/leaves/:id/approve
   */
  approveLeave: async (id: string, comments?: string): Promise<Leave> => {
    const response = await apiService.patch<Leave>(`/leaves/${id}/approve`, { comments });
    return response.data;
  },

  /**
   * Reject leave
   * PATCH /api/leaves/:id/reject
   */
  rejectLeave: async (id: string, reason: string, comments?: string): Promise<Leave> => {
    const response = await apiService.patch<Leave>(`/leaves/${id}/reject`, { reason, comments });
    return response.data;
  },

  /**
   * Cancel leave
   * PATCH /api/leaves/:id/cancel
   */
  cancelLeave: async (id: string): Promise<Leave> => {
    const response = await apiService.patch<Leave>(`/leaves/${id}/cancel`);
    return response.data;
  },

  /**
   * Get leave balance
   * GET /api/leaves/balance
   */
  getLeaveBalance: async (userId?: string): Promise<LeaveBalance[]> => {
    const response = await apiService.get<LeaveBalance[]>('/leaves/balance', {
      params: { userId },
    });
    return response.data;
  },
};
