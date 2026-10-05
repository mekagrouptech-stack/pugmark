/**
 * Notifications Screen
 * Shows recent activity as notifications (leaves, attendance, etc.)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { leaveService } from '@/services/leave.service';
import { attendanceService } from '@/services/attendance.service';
import { formatDate, formatDateTime, isAdmin } from '@/utils/helpers';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'LEAVE' | 'ATTENDANCE' | 'GENERAL' | 'PAYROLL';
  time: string;
  isRead: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  onPress?: () => void;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    try {
      const items: NotificationItem[] = [];

      // Load recent leaves as notifications
      try {
        const leavesData = await leaveService.getLeaves({ limit: 20 });
        const leaves = leavesData.data || [];

        leaves.forEach((leave: any) => {
          const status = leave.status?.toUpperCase();
          let title = '';
          let icon = '';
          let iconColor = '';
          let iconBg = '';

          if (status === 'APPROVED') {
            title = 'Leave Approved';
            icon = 'checkmark-circle';
            iconColor = '#10B981';
            iconBg = '#10B98120';
          } else if (status === 'REJECTED') {
            title = 'Leave Rejected';
            icon = 'close-circle';
            iconColor = '#EF4444';
            iconBg = '#EF444420';
          } else if (status === 'PENDING') {
            title = isAdmin(user?.role) ? 'Leave Request Pending' : 'Leave Pending Approval';
            icon = 'time';
            iconColor = '#F59E0B';
            iconBg = '#F59E0B20';
          } else if (status === 'CANCELLED') {
            title = 'Leave Cancelled';
            icon = 'ban';
            iconColor = '#6B7280';
            iconBg = '#6B728020';
          } else {
            return;
          }

          const employeeName = leave.employeeName || 'Employee';
          const leaveType = leave.leaveType || 'Leave';
          const message = isAdmin(user?.role)
            ? `${employeeName} - ${leaveType} (${formatDate(leave.startDate)} to ${formatDate(leave.endDate)})`
            : `Your ${leaveType} request from ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`;

          items.push({
            id: `leave-${leave.id}`,
            title,
            message,
            type: 'LEAVE',
            time: leave.updatedAt || leave.createdAt || new Date().toISOString(),
            isRead: readIds.has(`leave-${leave.id}`),
            icon,
            iconColor,
            iconBg,
            onPress: () => router.push('/leaves'),
          });
        });
      } catch (err) {
        console.log('Could not load leave notifications:', err);
      }

      // Load recent attendance as notifications
      try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        const attendanceData = await attendanceService.getAttendanceHistory(startDate, endDate);
        const records = attendanceData?.data || attendanceData || [];

        if (Array.isArray(records)) {
          // Only show last 5 attendance records as notifications
          records.slice(0, 5).forEach((record: any) => {
            const status = record.status?.toUpperCase();
            let title = '';
            let icon = '';
            let iconColor = '';
            let iconBg = '';

            if (status === 'LATE') {
              title = 'Late Check-in';
              icon = 'warning';
              iconColor = '#F59E0B';
              iconBg = '#F59E0B20';
            } else if (status === 'PRESENT' || status === 'ON_TIME') {
              title = 'Attendance Recorded';
              icon = 'checkmark-circle';
              iconColor = '#10B981';
              iconBg = '#10B98120';
            } else if (status === 'ABSENT') {
              title = 'Marked Absent';
              icon = 'close-circle';
              iconColor = '#EF4444';
              iconBg = '#EF444420';
            } else {
              return;
            }

            const date = record.date || record.createdAt;
            const message = `${formatDate(date)} - Check in: ${record.checkInTime || record.punchIn || 'N/A'}`;

            items.push({
              id: `att-${record.id || date}`,
              title,
              message,
              type: 'ATTENDANCE',
              time: record.createdAt || date || new Date().toISOString(),
              isRead: readIds.has(`att-${record.id || date}`),
              icon,
              iconColor,
              iconBg,
              onPress: () => router.push('/attendance/calendar'),
            });
          });
        }
      } catch (err) {
        console.log('Could not load attendance notifications:', err);
      }

      // Sort by time (newest first)
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(items);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, readIds]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch {
      return '';
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: item.isRead ? colors.cardBackground : (colors.tint + '08') },
        !item.isRead && styles.unreadCard,
      ]}
      onPress={() => {
        markAsRead(item.id);
        item.onPress?.();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.timeText, { color: colors.icon }]}>{getTimeAgo(item.time)}</Text>
        </View>
        <Text style={[styles.notificationMessage, { color: colors.icon }]} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: item.iconBg }]}>
            <Text style={[styles.typeBadgeText, { color: item.iconColor }]}>{item.type}</Text>
          </View>
          {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
      <Text style={[styles.emptyMessage, { color: colors.icon }]}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Unread count banner */}
      {unreadCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: colors.tint + '15' }]}>
          <Ionicons name="mail-unread-outline" size={18} color={colors.tint} />
          <Text style={[styles.unreadBannerText, { color: colors.tint }]}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        />
      )}
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF30',
    borderRadius: 16,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  unreadBannerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
