/**
 * Leaves Tab Screen
 */

import React, { useEffect, useState } from 'react';
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
import { leaveService } from '@/services/leave.service';
import { Leave, LeaveStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, getFullName } from '@/utils/helpers';

export default function LeavesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await leaveService.getLeaves({ limit: 20 });
      setLeaves(response.data);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  const getStatusColor = (status: LeaveStatus): string => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return '#10B981';
      case LeaveStatus.REJECTED:
        return '#EF4444';
      case LeaveStatus.PENDING:
        return '#F59E0B';
      default:
        return colors.icon;
    }
  };

  if (loading) {
    return <Loading message="Loading leaves..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, flex: 1, marginLeft: 12 }]}>My Leaves</Text>
        <TouchableOpacity onPress={() => router.push('/leaves/apply')}>
          <Ionicons name="add-circle" size={32} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {leaves.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Leaves"
            message="You haven't applied for any leaves yet"
          />
        ) : (
          leaves.map((leave) => (
            <Card key={leave.id} style={styles.leaveCard}>
              <View style={styles.leaveHeader}>
                <View style={[styles.leaveIconChip, { backgroundColor: colors.tint + '15' }]}>
                  <Ionicons name="calendar-outline" size={20} color={colors.tint} />
                </View>
                <View style={styles.leaveInfo}>
                  <Text style={[styles.leaveType, { color: colors.text }]}>
                    {leave.leaveType}
                  </Text>
                  <Text style={[styles.leaveDate, { color: colors.textMuted }]}>
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(leave.status) + '1A',
                      borderColor: getStatusColor(leave.status) + '33',
                    },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(leave.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(leave.status) }]}>
                    {leave.status}
                  </Text>
                </View>
              </View>
              {leave.reason ? (
                <Text style={[styles.reason, { color: colors.textMuted }]} numberOfLines={2}>
                  {leave.reason}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => router.push(`/leaves/${leave.id}`)}
                style={[styles.viewButton, { borderTopColor: colors.hairline }]}
              >
                <Text style={[styles.viewButtonText, { color: colors.tint }]}>View Details</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.tint} />
              </TouchableOpacity>
            </Card>
          ))
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  leaveCard: {
    margin: 16,
    marginTop: 0,
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaveIconChip: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveInfo: {
    flex: 1,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  leaveDate: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 6 },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  reason: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  viewButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
