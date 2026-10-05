/**
 * Application Store using Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

type Theme = 'light' | 'dark' | 'auto';

interface AppState {
  theme: Theme;
  companyId: string | null;
  isLoading: boolean;

  // Actions
  setTheme: (theme: Theme) => Promise<void>;
  setCompanyId: (companyId: string | null) => Promise<void>;
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'auto',
  companyId: null,
  isLoading: true,

  setTheme: async (theme: Theme) => {
    set({ theme });
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  setCompanyId: async (companyId: string | null) => {
    set({ companyId });
    if (companyId) {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_ID, companyId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.COMPANY_ID);
    }
  },

  initializeApp: async () => {
    try {
      const theme = (await AsyncStorage.getItem(STORAGE_KEYS.THEME)) as Theme | null;
      const companyId = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_ID);

      set({
        theme: theme || 'auto',
        companyId,
        isLoading: false,
      });
    } catch (error) {
      console.error('App initialization error:', error);
      set({ isLoading: false });
    }
  },
}));
