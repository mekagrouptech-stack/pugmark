/**
 * My Salary - Salary slip / structure
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { salaryService, MySalary } from '@/services/salary.service';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/helpers';

export default function MySalaryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [salary, setSalary] = useState<MySalary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await salaryService.getMySalary();
      setSalary(data);
    } catch (error) {
      console.error('Error loading salary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return <Loading message="Loading salary..." />;
  }

  const Row = ({
    label,
    monthly,
    annual,
    strong,
    negative,
  }: {
    label: string;
    monthly: number;
    annual?: number;
    strong?: boolean;
    negative?: boolean;
  }) => (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: strong ? colors.text : colors.icon },
          strong && styles.strong,
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowValues}>
        <Text
          style={[
            styles.rowMonthly,
            { color: negative ? '#EF4444' : colors.text },
            strong && styles.strong,
          ]}
        >
          {negative ? '-' : ''}
          {formatCurrency(monthly)}
        </Text>
        {annual !== undefined && (
          <Text style={[styles.rowAnnual, { color: colors.icon }]}>
            {formatCurrency(annual)}/yr
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Salary</Text>
        <View style={{ width: 24 }} />
      </View>

      {!salary || !salary.hasStructure ? (
        <EmptyState
          icon="cash-outline"
          title="No Salary Structure"
          message="Your salary structure has not been configured yet. Please contact HR."
        />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Headline */}
          <Card style={[styles.card, styles.heroCard, { backgroundColor: colors.tint }]}>
            <Text style={styles.heroName}>{salary.employee.name ?? '-'}</Text>
            <Text style={styles.heroSub}>
              {[salary.employee.designation, salary.employee.employeeCode]
                .filter(Boolean)
                .join(' · ') || '-'}
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroBox}>
                <Text style={styles.heroBoxLabel}>Take Home</Text>
                <Text style={styles.heroBoxValue}>
                  {formatCurrency(salary.takeHomeMonthly)}
                </Text>
                <Text style={styles.heroBoxSub}>per month</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroBox}>
                <Text style={styles.heroBoxLabel}>Annual CTC</Text>
                <Text style={styles.heroBoxValue}>{formatCurrency(salary.annualCTC)}</Text>
                <Text style={styles.heroBoxSub}>per year</Text>
              </View>
            </View>
          </Card>

          {/* Earnings */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings</Text>
            {salary.earnings
              .filter((e) => e.monthly > 0)
              .map((e) => (
                <Row key={e.key} label={e.label} monthly={e.monthly} annual={e.annual} />
              ))}
            <View style={[styles.divider, { borderTopColor: colors.icon + '30' }]} />
            <Row
              label="Gross Salary"
              monthly={salary.grossSalary.monthly}
              annual={salary.grossSalary.annual}
              strong
            />
          </Card>

          {/* Deductions */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Deductions</Text>
            <Row
              label="Employee PF"
              monthly={salary.net.employeePF.monthly}
              annual={salary.net.employeePF.annual}
              negative
            />
            <Row
              label="Professional Tax"
              monthly={salary.net.professionalTax.monthly}
              annual={salary.net.professionalTax.annual}
              negative
            />
            <View style={[styles.divider, { borderTopColor: colors.icon + '30' }]} />
            <Row
              label="Net Salary (Take Home)"
              monthly={salary.net.netSalary.monthly}
              annual={salary.net.netSalary.annual}
              strong
            />
          </Card>

          {/* Cost to Company */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cost to Company</Text>
            <Row
              label="Gross Salary"
              monthly={salary.grossSalary.monthly}
              annual={salary.grossSalary.annual}
            />
            <Row
              label="Gratuity"
              monthly={salary.gratuity.monthly}
              annual={salary.gratuity.annual}
            />
            <Row
              label="Employer PF"
              monthly={salary.employerPF.monthly}
              annual={salary.employerPF.annual}
            />
            <View style={[styles.divider, { borderTopColor: colors.icon + '30' }]} />
            <Row
              label="Total CTC"
              monthly={salary.totalCTCRow.monthly}
              annual={salary.totalCTCRow.annual}
              strong
            />
          </Card>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  card: { margin: 16, marginTop: 0, padding: 18 },
  heroCard: { paddingVertical: 22 },
  heroName: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  heroSub: { color: '#FFFFFFCC', fontSize: 13, marginTop: 2 },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  heroBox: { flex: 1 },
  heroDivider: { width: 1, height: 42, backgroundColor: '#FFFFFF33', marginHorizontal: 12 },
  heroBoxLabel: { color: '#FFFFFFCC', fontSize: 12 },
  heroBoxValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 2 },
  heroBoxSub: { color: '#FFFFFF99', fontSize: 11, marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: { fontSize: 14, flexShrink: 1 },
  rowValues: { alignItems: 'flex-end' },
  rowMonthly: { fontSize: 14, fontWeight: '600' },
  rowAnnual: { fontSize: 11, marginTop: 1 },
  strong: { fontWeight: '700', fontSize: 15 },
  divider: { borderTopWidth: 1, marginBottom: 12 },
});
