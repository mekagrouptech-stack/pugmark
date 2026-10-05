/**
 * Reimbursements - New Request
 */

import React, { useMemo, useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  reimbursementService,
  REIMBURSEMENT_TYPES,
  ReimbursementExpenseItem,
} from '@/services/reimbursement.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatDate, formatCurrency } from '@/utils/helpers';

type ExpenseRow = { date: string; amount: string; purpose: string };

const emptyRow = (): ExpenseRow => ({ date: '', amount: '', purpose: '' });

export default function ApplyReimbursementScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [requestType, setRequestType] = useState<string>(REIMBURSEMENT_TYPES[0]);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [rows, setRows] = useState<ExpenseRow[]>([emptyRow()]);
  const [picker, setPicker] = useState<null | 'from' | 'to'>(null);
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    [rows]
  );

  const updateRow = (index: number, patch: Partial<ExpenseRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const onSubmit = async () => {
    if (!periodFrom || !periodTo) {
      Alert.alert('Missing dates', 'Please select the claim period (from and to).');
      return;
    }
    if (total <= 0) {
      Alert.alert('No amount', 'Add at least one expense item with an amount.');
      return;
    }
    const expenseDetails: ReimbursementExpenseItem[] = rows
      .filter((r) => (parseFloat(r.amount) || 0) > 0)
      .map((r) => ({
        type: requestType,
        date: r.date || periodFrom,
        amount: parseFloat(r.amount) || 0,
        purpose: r.purpose || null,
      }));

    try {
      setLoading(true);
      await reimbursementService.create({
        requestType,
        periodFrom,
        periodTo,
        totalAmount: total,
        expenseDetails,
      });
      Alert.alert('Submitted', 'Reimbursement request submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Reimbursement</Text>
        <View style={{ width: 24 }} />
      </View>

      <Card style={styles.card}>
        <Text style={[styles.label, { color: colors.text }]}>Type</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.icon + '40' }]}>
          <Picker
            selectedValue={requestType}
            onValueChange={setRequestType}
            style={{ color: colors.text }}
          >
            {REIMBURSEMENT_TYPES.map((t) => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={[styles.label, { color: colors.text }]}>Period From</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.icon + '40' }]}
              onPress={() => setPicker('from')}
            >
              <Text style={{ color: periodFrom ? colors.text : colors.icon }}>
                {periodFrom ? formatDate(periodFrom) : 'Select'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
          </View>
          <View style={styles.dateCol}>
            <Text style={[styles.label, { color: colors.text }]}>Period To</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.icon + '40' }]}
              onPress={() => setPicker('to')}
            >
              <Text style={{ color: periodTo ? colors.text : colors.icon }}>
                {periodTo ? formatDate(periodTo) : 'Select'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {picker && (
          <DateTimePicker
            value={
              picker === 'from'
                ? periodFrom
                  ? new Date(periodFrom)
                  : new Date()
                : periodTo
                ? new Date(periodTo)
                : new Date()
            }
            mode="date"
            display="default"
            onChange={(_, selected) => {
              const which = picker;
              setPicker(null);
              if (selected) {
                const iso = selected.toISOString().split('T')[0];
                if (which === 'from') setPeriodFrom(iso);
                else setPeriodTo(iso);
              }
            }}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Items</Text>
          <TouchableOpacity onPress={addRow} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={colors.tint} />
            <Text style={[styles.addText, { color: colors.tint }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {rows.map((row, index) => (
          <View key={index} style={[styles.itemRow, { borderColor: colors.icon + '20' }]}>
            <View style={styles.itemRowHead}>
              <Text style={[styles.itemIndex, { color: colors.icon }]}>Item {index + 1}</Text>
              {rows.length > 1 && (
                <TouchableOpacity onPress={() => removeRow(index)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
            <Input
              label="Purpose"
              placeholder="e.g. Client visit cab fare"
              value={row.purpose}
              onChangeText={(v) => updateRow(index, { purpose: v })}
            />
            <Input
              label="Amount"
              placeholder="0"
              keyboardType="numeric"
              value={row.amount}
              onChangeText={(v) => updateRow(index, { amount: v.replace(/[^0-9.]/g, '') })}
            />
          </View>
        ))}

        <View style={[styles.totalRow, { borderTopColor: colors.icon + '30' }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.tint }]}>
            {formatCurrency(total)}
          </Text>
        </View>

        <Button
          title="Submit Request"
          onPress={onSubmit}
          variant="primary"
          fullWidth
          loading={loading}
          style={styles.submitButton}
        />
      </Card>
    </ScrollView>
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
  card: { margin: 16, marginTop: 0 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateCol: { flex: 1 },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  addText: { fontSize: 14, fontWeight: '600' },
  itemRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  itemRowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemIndex: { fontSize: 12, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  submitButton: { marginTop: 20 },
});
