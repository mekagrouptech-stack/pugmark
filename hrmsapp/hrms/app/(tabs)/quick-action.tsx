/**
 * Quick Action Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';

export default function QuickActionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const quickActions = [
    {
      icon: 'time-outline',
      title: 'My Attendance',
      onPress: () => router.push('/attendance/list'),
    },
    {
      icon: 'calendar-outline',
      title: 'Apply Leave',
      onPress: () => router.push('/leaves/apply'),
    },
    {
      icon: 'document-text-outline',
      title: 'Create DAR',
      onPress: () => router.push('/dar/create'),
    },
    {
      icon: 'list-outline',
      title: 'View DARs',
      onPress: () => router.push('/dar/list'),
    },
    {
      icon: 'cash-outline',
      title: 'My Salary',
      onPress: () => router.push('/salary'),
    },
    {
      icon: 'document-text-outline',
      title: 'View Payslip',
      onPress: () => router.push('/payroll'),
    },
    {
      icon: 'receipt-outline',
      title: 'Reimbursements',
      onPress: () => router.push('/reimbursements'),
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Raise Grievance',
      onPress: () => router.push('/grievances/new'),
    },
    {
      icon: 'people-outline',
      title: 'Employees',
      onPress: () => router.push('/employees'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Quick Actions</Text>
      </View>

      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, { backgroundColor: colors.background }]}
            onPress={action.onPress}
          >
            <Ionicons name={action.icon as any} size={32} color={colors.tint} />
            <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  actionCard: {
    width: '47%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
