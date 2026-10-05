/**
 * Storage Utility
 * 
 * Platform-aware storage that uses:
 * - SecureStore for iOS/Android (secure)
 * - AsyncStorage for Web (fallback)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

/**
 * Get item from storage
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

/**
 * Set item in storage
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
    throw error;
  }
};

/**
 * Remove item from storage
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
    throw error;
  }
};
