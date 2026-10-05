/**
 * Dashboard Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 */

import { apiService } from './api';
import { DashboardStats } from '@/types';

export const dashboardService = {
  /**
   * Get dashboard stats
   * GET /api/dashboard/stats
   */
  getStats: async (companyId?: string): Promise<DashboardStats> => {
    const response = await apiService.get<DashboardStats>('/dashboard/stats', {
      params: { companyId },
    });
    return response.data;
  },
};
