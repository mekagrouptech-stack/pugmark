/**
 * Attendance Service
 * 
 * IMPORTANT: This service uses REAL backend APIs only.
 * No mock data, no demo responses.
 * 
 * Backend endpoints:
 * - POST /api/attendance/punch - Punch in/out
 * - GET /api/attendance/records - Get attendance records
 * - GET /api/attendance/today - Get today's attendance
 * - GET /api/attendance/monthly-summary - Get monthly summary
 */

import { apiService } from './api';
import { Attendance, PaginatedResponse, AttendanceStatus } from '@/types';
import { getCurrentISTAsISO } from '@/utils/helpers';

/**
 * Transform backend attendance record to mobile app format
 */
const transformAttendanceRecord = (backendRecord: any, userId?: string, employeeName?: string, employeeId?: string): Attendance => {
  // Map status from backend format to AttendanceStatus enum
  const mapStatus = (status: string): AttendanceStatus => {
    // The API sends labels ("Half Day", "Leave"); compare without spaces/underscores.
    const upperStatus = (status || '').toUpperCase().replace(/[\s_]+/g, '');
    if (upperStatus === 'PRESENT') return AttendanceStatus.PRESENT;
    if (upperStatus === 'ABSENT') return AttendanceStatus.ABSENT;
    if (upperStatus === 'LATE') return AttendanceStatus.LATE;
    if (upperStatus === 'HALFDAY') return AttendanceStatus.HALF_DAY;
    if (upperStatus === 'ONLEAVE' || upperStatus === 'LEAVE') return AttendanceStatus.ON_LEAVE;
    return AttendanceStatus.ABSENT; // Default
  };

  // Convert time string (e.g., "09:00 AM") to ISO date string for the date (assumed IST)
  const parseTimeToISO = (dateStr: string, timeStr: string | null | undefined): string | undefined => {
    if (!timeStr) return undefined;
    try {
      // Parse time string like "09:00 AM" or "09:00:00"
      const [timePart, period] = timeStr.split(' ');
      const [hours, minutes] = timePart.split(':');
      let hour24 = parseInt(hours, 10);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      
      const date = new Date(dateStr);
      date.setHours(hour24, parseInt(minutes, 10), 0, 0);
      return date.toISOString();
    } catch {
      // If parsing fails, create a date with the time string appended
      return `${dateStr}T${timeStr}`;
    }
  };

  // Get location string from location object
  const getLocationString = (location: any): string => {
    if (!location) return 'Location not available';
    if (typeof location === 'string') return location;
    if (location.remark) return location.remark;
    if (location.address) return location.address;
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    return 'Location not available';
  };

  // Build punchIn / punchOut objects first so we can derive working hours reliably on the app
  const punchIn = backendRecord.checkIn
    ? {
        time:
          parseTimeToISO(backendRecord.date, backendRecord.checkIn) ||
          `${backendRecord.date}T${backendRecord.checkIn}`,
        latitude: backendRecord.checkInLocation?.latitude || 0,
        longitude: backendRecord.checkInLocation?.longitude || 0,
        location: getLocationString(backendRecord.checkInLocation),
        // Also keep original formatted time from backend (already in IST)
        displayTime: backendRecord.checkIn,
      }
    : undefined;

  const punchOut = backendRecord.checkOut
    ? {
        time:
          parseTimeToISO(backendRecord.date, backendRecord.checkOut) ||
          `${backendRecord.date}T${backendRecord.checkOut}`,
        latitude: backendRecord.checkOutLocation?.latitude || 0,
        longitude: backendRecord.checkOutLocation?.longitude || 0,
        location: getLocationString(backendRecord.checkOutLocation),
        displayTime: backendRecord.checkOut,
      }
    : undefined;

  // Derive working time on the mobile side when both punches are available.
  // We compute:
  // - workingHours: decimal hours (for aggregations)
  // - workingSeconds: total seconds
  // - workingDuration: human readable "X hrs Y min Z sec"
  let workingHours: number | undefined = undefined;
  let workingSeconds: number | undefined = undefined;
  let workingDuration: string | undefined = undefined;

  const buildDurationString = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} hrs ${minutes} min ${seconds} sec`;
  };

  if (punchIn?.time && punchOut?.time) {
    try {
      const inDate = new Date(punchIn.time);
      const outDate = new Date(punchOut.time);
      const diffMs = outDate.getTime() - inDate.getTime();
      if (diffMs > 0) {
        const totalSeconds = Math.floor(diffMs / 1000);
        workingSeconds = totalSeconds;
        const diffHours = totalSeconds / 3600;
        workingHours = Math.round(diffHours * 100) / 100; // 2 decimal places
        workingDuration = buildDurationString(totalSeconds);
      } else {
        workingHours = 0;
        workingSeconds = 0;
        workingDuration = buildDurationString(0);
      }
    } catch {
      // Fallback to backend totalHours if any parsing fails
      if (backendRecord.totalHours != null) {
        workingHours = backendRecord.totalHours;
        const totalSeconds = Math.round(backendRecord.totalHours * 3600);
        workingSeconds = totalSeconds;
        workingDuration = buildDurationString(totalSeconds);
      }
    }
  } else if (backendRecord.totalHours != null) {
    workingHours = backendRecord.totalHours;
    const totalSeconds = Math.round(backendRecord.totalHours * 3600);
    workingSeconds = totalSeconds;
    workingDuration = buildDurationString(totalSeconds);
  }

  return {
    id: backendRecord.id || `date-${backendRecord.date}`,
    userId: userId || backendRecord.userId || '',
    employeeId: employeeId || backendRecord.employeeId || '',
    employeeName: employeeName || backendRecord.employeeName || 'Employee',
    date: backendRecord.date,
    punchIn,
    punchOut,
    status: mapStatus(backendRecord.status),
    workingHours,
    workingSeconds,
    workingDuration,
    shortHours: !!backendRecord.shortHours,
    shortBy: backendRecord.shortBy || undefined,
    isLate: backendRecord.isLate || false,
    lateBy: backendRecord.lateBy || undefined,
    earlyOut: !!backendRecord.earlyOut,
    earlyBy: backendRecord.earlyBy || undefined,
    shiftName: backendRecord.shiftName || undefined,
    expectedCheckIn: backendRecord.expectedCheckIn || undefined,
    expectedCheckOut: backendRecord.expectedCheckOut || undefined,
    lateAfter: backendRecord.lateAfter || undefined,
    requiredHours:
      Number(backendRecord.shiftRequiredHours || backendRecord.requiredHours) > 0
        ? Number(backendRecord.shiftRequiredHours || backendRecord.requiredHours)
        : undefined,
    isHalfDay: backendRecord.status?.toUpperCase() === 'HALF_DAY' || backendRecord.status?.toUpperCase() === 'HALFDAY',
    officeLocationId: backendRecord.officeId?.toString(),
    officeLocationName: backendRecord.officeName,
  };
};

export const attendanceService = {
  /**
   * Punch attendance (in or out)
   * POST /api/attendance/punch
   * 
   * We send clientTime as the device's current IST time so that
   * the backend can record the exact moment the user pressed the button.
   * All calculations are still done on the backend.
   * 
   * @param data - Punch data including location, punchType, and optional targetUserId
   */
  punch: async (data: {
    officeId: number;
    latitude: number;
    longitude: number;
    punchType: 'IN' | 'OUT';
    remark?: string;
    accuracy?: number;
    targetUserId?: number; // For admin/HR to punch on behalf of employee
    clientTime?: string; // Optional client IST time
  }): Promise<Attendance> => {
    try {
      console.log('Sending punch request:', data);
      const response = await apiService.post<any>('/attendance/punch', {
        ...data,
        punchType: data.punchType,
        clientTime: data.clientTime,
      });
      
      console.log('Punch API response:', response);
      
      // apiService.post returns: { success: true, message: '...', data: {...} }
      // Backend returns: { success: true, message: '...', data: result }
      // So response.data is the result object from backend
      if (response && response.data) {
        return response.data;
      }
      
      // Fallback: if response structure is different
      if (response) {
        return response;
      }
      
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Punch API error:', error);
      console.error('Error response:', error?.response);
      
      // Surface backend validation / business messages
      const backendMessage =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors) && error.response.data.errors[0]?.message) ||
        error?.message;

      const message =
        backendMessage ||
        'Failed to submit attendance punch. Please check your location and office configuration.';

      throw new Error(message);
    }
  },

  /**
   * Convenience: Punch IN
   * Uses device's current IST time for clientTime so backend records
   * the exact time the user pressed Punch In.
   */
  punchIn: async (data: {
    officeId: number;
    latitude: number;
    longitude: number;
    remark?: string;
    accuracy?: number;
    targetUserId?: number;
  }): Promise<Attendance> => {
    return attendanceService.punch({
      officeId: data.officeId,
      latitude: data.latitude,
      longitude: data.longitude,
      punchType: 'IN',
      remark: data.remark,
      accuracy: data.accuracy,
      targetUserId: data.targetUserId,
      clientTime: getCurrentISTAsISO(),
    });
  },

  /**
   * Convenience: Punch OUT
   * Uses device's current IST time for clientTime so backend records
   * the exact time the user pressed Punch Out.
   */
  punchOut: async (data: {
    officeId: number;
    latitude: number;
    longitude: number;
    remark?: string;
    accuracy?: number;
    targetUserId?: number;
  }): Promise<Attendance> => {
    return attendanceService.punch({
      officeId: data.officeId,
      latitude: data.latitude,
      longitude: data.longitude,
      punchType: 'OUT',
      remark: data.remark,
      accuracy: data.accuracy,
      targetUserId: data.targetUserId,
      clientTime: getCurrentISTAsISO(),
    });
  },

  /**
   * Get today's attendance
   * GET /api/attendance/today
   *
   * @param userId - Optional user ID (for admin/HR viewing other users)
   */
  getTodayAttendance: async (userId?: string): Promise<Attendance | null> => {
    try {
      const response = await apiService.get<any>('/attendance/today', {
        params: { userId },
      });

      // Backend returns: { success: true, message: '...', data: AttendanceRecord | null }
      const payload = response.data;
      const backendRecord = payload?.data ?? payload;

      if (!backendRecord) {
        return null;
      }

      // Transform backend record into mobile Attendance type
      return transformAttendanceRecord(
        backendRecord,
        backendRecord.userId || userId,
        backendRecord.employeeName,
        backendRecord.employeeId
      );
    } catch (error: any) {
      // If 404, return null (no attendance record for today)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get attendance records
   * GET /api/attendance/records
   * 
   * @param params - Query parameters for filtering attendance records
   */
  getAttendance: async (params?: {
    page?: number;
    limit?: number;
    cursor?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<PaginatedResponse<Attendance> & { counts?: { total: number; checkIns: number; completed: number } }> => {
    const response = await apiService.get<any>('/attendance/records', {
      params,
    });

    // Backend returns: { success: true, data: [], pagination: {}, counts: {} }
    const backendRecords = Array.isArray(response.data) ? response.data : [];
    const pagination = response.pagination || {};
    const counts = response.counts || {};
    
    // Transform each record to match mobile app format
    const transformedRecords = backendRecords.map((record: any) => 
      transformAttendanceRecord(
        record, 
        record.userId || params?.userId, 
        record.employeeName, 
        record.employeeId
      )
    );

    return {
      data: transformedRecords,
      total: pagination.total || transformedRecords.length,
      page: pagination.page || params?.page || 1,
      limit: pagination.limit || params?.limit || transformedRecords.length,
      totalPages: pagination.totalPages || (transformedRecords.length === 0 ? 0 : Math.ceil((pagination.total || transformedRecords.length) / (pagination.limit || params?.limit || transformedRecords.length))),
      hasNextPage: pagination.hasNextPage || false,
      nextCursor: pagination.nextCursor || null,
      counts,
    };
  },

  /**
   * Delete attendance record (Admin / HR / Manager only)
   * DELETE /api/attendance/records/:id
   */
  deleteAttendance: async (id: string): Promise<void> => {
    await apiService.delete(`/attendance/records/${id}`);
  },

  /**
   * Get monthly attendance summary
   * GET /api/attendance/monthly-summary
   * 
   * @param params - Month, year, and optional userId
   */
  getMonthlySummary: async (params: {
    month: number;
    year: number;
    userId?: string;
  }): Promise<{
    present: number;
    absent: number;
    halfDay: number;
    onLeave: number;
    workingDays: number;
    attendance: Attendance[];
  }> => {
    const response = await apiService.get<{
      present: number;
      absent: number;
      halfDay: number;
      onLeave: number;
      workingDays: number;
      attendance: Attendance[];
    }>('/attendance/monthly-summary', { params });
    return response.data;
  },
};
