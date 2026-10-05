/**
 * Notification Service
 */

import { apiService } from './api';
import { Notification, PaginatedResponse } from '@/types';

export const notificationService = {
  /**
   * Get notifications
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<PaginatedResponse<Notification>> => {
    const response = await apiService.get<PaginatedResponse<Notification>>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiService.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiService.patch('/notifications/read-all');
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiService.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },
};
