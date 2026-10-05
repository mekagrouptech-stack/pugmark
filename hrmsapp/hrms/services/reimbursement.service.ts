/**
 * Reimbursement Service
 *
 * IMPORTANT: Uses REAL backend APIs only. No mock data.
 *
 * Backend endpoints:
 * - POST  /api/reimbursements            - Create a reimbursement request
 * - GET   /api/reimbursements            - Get my reimbursement requests
 * - GET   /api/reimbursements/team       - Team requests (Admin/HR/Head HR/Manager)
 * - PATCH /api/reimbursements/:id/approve
 * - PATCH /api/reimbursements/:id/reject
 */

import { apiService } from './api';

export type ReimbursementStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ReimbursementExpenseItem {
  type?: string | null;
  date?: string | null;
  amount: number;
  purpose?: string | null;
}

export interface ReimbursementRequest {
  id: number | string;
  requestType: string;
  userName?: string;
  employeeCode?: string;
  totalAmount: number;
  status: ReimbursementStatus;
  createdOn?: string;
  approver?: string;
  periodFrom?: string;
  periodTo?: string;
  rejectionReason?: string | null;
  expenseDetails: ReimbursementExpenseItem[];
}

export interface CreateReimbursementPayload {
  requestType: string;
  periodFrom: string;
  periodTo: string;
  totalAmount: number;
  expenseDetails: ReimbursementExpenseItem[];
}

export const REIMBURSEMENT_TYPES = ['Travel', 'Medical', 'Non-CTC', 'General'] as const;

export const reimbursementService = {
  /**
   * Get my reimbursement requests
   * GET /api/reimbursements
   */
  getMyRequests: async (status?: ReimbursementStatus): Promise<ReimbursementRequest[]> => {
    // Backend returns a bare array (not wrapped in { data }).
    const response = await apiService.get<any>('/reimbursements', {
      params: status ? { status } : undefined,
    });
    const payload = (response as any)?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Create a reimbursement request
   * POST /api/reimbursements
   */
  create: async (payload: CreateReimbursementPayload): Promise<ReimbursementRequest> => {
    const response = await apiService.post<any>('/reimbursements', payload);
    return (response as any)?.data ?? response;
  },

  /**
   * Team requests (managers/HR)
   * GET /api/reimbursements/team
   */
  getTeamRequests: async (status?: ReimbursementStatus): Promise<ReimbursementRequest[]> => {
    const response = await apiService.get<any>('/reimbursements/team', {
      params: status ? { status } : undefined,
    });
    const payload = (response as any)?.data ?? response;
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Approve a request
   * PATCH /api/reimbursements/:id/approve
   */
  approve: async (id: number | string): Promise<void> => {
    await apiService.patch(`/reimbursements/${id}/approve`, {});
  },

  /**
   * Reject a request
   * PATCH /api/reimbursements/:id/reject
   */
  reject: async (id: number | string, rejectionReason: string): Promise<void> => {
    await apiService.patch(`/reimbursements/${id}/reject`, { rejectionReason });
  },
};
