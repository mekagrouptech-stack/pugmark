/**
 * Authentication Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 */

import { apiService } from './api';
import {
  LoginCredentials,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '@/types';

export const authService = {
  /**
   * Login user
   * POST /api/auth/login
   * 
   * Backend response structure (from backend/controllers/authController.js):
   * {
   *   success: true,
   *   message: 'Login successful',
   *   data: {
   *     token: "jwt_token_here",
   *     user: {
   *       id: 1,
   *       email: "user@example.com",
   *       name: "John Doe",
   *       role: "EMPLOYEE",
   *       employeeCode: "EMP001",
   *       department: "IT",
   *       designation: "Developer"
   *     }
   *   }
   * }
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Backend expects: { email, password }
      const response = await apiService.post<{ token: string; user: any }>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      
      // API service returns: { success: true, message: '...', data: { token, user } }
      // Extract the nested data object
      const loginData = response.data;
      
      if (!loginData || !loginData.token || !loginData.user) {
        throw new Error('Invalid login response from server');
      }
      
      // Map backend user structure to mobile app User type
      // Backend returns: { id, email, name, role, employeeCode, department, designation }
      // Mobile app expects: { id, email, firstName, lastName, role, ... }
      const backendUser = loginData.user;
      
      // Split name into firstName and lastName
      const nameParts = (backendUser.name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const user: User = {
        id: String(backendUser.id),
        email: backendUser.email,
        firstName: firstName,
        lastName: lastName,
        role: backendUser.role as any,
        department: backendUser.department,
        designation: backendUser.designation,
        employeeCode: backendUser.employeeCode,
        reportingManagerId: backendUser.reportingManagerId ? String(backendUser.reportingManagerId) : undefined,
        reportingManagerName: backendUser.reportingManager?.name || backendUser.reportingManagerName || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Backend doesn't return refreshToken in login response
      // Use the access token as refresh token for now (temporary solution)
      return {
        token: loginData.token,
        refreshToken: loginData.token, // Temporary: use access token as refresh token
        user,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      // Backend returns error in: error.response.data.message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors - user is logged out locally anyway
      console.log('Logout API error (ignored):', error);
    }
  },

  /**
   * Get current user
   * GET /api/auth/me
   * 
   * Backend response (from backend/controllers/authController.js):
   * {
   *   success: true,
   *   message: 'User profile retrieved successfully',
   *   data: user (full user object with offices association)
   * }
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiService.get<any>('/auth/me');
    const backendUser = response.data;
    
    // Map backend user to mobile app User type
    const nameParts = (backendUser.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      id: String(backendUser.id),
      email: backendUser.email,
      firstName: firstName,
      lastName: lastName,
      role: backendUser.role as any,
      department: backendUser.department,
      designation: backendUser.designation,
      employeeCode: backendUser.employeeCode,
      reportingManagerId: backendUser.reportingManagerId ? String(backendUser.reportingManagerId) : undefined,
      reportingManagerName: backendUser.reportingManager?.name || backendUser.reportingManagerName || undefined,
      isActive: backendUser.isActive ?? true,
      createdAt: backendUser.createdAt || new Date().toISOString(),
      updatedAt: backendUser.updatedAt || new Date().toISOString(),
    };
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiService.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Forgot password
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await apiService.post('/auth/forgot-password', data);
  },

  /**
   * Reset password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await apiService.post('/auth/reset-password', data);
  },

  /**
   * Change password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiService.post('/auth/change-password', data);
  },
};
