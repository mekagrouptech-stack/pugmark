/**
 * Application Constants
 * 
 * IMPORTANT: This app uses REAL backend APIs only.
 * No mock data, no demo data, no static JSON.
 * All data must come from backend APIs.
 */

import Constants from 'expo-constants';

// Get API base URL from environment variables
// For development: Use your local backend URL
// For production: Set EXPO_PUBLIC_API_BASE_URL in your deployment
// Live production API — the same server the web app uses (see the web
// .env.production). The Node app is mounted at pugmarkhr.com/api and mounts its
// own routes under /api, hence /api/api. The old hrapi.meka.com host answers
// every request with a 500.
const LIVE_API_URL = 'https://pugmarkhr.com/api/api';

const getApiBaseUrl = (): string => {
  // Check for environment variable first (set via expo-constants or .env)
  const envUrl = Constants.expoConfig?.extra?.apiBaseUrl ||
                 process.env.EXPO_PUBLIC_API_BASE_URL;

  if (envUrl) {
    return envUrl;
  }

  // Always use live API
  return LIVE_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  COMPANY_ID: 'company_id',
} as const;

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Main
  DASHBOARD: '/dashboard',
  
  // Company
  COMPANIES: '/companies',
  COMPANY_DETAIL: '/companies/[id]',
  
  // Employee
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/[id]',
  EMPLOYEE_ADD: '/employees/add',
  EMPLOYEE_EDIT: '/employees/[id]/edit',
  
  // Attendance
  ATTENDANCE: '/attendance',
  ATTENDANCE_PUNCH: '/attendance/punch',
  ATTENDANCE_SUMMARY: '/attendance/summary',
  
  // Leave
  LEAVES: '/leaves',
  LEAVE_APPLY: '/leaves/apply',
  LEAVE_DETAIL: '/leaves/[id]',
  
  // Payroll
  PAYROLL: '/payroll',
  PAYROLL_DETAIL: '/payroll/[id]',
  
  // Holiday & Shift
  HOLIDAYS: '/holidays',
  SHIFTS: '/shifts',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  
  // Settings
  SETTINGS: '/settings',
  PROFILE: '/settings/profile',
  CHANGE_PASSWORD: '/settings/change-password',
  
  // DAR (Daily Activity Report)
  DAR_LIST: '/dar/list',
  DAR_CREATE: '/dar/create',
  DAR_DETAIL: '/dar/[id]',
  DAR_EDIT: '/dar/[id]/edit',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_WITH_TIME: 'DD MMM YYYY, hh:mm A',
  API: 'YYYY-MM-DD',
  MONTH_YEAR: 'MMMM YYYY',
} as const;

export const GEO_FENCING = {
  DEFAULT_RADIUS: 100, // meters
  LOCATION_TIMEOUT: 10000, // 10 seconds
  LOCATION_ACCURACY: 50, // meters
} as const;

/**
 * Attendance rules. Mirrors backend/config/attendanceRules.js: an employee is
 * expected to complete WORKDAY_HOURS between the day's first IN and last OUT.
 * A shorter day is only flagged by the API (`shortHours`) — never re-graded.
 */
export const ATTENDANCE_RULES = {
  WORKDAY_HOURS: 9,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
