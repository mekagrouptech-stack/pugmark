/**
 * Grievances — my grievances, and (for HR) every employee's.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  grievanceService,
  Grievance,
  GrievanceStats,
  GRIEVANCE_STATUS_COLORS,
  GRIEVANCE_PRIORITY_COLORS,
} from '@/services/grievance.service';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { GrievanceStatsCard } from '@/components/grievances/GrievanceStatsCard';
import { formatDate } from '@/utils/helpers';

type View_ = 'mine' | 'all';

export default function GrievancesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [canManage, setCanManage] = useState(false);
  const [view, setView] = useState<View_>('mine');
  const [mine, setMine] = useState<Grievance[]>([]);
  const [all, setAll] = useState<Grievance[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [myStats, setMyStats] = useState<GrievanceStats | null>(null);
  const [allStats, setAllStats] = useState<GrievanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const meta = await grievanceService.getMeta();
      setCanManage(meta.canManage);
      setMine(await grievanceService.getMine());
      setMyStats(await grievanceService.getStats('mine').catch(() => null));
      if (meta.canManage) {
        const { list, counts } = await grievanceService.getAll();
        setAll(list);
        setOpenCount(counts.Open || 0);
        setAllStats(await grievanceService.getStats('all').catch(() => null));
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load grievances');
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

  if (loading) return <Loading message="Loading grievances..." />;

  const list = view === 'all' && canManage ? all : mine;
  const stats = view === 'all' && canManage ? allStats : myStats;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Grievances</Text>
        <TouchableOpacity onPress={() => router.push('/grievances/new')}>
          <Ionicons name="add-circle" size={26} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {canManage && (
        <View style={[styles.segment, { backgroundColor: colors.cardBackground }]}>
          {(['all', 'mine'] as View_[]).map((key) => {
            const active = view === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.segmentItem, active && { backgroundColor: colors.tint }]}
                onPress={() => setView(key)}
              >
                <Text style={[styles.segmentText, { color: active ? '#FFFFFF' : colors.text }]}>
                  {key === 'all' ? `All${openCount ? ` (${openCount} open)` : ''}` : 'My Grievances'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {!error && stats ? <GrievanceStatsCard stats={stats} /> : null}
        {error ? (
          <EmptyState icon="alert-circle-outline" title="Something went wrong" message={error} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title={view === 'all' ? 'No grievances raised' : 'No grievances yet'}
            message={view === 'all' ? 'Grievances raised by employees appear here.' : 'Tap + to raise a concern with HR.'}
          />
        ) : (
          list.map((g) => {
            const statusColor = GRIEVANCE_STATUS_COLORS[g.status] ?? colors.icon;
            return (
              <TouchableOpacity key={g.id} activeOpacity={0.8} onPress={() => router.push(`/grievances/${g.id}` as any)}>
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.ticket, { color: colors.tint }]}>{g.ticketNo}</Text>
                      <Text style={[styles.subject, { color: colors.text }]} numberOfLines={2}>
                        {g.subject}
                      </Text>
                      <Text style={[styles.meta, { color: colors.icon }]}>{g.category}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>{g.status}</Text>
                    </View>
                  </View>
                  <View style={styles.footer}>
                    <Text style={[styles.meta, { color: GRIEVANCE_PRIORITY_COLORS[g.priority] }]}>
                      {g.priority} priority
                    </Text>
                    {view === 'all' && (
                      <Text style={[styles.meta, { color: colors.icon }]} numberOfLines={1}>
                        {g.isAnonymous && !g.employee?.id ? 'Anonymous' : g.employee?.name || '—'}
                      </Text>
                    )}
                    <Text style={[styles.meta, { color: colors.icon }]}>
                      {formatDate(g.createdAt)}
                      {g.replyCount ? ` · ${g.replyCount} repl${g.replyCount === 1 ? 'y' : 'ies'}` : ''}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
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
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    padding: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  card: { marginHorizontal: 16, marginBottom: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ticket: { fontSize: 12, fontWeight: '700' },
  subject: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  meta: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
});
