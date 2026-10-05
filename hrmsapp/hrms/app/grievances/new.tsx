/**
 * Grievances - Raise a new grievance
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { grievanceService, GrievancePriority } from '@/services/grievance.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const FALLBACK_CATEGORIES = ['Other'];
const PRIORITIES: GrievancePriority[] = ['Low', 'Medium', 'High'];

export default function NewGrievanceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [category, setCategory] = useState('Other');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GrievancePriority>('Medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    grievanceService
      .getMeta()
      .then((meta) => {
        if (meta.categories?.length) setCategories(meta.categories);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Subject required', 'Please enter a short subject.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Details required', 'Please describe your grievance.');
      return;
    }
    setLoading(true);
    try {
      const created = await grievanceService.create({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      Alert.alert('Submitted', `Your grievance ${created.ticketNo} has been sent to HR.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to submit grievance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Raise Grievance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <View style={[styles.pickerWrap, { borderColor: colors.icon + '40' }]}>
            <Picker selectedValue={category} onValueChange={(v) => setCategory(String(v))} style={{ color: colors.text }}>
              {categories.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>

          <Input
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="A short title for your concern"
            maxLength={255}
          />

          <Input
            label="Details"
            value={description}
            onChangeText={setDescription}
            placeholder="What happened, when, and who was involved"
            multiline
            numberOfLines={6}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />

          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          <View style={styles.chips}>
            {PRIORITIES.map((p) => {
              const active = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.chip,
                    { borderColor: active ? colors.tint : colors.icon + '40', backgroundColor: active ? colors.tint : 'transparent' },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '600' }}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={{ paddingHorizontal: 16 }}>
          <Button title="Submit Grievance" onPress={onSubmit} loading={loading} fullWidth />
        </View>
      </ScrollView>
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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});
