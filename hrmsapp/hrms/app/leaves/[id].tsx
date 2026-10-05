/**
 * Leave Details Screen
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { leaveService } from '@/services/leave.service';
import { Leave } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatDate, calculateDays } from '@/utils/helpers';

export default function LeaveDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadLeave();
  }, [id]);

  const loadLeave = async () => {
    try {
      const data = await leaveService.getLeaveById(id);
      setLeave(data);
    } catch (error) {
      console.error('Error loading leave:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!leave) return;

    Alert.alert('Approve Leave', 'Are you sure you want to approve this leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setProcessing(true);
            await leaveService.approveLeave(leave.id);
            Alert.alert('Success', 'Leave approved successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to approve leave');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!leave) return;

    Alert.prompt(
      'Reject Leave',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Please provide a reason for rejection');
              return;
            }
            try {
              setProcessing(true);
              await leaveService.rejectLeave(leave.id, reason);
              Alert.alert('Success', 'Leave rejected successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject leave');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading) {
    return <Loading message="Loading leave details..." />;
  }

  if (!leave) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Leave not found</Text>
      </View>
    );
  }

  const days = calculateDays(leave.startDate, leave.endDate);
  const leaveAvailable = 10; // This would come from leave balance

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leave Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Employee Info Card */}
        <Card style={styles.card}>
          <View style={styles.employeeInfo}>
            <Avatar
              firstName={leave.employeeName.split(' ')[0]}
              lastName={leave.employeeName.split(' ')[1]}
              size={60}
            />
            <View style={styles.employeeDetails}>
              <Text style={[styles.employeeName, { color: colors.text }]}>
                {leave.employeeName}
              </Text>
              <Text style={[styles.leaveDateRange, { color: colors.icon }]}>
                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
              </Text>
              <Text style={[styles.leaveApplication, { color: colors.icon }]}>
                Leave Application
              </Text>
            </View>
            <View style={styles.statusSection}>
              <Text style={[styles.timeAgo, { color: colors.icon }]}>2 Days Ago</Text>
              <StatusBadge
                status={leave.status.toLowerCase() as any}
                size="small"
              />
            </View>
          </View>
        </Card>

        {/* Leave Duration Card */}
        <Card style={styles.card}>
          <View style={[styles.durationBox, { backgroundColor: colors.tint + '20' }]}>
            <Text style={[styles.durationValue, { color: colors.tint }]}>{days} Days</Text>
          </View>
          <Text style={[styles.leaveAvailable, { color: colors.text }]}>
            {leaveAvailable} Leave Available
          </Text>
        </Card>

        {/* Reason Section */}
        <Card style={styles.card}>
          <Text style={[styles.reasonLabel, { color: colors.text }]}>Reason:</Text>
          <Text style={[styles.reasonText, { color: colors.icon }]}>{leave.reason}</Text>
        </Card>

        {/* Action Buttons */}
        {leave.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              onPress={handleReject}
              variant="outline"
              style={[styles.actionButton, { borderColor: colors.error }]}
              textStyle={{ color: colors.error }}
              disabled={processing}
            />
            <Button
              title="Approve"
              onPress={handleApprove}
              variant="primary"
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              disabled={processing}
              loading={processing}
            />
          </View>
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
  card: {
    margin: 16,
    marginTop: 0,
    padding: 20,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeDetails: {
    flex: 1,
    marginLeft: 16,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  leaveDateRange: {
    fontSize: 14,
    marginBottom: 2,
  },
  leaveApplication: {
    fontSize: 12,
  },
  statusSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timeAgo: {
    fontSize: 12,
  },
  durationBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  durationValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  leaveAvailable: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
