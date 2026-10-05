/**
 * Helper Functions
 */

import { UserRole } from '@/types';
import moment from 'moment-timezone';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Convert any Date/string to IST (India Standard Time, UTC+5:30)
 * using moment-timezone.
 */
export const toIST = (date: Date | string): Date => {
  return moment.tz(date, IST_TIMEZONE).toDate();
};

/**
 * Format date to YYYY-MM-DD in IST.
 * This ensures correct date matching for India timezone (UTC+5:30).
 */
export const formatDateLocal = (date: Date | string): string => {
  return moment.tz(date, IST_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Format date to display format
 */
export const formatDate = (date: string | Date, format: string = 'DD MMM YYYY'): string => {
  const d = moment.tz(date, IST_TIMEZONE);
  const day = d.date().toString().padStart(2, '0');
  const month = d.format('MMM');
  const year = d.year();

  return format.replace('DD', day).replace('MMM', month).replace('YYYY', year.toString());
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return moment.tz(date, IST_TIMEZONE).format('DD MMM YYYY, hh:mm A');
};

/**
 * Get current IST time as ISO string
 * This ensures the time sent to backend represents the actual IST moment.
 * The ISO string will be in UTC format, but represents the IST time moment.
 * 
 * Example: If current IST is 11:08 AM, this returns an ISO string representing
 * that exact moment (which will be 05:38 UTC in the ISO string format).
 */
export const getCurrentISTAsISO = (): string => {
  // Get current time directly in IST timezone
  // moment.tz(IST_TIMEZONE) gets the current moment in IST, regardless of system timezone
  // .toISOString() converts it to UTC format for transmission
  return moment.tz(IST_TIMEZONE).toISOString();
};

/**
 * Format duration between two punch times (e.g. "5 min", "2 hrs 30 min")
 */
export const formatDurationBetween = (punchInTime: string, punchOutTime: string): string => {
  const start = new Date(punchInTime).getTime();
  const end = new Date(punchOutTime).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return '0 min';
  const totalMinutes = Math.round((end - start) / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} hrs ${mins} min` : `${hours} hrs`;
};

/**
 * Calculate days between two dates
 */
export const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Check if user is admin
 */
export const isAdmin = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR].includes(role);
};

/**
 * Check if user can manage employees
 */
export const canManageEmployees = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR, UserRole.MANAGER].includes(role);
};

/**
 * Check if user can approve leaves
 */
export const canApproveLeaves = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR, UserRole.MANAGER].includes(role);
};

/**
 * Get user full name
 */
export const getFullName = (firstName: string, lastName?: string): string => {
  return lastName ? `${firstName} ${lastName}` : firstName;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if location is within radius
 */
export const isWithinRadius = (
  userLat: number,
  userLon: number,
  officeLat: number,
  officeLon: number,
  radius: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  return distance <= radius;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Truncate text
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (firstName: string, lastName?: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};
