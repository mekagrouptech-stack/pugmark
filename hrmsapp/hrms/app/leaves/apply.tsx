/**
 * Apply Leave Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { leaveService } from '@/services/leave.service';
import { leaveApplicationSchema } from '@/utils/validation';
import { LeaveType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatDate, calculateDays } from '@/utils/helpers';
import { Picker } from '@react-native-picker/picker';

interface LeaveFormData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  [LeaveType.CL]: 'Casual Leave',
  [LeaveType.SL]: 'Sick Leave',
  [LeaveType.PL]: 'Privileged Leave',
  [LeaveType.LOP]: 'Loss Of Pay',
  [LeaveType.ML]: 'Maternity Leave',
  [LeaveType.EL]: 'Earned Leave',
};

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: yupResolver(leaveApplicationSchema),
    defaultValues: {
      leaveType: LeaveType.CL,
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const days = startDate && endDate ? calculateDays(startDate, endDate) : 0;

  const onSubmit = async (data: LeaveFormData) => {
    try {
      setLoading(true);
      await leaveService.applyLeave({
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      });
      Alert.alert('Success', 'Leave application submitted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to apply leave');
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
        <Text style={[styles.title, { color: colors.text }]}>Apply Leave</Text>
        <View style={{ width: 24 }} />
      </View>

      <Card style={styles.card}>
        <Controller
          control={control}
          name="leaveType"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Leave Type</Text>
              <View style={[styles.pickerContainer, { borderColor: colors.icon + '40' }]}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={{ color: colors.text }}
                >
                  {Object.values(LeaveType).map((type) => (
                    <Picker.Item key={type} label={LEAVE_TYPE_LABELS[type]} value={type} />
                  ))}
                </Picker>
              </View>
              {errors.leaveType && (
                <Text style={styles.error}>{errors.leaveType.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="startDate"
          render={({ field: { value } }) => (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.icon + '40' }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={[styles.dateText, { color: value ? colors.text : colors.icon }]}>
                  {value ? formatDate(value) : 'Select start date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.icon} />
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) {
                      setValue('startDate', selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
              {errors.startDate && (
                <Text style={styles.error}>{errors.startDate.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="endDate"
          render={({ field: { value } }) => (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.icon + '40' }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.dateText, { color: value ? colors.text : colors.icon }]}>
                  {value ? formatDate(value) : 'Select end date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.icon} />
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={startDate ? new Date(startDate) : new Date()}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) {
                      setValue('endDate', selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
              {errors.endDate && (
                <Text style={styles.error}>{errors.endDate.message}</Text>
              )}
            </View>
          )}
        />

        {days > 0 && (
          <View style={styles.daysContainer}>
            <Text style={[styles.daysText, { color: colors.text }]}>
              Total Days: {days}
            </Text>
          </View>
        )}

        <Controller
          control={control}
          name="reason"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Reason"
              placeholder="Enter reason for leave"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.reason?.message}
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
          )}
        />

        <Button
          title="Submit Application"
          onPress={handleSubmit(onSubmit)}
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
  card: {
    margin: 16,
    marginTop: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dateText: {
    fontSize: 16,
  },
  daysContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E6F4FE',
    borderRadius: 8,
  },
  daysText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 24,
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
