/**
 * Office Service
 *
 * IMPORTANT: Uses REAL backend APIs only.
 */

import { apiService } from './api';

export const officeService = {
  /**
   * Get all active offices
   * GET /api/offices
   */
  getOffices: async (): Promise<any[]> => {
    const response = await apiService.get<any[]>('/offices');
    return response.data;
  },

  /**
   * Get offices assigned to a user
   * GET /api/offices/user/:userId
   */
  getUserOffices: async (userId: string | number): Promise<number[]> => {
    const response = await apiService.get<number[]>(`/offices/user/${userId}`);
    return response.data;
  },
};

