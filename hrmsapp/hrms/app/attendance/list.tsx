/**
 * Attendance List Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { attendanceService } from '@/services/attendance.service';
import { Attendance, UserRole } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { CalendarStrip } from '@/components/ui/CalendarStrip';
import { WorkdayProgress } from '@/components/ui/WorkdayProgress';
import { formatDateTime } from '@/utils/helpers';
import { useAuthStore } from '@/store/auth.store';

export default function AttendanceListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAttendances();
  }, [selectedDate]);

  const loadAttendances = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await attendanceService.getAttendance({
        startDate: dateStr,
        endDate: dateStr,
        limit: 50,
      });
      setAttendances(response.data);
    } catch (error) {
      console.error('Error loading attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManageAttendance =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.HR ||
    user?.role === UserRole.MANAGER ||
    user?.role === UserRole.HEAD_HR;

  const handleDeleteAttendance = (id: string) => {
    Alert.alert(
      'Delete Attendance Record',
      'Are you sure you want to delete this attendance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await attendanceService.deleteAttendance(id);
              setAttendances((prev) => prev.filter((a) => a.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete attendance');
            }
          },
        },
      ]
    );
  };

  const handleEditAttendance = (attendance: Attendance) => {
    Alert.alert(
      'Edit Attendance',
      'Editing attendance from the mobile app is not yet implemented. Please use the web admin panel for detailed edits.'
    );
  };

  if (loading) {
    return <Loading message="Loading attendance..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Today's Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's</Text>
          <CalendarStrip
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />
        </View>

        {/* Attendance Records */}
        <View style={styles.section}>
          {attendances.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No records for this date"
              message="Attendance appears here once the biometric device syncs punches for the selected day."
            />
          ) : (
            attendances.map((attendance) => (
              <Card key={attendance.id} style={styles.attendanceCard}>
                <View style={styles.attendanceRow}>
                  <Avatar
                    firstName={attendance.employeeName.split(' ')[0]}
                    lastName={attendance.employeeName.split(' ')[1]}
                    size={50}
                  />
                  <View style={styles.attendanceInfo}>
                    {attendance.punchIn && (
                      <View style={styles.timeRow}>
                        <Ionicons name="log-in-outline" size={16} color="#10B981" />
                        <Text style={[styles.timeText, { color: colors.text }]}>
                          Check-in{' '}
                          {attendance.punchIn.displayTime ??
                            formatDateTime(attendance.punchIn.time).split(', ')[1]}
                        </Text>
                        {attendance.isLate && attendance.lateBy && (
                          <Text style={[styles.flagText, { color: '#EA580C', backgroundColor: '#EA580C14' }]}>
                            Late {attendance.lateBy}
                          </Text>
                        )}
                      </View>
                    )}
                    {attendance.punchOut && (
                      <View style={styles.timeRow}>
                        <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                        <Text style={[styles.timeText, { color: colors.text }]}>
                          Check-out{' '}
                          {attendance.punchOut.displayTime ??
                            formatDateTime(attendance.punchOut.time).split(', ')[1]}
                        </Text>
                        {attendance.earlyOut &&
                          attendance.earlyBy &&
                          attendance.date !== new Date().toLocaleDateString('en-CA') && (
                            <Text style={[styles.flagText, { color: '#BE185D', backgroundColor: '#BE185D14' }]}>
                              Early {attendance.earlyBy}
                            </Text>
                          )}
                      </View>
                    )}
                    {attendance.expectedCheckIn && (
                      <Text style={[styles.locationText, { color: colors.icon }]}>
                        Shift {attendance.expectedCheckIn} – {attendance.expectedCheckOut}
                      </Text>
                    )}
                    <Text style={[styles.locationText, { color: colors.icon }]}>
                      {attendance.punchIn?.location || attendance.punchOut?.location || 'Location not available'}
                    </Text>
                  </View>
                  {canManageAttendance && (
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity
                        onPress={() => handleEditAttendance(attendance)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.tint} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteAttendance(attendance.id)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {/* Worked time against the required 9 hours. */}
                {attendance.punchIn && (
                  <WorkdayProgress
                    punchInTime={attendance.punchIn.time}
                    punchOutTime={attendance.punchOut?.time}
                    shortBy={attendance.shortHours ? attendance.shortBy : undefined}
                    requiredHours={attendance.requiredHours}
                  />
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flagText: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  attendanceCard: {
    marginBottom: 12,
    padding: 16,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsColumn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
