/**
 * DAR Create Screen - Create Daily Activity Report
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { darService } from '@/services/dar.service';
import { DARCreateRequest, DARTaskCategory } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/utils/helpers';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validation schema
const darCreateSchema = yup.object().shape({
  date: yup.string().required('Date is required'),
  projectName: yup.string(),
  workLocation: yup.string(),
  activityDescription: yup.string().required('Activity description is required').min(10, 'Description must be at least 10 characters'),
  taskCategory: yup.string().oneOf(Object.values(DARTaskCategory)).required('Task category is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  remarks: yup.string(),
  issuesFaced: yup.string(),
});

interface DARFormData {
  date: string;
  projectName: string;
  workLocation: string;
  activityDescription: string;
  taskCategory: DARTaskCategory;
  startTime: string;
  endTime: string;
  remarks: string;
  issuesFaced: string;
}

const DRAFT_STORAGE_KEY = 'dar_draft';

export default function CreateDARScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<DARFormData>({
    resolver: yupResolver(darCreateSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      projectName: '',
      workLocation: '',
      activityDescription: '',
      taskCategory: DARTaskCategory.EXECUTION,
      startTime: '09:00',
      endTime: '17:00',
      remarks: '',
      issuesFaced: '',
    },
  });

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftData) {
        const draft = JSON.parse(draftData);
        Object.keys(draft).forEach((key) => {
          setValue(key as keyof DARFormData, draft[key]);
        });
        if (draft.date) {
          setSelectedDate(new Date(draft.date));
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    try {
      setSavingDraft(true);
      const formData = getValues();
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const addressString = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: addressString || 'Current Location',
      });
      setValue('workLocation', addressString || 'Current Location');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const calculateTotalHours = (start: string, end: string): number => {
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return Math.round((diffMinutes / 60) * 10) / 10;
  };

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const totalHours = startTime && endTime ? calculateTotalHours(startTime, endTime) : 0;

  const onSubmit = async (data: DARFormData, isDraft: boolean = false) => {
    try {
      setLoading(true);

      const darData: DARCreateRequest = {
        date: data.date,
        projectName: data.projectName || undefined,
        workLocation: data.workLocation || undefined,
        workLocationLatitude: location?.latitude,
        workLocationLongitude: location?.longitude,
        activityDescription: data.activityDescription,
        taskCategory: data.taskCategory,
        startTime: data.startTime,
        endTime: data.endTime,
        remarks: data.remarks || undefined,
        issuesFaced: data.issuesFaced || undefined,
      };

      if (isDraft) {
        await saveDraft();
        Alert.alert('Success', 'Draft saved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const dar = await darService.create(darData, user?.id);
        // Clear draft after successful submission
        await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
        
        Alert.alert(
          'Success',
          'DAR submitted successfully',
          [
            {
              text: 'View DAR',
              onPress: () => router.push(`/dar/${dar.id}`),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create DAR');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDAR = () => {
    Alert.alert(
      'Submit DAR',
      'Are you sure you want to submit this Daily Activity Report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => handleSubmit((data) => onSubmit(data, false))(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create DAR</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Employee Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Name:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Employee ID:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.id || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Department:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.department || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Designation:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.designation || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Reporting Manager:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.reportingManagerName || 'N/A'}
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Details</Text>

          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: colors.icon + '40', backgroundColor: colors.background }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {value ? formatDate(value) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {errors.date && <Text style={styles.error}>{errors.date.message}</Text>}
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) {
                        setSelectedDate(date);
                        onChange(date.toISOString().split('T')[0]);
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="projectName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Project / Site Name"
                placeholder="Enter project or site name"
                value={value}
                onChangeText={onChange}
                error={errors.projectName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="workLocation"
            render={({ field: { onChange, value } }) => (
              <View>
                <View style={styles.locationRow}>
                  <Input
                    label="Work Location"
                    placeholder="Enter work location or use GPS"
                    value={value}
                    onChangeText={onChange}
                    error={errors.workLocation?.message}
                    containerStyle={{ flex: 1 }}
                  />
                  <TouchableOpacity
                    style={[styles.gpsButton, { backgroundColor: colors.tint }]}
                    onPress={getCurrentLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <Loading message="" />
                    ) : (
                      <Ionicons name="location" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
                {location && (
                  <Text style={[styles.locationText, { color: colors.icon }]}>
                    GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="taskCategory"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Task Category *</Text>
                <View style={[styles.pickerContainer, { borderColor: colors.icon + '40', backgroundColor: colors.background }]}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={[styles.picker, { color: colors.text }]}
                  >
                    {Object.values(DARTaskCategory).map((category) => (
                      <Picker.Item
                        key={category}
                        label={category.replace('_', ' ')}
                        value={category}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.taskCategory && <Text style={styles.error}>{errors.taskCategory.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="activityDescription"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Activity Description *</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.activityDescription ? '#EF4444' : colors.icon + '40',
                      color: colors.text,
                    },
                  ]}
                  placeholder="Describe your daily activities in detail..."
                  placeholderTextColor={colors.icon}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                {errors.activityDescription && (
                  <Text style={styles.error}>{errors.activityDescription.message}</Text>
                )}
              </View>
            )}
          />

          <View style={styles.timeRow}>
            <Controller
              control={control}
              name="startTime"
              render={({ field: { onChange, value } }) => (
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Start Time *</Text>
                  <TouchableOpacity
                    style={[styles.timeButton, { borderColor: colors.icon + '40', backgroundColor: colors.background }]}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.icon} />
                    <Text style={[styles.timeText, { color: colors.text }]}>{value || 'HH:mm'}</Text>
                  </TouchableOpacity>
                  {errors.startTime && <Text style={styles.error}>{errors.startTime.message}</Text>}
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={selectedStartTime}
                      mode="time"
                      display="default"
                      onChange={(event, time) => {
                        setShowStartTimePicker(Platform.OS === 'ios');
                        if (time) {
                          setSelectedStartTime(time);
                          const hours = time.getHours().toString().padStart(2, '0');
                          const minutes = time.getMinutes().toString().padStart(2, '0');
                          onChange(`${hours}:${minutes}`);
                        }
                      }}
                    />
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="endTime"
              render={({ field: { onChange, value } }) => (
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: colors.text }]}>End Time *</Text>
                  <TouchableOpacity
                    style={[styles.timeButton, { borderColor: colors.icon + '40', backgroundColor: colors.background }]}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.icon} />
                    <Text style={[styles.timeText, { color: colors.text }]}>{value || 'HH:mm'}</Text>
                  </TouchableOpacity>
                  {errors.endTime && <Text style={styles.error}>{errors.endTime.message}</Text>}
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={selectedEndTime}
                      mode="time"
                      display="default"
                      onChange={(event, time) => {
                        setShowEndTimePicker(Platform.OS === 'ios');
                        if (time) {
                          setSelectedEndTime(time);
                          const hours = time.getHours().toString().padStart(2, '0');
                          const minutes = time.getMinutes().toString().padStart(2, '0');
                          onChange(`${hours}:${minutes}`);
                        }
                      }}
                    />
                  )}
                </View>
              )}
            />
          </View>

          {totalHours > 0 && (
            <View style={[styles.totalHoursContainer, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[styles.totalHoursLabel, { color: colors.tint }]}>Total Hours:</Text>
              <Text style={[styles.totalHoursValue, { color: colors.tint }]}>{totalHours} hrs</Text>
            </View>
          )}

          <Controller
            control={control}
            name="remarks"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Remarks</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.icon + '40',
                      color: colors.text,
                    },
                  ]}
                  placeholder="Any additional remarks..."
                  placeholderTextColor={colors.icon}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="issuesFaced"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Issues Faced</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.icon + '40',
                      color: colors.text,
                    },
                  ]}
                  placeholder="Describe any issues or challenges faced..."
                  placeholderTextColor={colors.icon}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Draft"
            onPress={() => handleSubmit((data) => onSubmit(data, true))()}
            variant="outline"
            loading={savingDraft}
            disabled={loading}
            style={styles.button}
          />
          <Button
            title="Submit DAR"
            onPress={handleSubmitDAR}
            variant="primary"
            loading={loading}
            disabled={savingDraft}
            style={styles.button}
          />
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  gpsButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  picker: {
    height: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
  },
  totalHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalHoursLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalHoursValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
