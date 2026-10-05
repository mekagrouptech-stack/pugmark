/**
 * Authentication Store using Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, LoginCredentials } from '@/types';
import { authService } from '@/services/auth.service';
import { STORAGE_KEYS } from '@/utils/constants';
import { getItem, setItem, removeItem } from '@/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      const response: AuthResponse = await authService.login(credentials);

      // Store tokens securely (uses SecureStore on native, AsyncStorage on web)
      await setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      // User data can be stored in AsyncStorage (less sensitive)
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage
      try {
        await removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      } catch (error) {
        console.error('Error clearing storage:', error);
      }

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  setToken: (token: string) => {
    set({ token });
    setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (token && userData) {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Verify token is still valid by fetching current user from API
        try {
          const currentUser = await authService.getCurrentUser();
          set({ user: currentUser });
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
        } catch (error) {
          // Token invalid, logout
          get().logout();
        }
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
