/**
 * Grievance dashboard for the app: the viewer's own record ('mine') or, for HR,
 * the company-wide figures with each HR member's performance ('all').
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { GrievanceStats, formatHours } from '@/services/grievance.service';

interface Props {
  stats: GrievanceStats;
}

const WITHIN = [
  { key: '24h', label: '≤ 24 hours', color: '#16A34A' },
  { key: '3d', label: '1 – 3 days', color: '#2563EB' },
  { key: '7d', label: '3 – 7 days', color: '#F59E0B' },
  { key: 'over7d', label: '> 7 days', color: '#DC2626' },
] as const;

export function GrievanceStatsCard({ stats }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const all = stats.scope === 'all';
  const solvedTotal = Object.values(stats.resolvedWithin).reduce((s, n) => s + n, 0);

  const tiles = [
    { icon: 'document-text-outline', color: '#2563EB', label: all ? 'Total raised' : 'I raised', value: String(stats.total) },
    {
      icon: 'hourglass-outline',
      color: '#F59E0B',
      label: 'Pending',
      value: String(stats.pending),
      note: `${stats.byStatus.Open} open · ${stats.byStatus['In Review']} in review`,
    },
    {
      icon: 'checkmark-circle-outline',
      color: '#16A34A',
      label: 'Solved',
      value: String(stats.solved),
      note: `${stats.solveRate}% of all${stats.withdrawn ? ` · ${stats.withdrawn} withdrawn` : ''}`,
    },
    {
      icon: 'time-outline',
      color: '#7C3AED',
      label: 'Avg time to solve',
      value: formatHours(stats.avgResolutionHours),
      note: stats.medianResolutionHours !== null ? `median ${formatHours(stats.medianResolutionHours)}` : 'nothing solved yet',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      color: '#0891B2',
      label: 'Avg first HR reply',
      value: formatHours(stats.avgFirstResponseHours),
      note: stats.awaitingFirstResponse ? `${stats.awaitingFirstResponse} awaiting reply` : 'all answered',
    },
    {
      icon: 'flash-outline',
      color: '#BE185D',
      label: 'Fastest solve',
      value: formatHours(stats.fastestResolutionHours),
      note:
        stats.slowestResolutionHours !== null
          ? `slowest ${formatHours(stats.slowestResolutionHours)}`
          : stats.oldestPendingDays !== null
            ? `oldest pending ${stats.oldestPendingDays}d`
            : '',
    },
  ];

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
      <Text style={[styles.heading, { color: colors.icon }]}>
        {all ? 'GRIEVANCE DASHBOARD — ALL EMPLOYEES' : 'MY GRIEVANCE DASHBOARD'}
      </Text>

      <View style={styles.grid}>
        {tiles.map((t) => (
          <Card key={t.label} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: t.color + '18' }]}>
              <Ionicons name={t.icon as any} size={16} color={t.color} />
            </View>
            <Text style={[styles.tileLabel, { color: colors.icon }]}>{t.label}</Text>
            <Text style={[styles.tileValue, { color: t.color }]}>{t.value}</Text>
            {t.note ? (
              <Text style={[styles.tileNote, { color: colors.icon }]} numberOfLines={1}>
                {t.note}
              </Text>
            ) : null}
          </Card>
        ))}
      </View>

      <Card style={styles.block}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>How fast they were solved</Text>
        {solvedTotal === 0 ? (
          <Text style={[styles.tileNote, { color: colors.icon }]}>Nothing solved yet</Text>
        ) : (
          WITHIN.map((w) => {
            const n = stats.resolvedWithin[w.key];
            return (
              <View key={w.key} style={{ marginTop: 8 }}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: colors.text, fontSize: 12 }}>{w.label}</Text>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{n}</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.icon + '20' }]}>
                  <View style={[styles.barFill, { width: `${(n / solvedTotal) * 100}%`, backgroundColor: w.color }]} />
                </View>
              </View>
            );
          })
        )}
        {stats.oldestPendingDays !== null && (
          <Text style={{ color: '#B45309', fontSize: 12, marginTop: 8 }}>
            Oldest pending ticket: {stats.oldestPendingDays} day{stats.oldestPendingDays === 1 ? '' : 's'} old
          </Text>
        )}
      </Card>

      {stats.byCategory.length > 0 && (
        <Card style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>By category</Text>
          {stats.byCategory.map((c) => (
            <View key={c.category} style={[styles.rowBetween, styles.tableRow, { borderColor: colors.icon + '20' }]}>
              <Text style={{ color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {c.category}
              </Text>
              <Text style={{ color: colors.icon, fontSize: 12 }}>
                {c.solved}/{c.total} solved · {formatHours(c.avgResolutionHours)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {all && (
        <Card style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>HR team performance</Text>
          {!stats.byHandler?.length ? (
            <Text style={[styles.tileNote, { color: colors.icon }]}>No grievance has been handled yet</Text>
          ) : (
            stats.byHandler.map((h) => (
              <View key={h.id} style={[styles.tableRow, { borderColor: colors.icon + '20' }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {h.name}
                  </Text>
                  <Text style={{ color: '#16A34A', fontWeight: '700' }}>{h.solved} solved</Text>
                </View>
                <Text style={{ color: colors.icon, fontSize: 12, marginTop: 2 }}>
                  {h.replies} replies · avg solve {formatHours(h.avgResolutionHours)} · first reply{' '}
                  {formatHours(h.avgFirstResponseHours)}
                </Text>
              </View>
            ))
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48.5%', padding: 12, marginBottom: 8 },
  tileIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tileLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  tileValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  tileNote: { fontSize: 11, marginTop: 2 },
  block: { padding: 14, marginBottom: 8 },
  blockTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  barTrack: { height: 6, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  tableRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
