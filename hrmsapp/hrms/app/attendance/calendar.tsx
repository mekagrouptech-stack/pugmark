/**
 * Attendance Calendar Screen
 * Shows monthly attendance calendar with Present, Absent, and Half Day marks
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { attendanceService } from '@/services/attendance.service';
import { leaveService } from '@/services/leave.service';
import { Attendance, AttendanceStatus, Holiday, Leave } from '@/types';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card } from '@/components/ui/Card';
import { formatDate, formatDateLocal, toIST } from '@/utils/helpers';
import { ATTENDANCE_RULES } from '@/utils/constants';

// Dark pink, distinct from the amber used for Half Day.
const SHORT_HOURS_COLOR = '#BE185D';
// Removed USE_MOCK_AUTH - all data comes from real APIs

export default function AttendanceCalendarScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceData();
  }, [currentMonth]);

  const loadAttendanceData = async () => {
    try {
      setError(null);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // Fetch real data from APIs
      const [attendanceResponse, leavesResponse] = await Promise.all([
        attendanceService.getAttendance({
          startDate: `${year}-${String(month).padStart(2, '0')}-01`,
          endDate: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
          userId: user?.id,
        }),
        leaveService.getLeaves({
          startDate: `${year}-${String(month).padStart(2, '0')}-01`,
          endDate: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
          // No status filter - fetch all my leaves to show Pending / Approved / Rejected on calendar
        }),
      ]);
      
      // Ensure we always have arrays, even if API returns undefined
      const attendanceArray = Array.isArray(attendanceResponse?.data) 
        ? attendanceResponse.data 
        : [];
      const leavesArray = Array.isArray(leavesResponse?.data) 
        ? leavesResponse.data 
        : [];
      
      // Ensure attendance records have user info filled in
      const enrichedAttendance = attendanceArray.map((att) => ({
        ...att,
        userId: att.userId || user?.id || '',
        employeeId: att.employeeId || user?.id || '',
        employeeName: att.employeeName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Employee',
      }));
      
      // Generate absent records for dates in the month that don't have attendance
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const allDatesInMonth: string[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDatesInMonth.push(formatDateLocal(d)); // Use local timezone, not UTC
      }
      
      // Create a map of existing attendance dates
      const attendanceDates = new Set(enrichedAttendance.map(att => att.date));
      
      // Get today's date (without time) in local timezone for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDateLocal(today);
      
      // Add absent records for dates without attendance (excluding Sundays, holidays, and future dates)
      const absentRecords = allDatesInMonth
        .filter(dateStr => {
          const date = new Date(dateStr + 'T00:00:00'); // Parse as local date
          date.setHours(0, 0, 0, 0);
          const dayOfWeek = date.getDay();
          const isSunday = dayOfWeek === 0; // Only Sunday is non-working day, Saturday is working
          const isFutureDate = dateStr > todayStr; // Compare date strings, not future dates
          const isHolidayDate = holidays.some(h => h.date === dateStr && h.isActive);
          const isLeaveDate = leavesArray.some(l => {
            const start = new Date(l.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(l.endDate);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
          });
          
          // Only mark as absent if:
          // - No attendance record exists
          // - Not a Sunday (Saturday is a working day)
          // - Not a future date
          // - Not a holiday
          // - Not on leave
          return !attendanceDates.has(dateStr) && !isSunday && !isFutureDate && !isHolidayDate && !isLeaveDate;
        })
        .map(dateStr => ({
          id: `absent-${dateStr}`,
          userId: user?.id || '',
          employeeId: user?.id || '',
          employeeName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Employee',
          date: dateStr,
          status: AttendanceStatus.ABSENT,
          isLate: false,
          isHalfDay: false,
        }));
      
      // Combine attendance and absent records
      const allAttendanceData = [...enrichedAttendance, ...absentRecords];
      
      setAttendanceData(allAttendanceData);
      setLeaves(leavesArray.filter((l) => l.userId === user?.id));
      
      // TODO: Fetch holidays from API endpoint when available
      // For now, holidays array remains empty
      setHolidays([]);
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      setError(err.message || 'Failed to load attendance data');
      // Set empty arrays on error to prevent filter errors
      setAttendanceData([]);
      setLeaves([]);
      setHolidays([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Removed all mock data generation functions
  // All data now comes from real backend APIs

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceData();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    setLoading(true);
  };

  const getAttendanceForDate = (date: Date): Attendance | undefined => {
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) return undefined;
    const dateStr = formatDateLocal(date); // Use local timezone, not UTC
    return attendanceData.find((att) => att.date === dateStr);
  };

  const isHoliday = (date: Date): boolean => {
    if (!Array.isArray(holidays) || holidays.length === 0) return false;
    const dateStr = formatDateLocal(date); // Use local timezone, not UTC
    return holidays.some((h) => h.date === dateStr && h.isActive);
  };

  /** Leave approval status for a date (Pending / Approved / Rejected) for calendar colors */
  const getLeaveStatusForDate = (date: Date): string | null => {
    if (!Array.isArray(leaves) || leaves.length === 0) return null;
    const dateStr = formatDateLocal(date);
    for (const l of leaves) {
      const start = new Date(l.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(l.endDate);
      end.setHours(23, 59, 59, 999);
      const check = new Date(dateStr);
      check.setHours(0, 0, 0, 0);
      if (check >= start && check <= end) return (l as any).status || 'Pending';
    }
    return null;
  };

  const isOnLeave = (date: Date): boolean => {
    return getLeaveStatusForDate(date) !== null;
  };

  // Late and early out are judged by the API against the employee's own shift
  // (late = more than 15 min after shift start, early = before shift end), so
  // the calendar reads its verdict instead of guessing office hours here.
  const isLatePunch = (attendance: Attendance): boolean =>
    !!attendance.punchIn && !!attendance.isLate;

  const isEarlyPunchOut = (attendance: Attendance): boolean => {
    if (!attendance.punchOut || !attendance.earlyOut) return false;
    // Today's last punch may be a lunch break, not the day's real punch out.
    return attendance.date !== formatDateLocal(new Date());
  };

  const getStatusColor = (date: Date, attendance?: Attendance): string => {
    // Don't show status for future dates (using local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateLocal(today);
    const checkDateStr = formatDateLocal(date);
    const isFuture = checkDateStr > todayStr;
    
    if (isHoliday(date)) return '#8B5CF6'; // Purple for holiday
    const leaveStatus = getLeaveStatusForDate(date);
    if (leaveStatus === 'Approved') return '#10B981'; // Green
    if (leaveStatus === 'Pending') return '#F59E0B'; // Orange
    if (leaveStatus === 'Rejected' || leaveStatus === 'Cancelled') return '#EF4444'; // Red
    if (leaveStatus) return '#A855F7'; // Fallback purple for on leave
    if (!attendance) {
      // For future dates without attendance, don't show absent
      if (isFuture) return 'transparent';
      return 'transparent';
    }
    
    // Attended, but under the required 9 hours. The API only sets this once
    // the day is over, and it never changes the status itself.
    if (
      attendance.shortHours &&
      (attendance.status === AttendanceStatus.PRESENT || attendance.status === AttendanceStatus.LATE)
    ) {
      return SHORT_HOURS_COLOR;
    }

    switch (attendance.status) {
      case AttendanceStatus.PRESENT:
        return '#10B981'; // Green
      case AttendanceStatus.ABSENT:
        // Don't show absent for future dates
        if (isFuture) return 'transparent';
        return '#EF4444'; // Red
      case AttendanceStatus.HALF_DAY:
        return '#F59E0B'; // Orange
      case AttendanceStatus.LATE:
        return '#3B82F6'; // Blue
      case AttendanceStatus.ON_LEAVE:
        return '#A855F7'; // Light purple
      default:
        return 'transparent';
    }
  };

  const getStatusLabel = (status?: AttendanceStatus): string => {
    if (!status) return '';
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'Present';
      case AttendanceStatus.ABSENT:
        return 'Absent';
      case AttendanceStatus.HALF_DAY:
        return 'Half Day';
      case AttendanceStatus.LATE:
        return 'Late';
      case AttendanceStatus.ON_LEAVE:
        return 'On Leave';
      default:
        return '';
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarContainer}>
        {/* Week day headers */}
        <View style={styles.weekDayRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDayHeader}>
              <Text style={[styles.weekDayText, { color: colors.icon }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar days */}
        <View style={styles.calendarGrid}>
          {days.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.calendarDay} />;
            }

            const attendance = getAttendanceForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isPast = date < new Date() && !isToday;
            const statusColor = getStatusColor(date, attendance);
            const isSunday = date.getDay() === 0; // Only Sunday is non-working, Saturday is working
            const holiday = isHoliday(date);
            const onLeave = isOnLeave(date);
            const latePunch = attendance ? isLatePunch(attendance) : false;
            const earlyOut = attendance ? isEarlyPunchOut(attendance) : false;

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.calendarDay,
                  isToday && styles.todayDay,
                  isSunday && styles.weekendDay,
                  holiday && styles.holidayDay,
                  onLeave && styles.leaveDay,
                ]}
                onPress={() => {
                  if (attendance || holiday || onLeave) {
                    router.push(`/attendance/list?date=${date.toISOString().split('T')[0]}`);
                  }
                }}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isToday ? '#FFFFFF' : colors.text },
                    isSunday && !isToday && { color: colors.icon },
                    holiday && !isToday && { color: '#8B5CF6' },
                    onLeave && !isToday && { color: '#A855F7' },
                  ]}
                >
                  {date.getDate()}
                </Text>
                {attendance && (
                  <>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    {latePunch && (
                      <Ionicons
                        name="time-outline"
                        size={10}
                        color="#EF4444"
                        style={styles.lateIcon}
                      />
                    )}
                    {earlyOut && (
                      <Ionicons
                        name="arrow-down-outline"
                        size={10}
                        color="#F59E0B"
                        style={styles.earlyIcon}
                      />
                    )}
                  </>
                )}
                {holiday && !attendance && (
                  <View style={[styles.statusIndicator, { backgroundColor: '#8B5CF6' }]} />
                )}
                {onLeave && !attendance && !holiday && (
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                )}
                {!attendance && !holiday && !onLeave && isPast && !isSunday && (
                  <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const getSummaryStats = () => {
    // Ensure attendanceData is always an array
    const safeAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];
    const safeHolidays = Array.isArray(holidays) ? holidays : [];
    const safeLeaves = Array.isArray(leaves) ? leaves : [];
    
    const present = safeAttendanceData.filter(
      (att) => att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.LATE
    ).length;
    const absent = safeAttendanceData.filter((att) => att.status === AttendanceStatus.ABSENT).length;
    const halfDay = safeAttendanceData.filter((att) => att.status === AttendanceStatus.HALF_DAY).length;
    const holidayCount = safeHolidays.length;
    const onLeaveCount = safeLeaves.length;
    const latePunchCount = safeAttendanceData.filter((att) => isLatePunch(att)).length;
    const earlyOutCount = safeAttendanceData.filter((att) => isEarlyPunchOut(att)).length;
    const shortHoursCount = safeAttendanceData.filter(
      (att) => att.shortHours && att.status !== AttendanceStatus.HALF_DAY
    ).length;
    
    // Calculate total and average working hours
    const totalWorkingHours = safeAttendanceData.reduce((sum, att) => {
      return sum + (att.workingHours || 0);
    }, 0);
    const averageWorkingHours = safeAttendanceData.length > 0 
      ? totalWorkingHours / safeAttendanceData.length 
      : 0;

    return { 
      present, 
      absent, 
      halfDay, 
      holidayCount, 
      onLeaveCount, 
      latePunchCount, 
      earlyOutCount,
      shortHoursCount,
      totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
      averageWorkingHours: Math.round(averageWorkingHours * 10) / 10,
    };
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={loadAttendanceData} />;
  }

  const stats = getSummaryStats();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Month Navigation */}
        <Card style={styles.monthCard}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => navigateMonth('prev')}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: colors.text }]}>{monthName}</Text>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => navigateMonth('next')}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: '#10B98120' }]}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{stats.present}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F59E0B20' }]}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{stats.halfDay}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Half Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EF444420' }]}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{stats.absent}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Absent</Text>
          </View>
        </View>

        {/* Additional Stats Row */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: '#8B5CF620' }]}>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{stats.holidayCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Holiday</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#A855F720' }]}>
            <Text style={[styles.summaryValue, { color: '#A855F7' }]}>{stats.onLeaveCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>On Leave</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EF444420' }]}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{stats.latePunchCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Late Punch</Text>
          </View>
        </View>

        {/* Working Hours Stats */}
        <Card style={styles.hoursCard}>
          <Text style={[styles.hoursTitle, { color: colors.text }]}>Working Hours</Text>
          <View style={styles.hoursRow}>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursValue, { color: colors.tint }]}>{stats.totalWorkingHours}h</Text>
              <Text style={[styles.hoursLabel, { color: colors.icon }]}>Total Working Hours</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursValue, { color: '#F59E0B' }]}>{stats.averageWorkingHours}h</Text>
              <Text style={[styles.hoursLabel, { color: colors.icon }]}>Average Working Hours</Text>
            </View>
          </View>
          <View style={styles.hoursRow}>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursValue, { color: '#EF4444' }]}>{stats.earlyOutCount}</Text>
              <Text style={[styles.hoursLabel, { color: colors.icon }]}>Early Punch Out</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={[styles.hoursValue, { color: SHORT_HOURS_COLOR }]}>{stats.shortHoursCount}</Text>
              <Text style={[styles.hoursLabel, { color: colors.icon }]}>
                Days Under {ATTENDANCE_RULES.WORKDAY_HOURS} Hours
              </Text>
            </View>
          </View>
        </Card>

        {/* Calendar */}
        <Card style={styles.calendarCard}>{renderCalendar()}</Card>

        {/* Legend */}
        <Card style={styles.legendCard}>
          <Text style={[styles.legendTitle, { color: colors.text }]}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Half Day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Holiday</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Leave Approved</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Leave Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Leave Rejected</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>On Leave</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SHORT_HOURS_COLOR }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Under {ATTENDANCE_RULES.WORKDAY_HOURS}h
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="time-outline" size={12} color="#EF4444" />
              <Text style={[styles.legendText, { color: colors.text, marginLeft: 4 }]}>Late Punch</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="arrow-down-outline" size={12} color="#F59E0B" />
              <Text style={[styles.legendText, { color: colors.text, marginLeft: 4 }]}>Early Out</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  monthCard: {
    marginBottom: 16,
    padding: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarCard: {
    marginBottom: 16,
    padding: 16,
  },
  calendarContainer: {
    width: '100%',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 4,
  },
  todayDay: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  weekendDay: {
    opacity: 0.5,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lateIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  earlyIcon: {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  holidayDay: {
    // Additional styling if needed
  },
  leaveDay: {
    // Additional styling if needed
  },
  hoursCard: {
    marginBottom: 16,
    padding: 16,
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  hoursItem: {
    flex: 1,
    alignItems: 'center',
  },
  hoursValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hoursLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendCard: {
    padding: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
  },
});
