/**
 * Grievances - One grievance: details, conversation with HR, and actions
 * (reply, withdraw for the owner; status + resolution for HR).
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  grievanceService,
  Grievance,
  GrievanceStatus,
  GRIEVANCE_STATUS_COLORS,
  GRIEVANCE_PRIORITY_COLORS,
} from '@/services/grievance.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/utils/helpers';

const STATUSES: GrievanceStatus[] = ['Open', 'In Review', 'Resolved', 'Closed'];

const errorText = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback;

export default function GrievanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [g, setG] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<GrievanceStatus>('Open');
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = (data: Grievance) => {
    setG(data);
    setStatus(data.status);
    setResolution(data.resolution || '');
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      apply(await grievanceService.getOne(id));
    } catch (e: any) {
      setError(errorText(e, 'Could not load this grievance'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const sendReply = async () => {
    if (!reply.trim() || !g) return;
    setBusy(true);
    try {
      apply(await grievanceService.reply(g.id, reply.trim()));
      setReply('');
    } catch (e: any) {
      Alert.alert('Error', errorText(e, 'Could not send reply'));
    } finally {
      setBusy(false);
    }
  };

  const saveStatus = async () => {
    if (!g) return;
    setBusy(true);
    try {
      apply(await grievanceService.updateStatus(g.id, status, resolution.trim() || undefined));
      Alert.alert('Updated', `Marked ${status}`);
    } catch (e: any) {
      Alert.alert('Error', errorText(e, 'Could not update status'));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = () => {
    if (!g) return;
    Alert.alert('Withdraw grievance?', 'It will be closed and HR will be told.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            apply(await grievanceService.withdraw(g.id));
          } catch (e: any) {
            Alert.alert('Error', errorText(e, 'Could not withdraw'));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) return <Loading message="Loading grievance..." />;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>{g?.ticketNo || 'Grievance'}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (error || !g) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <EmptyState icon="alert-circle-outline" title="Unavailable" message={error || 'Not found'} />
      </View>
    );
  }

  const statusColor = GRIEVANCE_STATUS_COLORS[g.status];
  const closed = g.status === 'Closed';
  const hrView = !!g.canManage && !g.isMine;
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.icon + '40' }];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {header}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={[styles.subject, { color: colors.text }]}>{g.subject}</Text>
          <View style={styles.tags}>
            <Text style={[styles.tag, { color: statusColor, backgroundColor: statusColor + '20' }]}>{g.status}</Text>
            <Text
              style={[
                styles.tag,
                { color: GRIEVANCE_PRIORITY_COLORS[g.priority], backgroundColor: GRIEVANCE_PRIORITY_COLORS[g.priority] + '20' },
              ]}
            >
              {g.priority}
            </Text>
            <Text style={[styles.tag, { color: colors.icon, backgroundColor: colors.icon + '18' }]}>{g.category}</Text>
            {g.isAnonymous && (
              <Text style={[styles.tag, { color: colors.icon, backgroundColor: colors.icon + '18' }]}>Anonymous</Text>
            )}
          </View>
          <Text style={[styles.small, { color: colors.icon }]}>
            Raised by {g.employee?.name || 'Anonymous'}
            {g.employee?.employeeCode ? ` (${g.employee.employeeCode})` : ''} · {formatDateTime(g.createdAt)}
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>{g.description}</Text>
        </Card>

        {g.resolution ? (
          <Card style={[styles.card, { backgroundColor: '#10B98114' }]}>
            <Text style={[styles.sectionTitle, { color: '#047857' }]}>Resolution</Text>
            <Text style={[styles.body, { color: colors.text, marginTop: 4 }]}>{g.resolution}</Text>
            <Text style={[styles.small, { color: colors.icon }]}>
              {g.handledByName ? `${g.handledByName} · ` : ''}
              {g.resolvedAt ? formatDateTime(g.resolvedAt) : ''}
            </Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Conversation</Text>
          {g.replies?.length ? (
            g.replies.map((r) => (
              <View
                key={r.id}
                style={[
                  styles.bubble,
                  r.isMine ? styles.bubbleMine : styles.bubbleOther,
                  { backgroundColor: r.fromHr ? '#3B82F618' : colors.icon + '14' },
                ]}
              >
                <Text style={[styles.bubbleName, { color: r.fromHr ? '#1D4ED8' : colors.text }]}>
                  {r.isMine ? 'You' : r.userName}
                  {r.fromHr && !r.isMine ? ' (HR)' : ''}
                </Text>
                <Text style={{ color: colors.text }}>{r.message}</Text>
                <Text style={[styles.small, { color: colors.icon }]}>{formatDateTime(r.createdAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.small, { color: colors.icon, marginTop: 6 }]}>No replies yet.</Text>
          )}

          {!closed && (
            <View style={styles.replyRow}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder="Write a reply"
                placeholderTextColor={colors.icon}
                multiline
                style={[inputStyle, { flex: 1, minHeight: 44 }]}
              />
              <TouchableOpacity
                onPress={sendReply}
                disabled={busy || !reply.trim()}
                style={[styles.sendBtn, { backgroundColor: reply.trim() ? colors.tint : colors.icon + '40' }]}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {hrView && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Update status</Text>
            <View style={styles.tags}>
              {STATUSES.map((s) => {
                const active = status === s;
                const c = GRIEVANCE_STATUS_COLORS[s];
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[styles.statusChip, { borderColor: c, backgroundColor: active ? c : 'transparent' }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : c, fontWeight: '700', fontSize: 12 }}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {(status === 'Resolved' || status === 'Closed') && (
              <TextInput
                value={resolution}
                onChangeText={setResolution}
                placeholder="Resolution note shown to the employee"
                placeholderTextColor={colors.icon}
                multiline
                style={[inputStyle, { minHeight: 80, marginBottom: 12, textAlignVertical: 'top' }]}
              />
            )}
            <Button title="Save" onPress={saveStatus} loading={busy} fullWidth />
          </Card>
        )}

        {g.isMine && !closed && (
          <View style={{ paddingHorizontal: 16 }}>
            <Button title="Withdraw Grievance" variant="danger" onPress={withdraw} loading={busy} fullWidth />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: { marginHorizontal: 16, marginBottom: 12, padding: 16 },
  subject: { fontSize: 18, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  tag: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  small: { fontSize: 11, marginTop: 4 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  bubble: { marginTop: 10, padding: 10, borderRadius: 12, maxWidth: '88%' },
  bubbleMine: { alignSelf: 'flex-end' },
  bubbleOther: { alignSelf: 'flex-start' },
  bubbleName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
});
