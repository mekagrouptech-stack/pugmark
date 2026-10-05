/**
 * Employees on Leave Today Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { leaveService } from '@/services/leave.service';
import { Leave } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/utils/helpers';

export default function EmployeesOnLeaveScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeesOnLeave();
  }, []);

  const loadEmployeesOnLeave = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await leaveService.getLeaves({
        status: 'APPROVED',
        startDate: today,
        endDate: today,
        limit: 100,
      });
      
      setLeaves(response.data);
    } catch (error) {
      console.error('Error loading employees on leave:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading employees on leave..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leave of Employees</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {leaves.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No employees on leave</Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              There are no employees on leave today
            </Text>
          </Card>
        ) : (
          leaves.map((leave) => (
            <Card key={leave.id} style={styles.leaveCard}>
              <View style={styles.leaveRow}>
                <Avatar
                  firstName={leave.employeeName.split(' ')[0]}
                  lastName={leave.employeeName.split(' ')[1] || ''}
                  size={60}
                />
                <View style={styles.leaveInfo}>
                  <Text style={[styles.employeeName, { color: colors.text }]}>
                    {leave.employeeName}
                  </Text>
                  <View style={styles.leaveDetails}>
                    <View style={styles.leaveDetailRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.icon} />
                      <Text style={[styles.leaveDetailText, { color: colors.icon }]}>
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </Text>
                    </View>
                    <View style={styles.leaveDetailRow}>
                      <Ionicons name="time-outline" size={16} color={colors.icon} />
                      <Text style={[styles.leaveDetailText, { color: colors.icon }]}>
                        {leave.days} Day{leave.days !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.leaveDetailRow}>
                      <Ionicons name="document-text-outline" size={16} color={colors.icon} />
                      <Text style={[styles.leaveTypeText, { color: '#EC4899' }]}>
                        {leave.leaveType}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.leaveIcon, { backgroundColor: '#EC489920' }]}>
                  <Ionicons name="calendar" size={24} color="#EC4899" />
                </View>
              </View>
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
  leaveCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveInfo: {
    flex: 1,
    marginLeft: 16,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  leaveDetails: {
    gap: 6,
  },
  leaveDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveDetailText: {
    fontSize: 14,
  },
  leaveTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  leaveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    margin: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
