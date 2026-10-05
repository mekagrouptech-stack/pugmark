/**
 * Payroll Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { payrollService } from '@/services/payroll.service';
import { Payroll } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function PayrollScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = async () => {
    try {
      const response = await payrollService.getPayrolls({ limit: 20 });
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error loading payrolls:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayrolls();
  };

  const handleDownloadPayslip = async (id: number) => {
    try {
      const response = await payrollService.downloadPayslip(id);
      // Handle payslip download
      Alert.alert('Success', 'Payslip download started');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download payslip');
    }
  };

  if (loading) {
    return <Loading message="Loading payroll..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Payroll</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {payrolls.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No Payroll Records"
            message="No payroll records found"
          />
        ) : (
          payrolls.map((payroll) => (
            <Card key={payroll.id} style={styles.payrollCard}>
              <View style={styles.payrollHeader}>
                <View>
                  <Text style={[styles.monthYear, { color: colors.text }]}>
                    {new Date(payroll.payrollYear, payroll.payrollMonth - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.employeeName, { color: colors.icon }]}>
                    {payroll.user?.name ?? ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
                  <Text style={[styles.statusText, { color: '#10B981' }]}>
                    {payroll.status}
                  </Text>
                </View>
              </View>

              {/* Salary structure breakup — identical components to the salary
                  slip, prorated by attendance for this month. */}
              <View style={styles.salaryBreakup}>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.icon }]}>Basic</Text>
                  <Text style={[styles.salaryValue, { color: colors.text }]}>
                    {formatCurrency(payroll.basic ?? 0)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.icon }]}>HRA</Text>
                  <Text style={[styles.salaryValue, { color: colors.text }]}>
                    {formatCurrency(payroll.hra ?? 0)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.icon }]}>Special Allowance</Text>
                  <Text style={[styles.salaryValue, { color: colors.text }]}>
                    {formatCurrency(payroll.specialAllowance ?? 0)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.icon }]}>Bonus</Text>
                  <Text style={[styles.salaryValue, { color: colors.text }]}>
                    {formatCurrency(payroll.bonus ?? 0)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.icon }]}>Gross Earned</Text>
                  <Text style={[styles.salaryValue, { color: colors.text }]}>
                    {formatCurrency(payroll.grossEarned ?? payroll.finalSalary)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.icon }]}>Deductions</Text>
                  <Text style={[styles.salaryValue, { color: '#EF4444' }]}>
                    -{formatCurrency(payroll.totalDeductions ?? 0)}
                  </Text>
                </View>
                <View style={[styles.salaryRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Net Payable</Text>
                  <Text style={[styles.totalValue, { color: colors.tint }]}>
                    {formatCurrency(payroll.netPayable ?? payroll.finalSalary)}
                  </Text>
                </View>
              </View>

              <View style={styles.attendanceInfo}>
                <Text style={[styles.attendanceLabel, { color: colors.icon }]}>
                  Attendance: {payroll.fullDays} Present, {payroll.absentDays} Absent,{' '}
                  {payroll.halfDays} Half Day
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: colors.tint + '20' }]}
                onPress={() => handleDownloadPayslip(payroll.id)}
              >
                <Ionicons name="download-outline" size={20} color={colors.tint} />
                <Text style={[styles.downloadText, { color: colors.tint }]}>
                  Download Payslip
                </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  payrollCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
  },
  payrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
  },
  employeeName: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  salaryBreakup: {
    marginBottom: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  salaryLabel: {
    fontSize: 14,
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  attendanceInfo: {
    marginBottom: 16,
  },
  attendanceLabel: {
    fontSize: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
