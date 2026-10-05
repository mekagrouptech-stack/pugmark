/**
 * WorkdayProgress — "6h 12m of 9h" against the required working hours.
 *
 * Ticks on its own while the employee is still checked in, so the screen that
 * hosts it does not re-render every minute just to move a bar.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius } from '@/constants/theme';
import { ATTENDANCE_RULES } from '@/utils/constants';

interface WorkdayProgressProps {
  /** ISO time of the day's first punch in. */
  punchInTime: string;
  /** ISO time of the day's last punch out; omit while still checked in. */
  punchOutTime?: string;
  /**
   * Shortfall the API reported for a finished day, e.g. "1h 20m". When set the
   * bar reads as a verdict ("Short by …") rather than as time still to go.
   */
  shortBy?: string;
  /** The shift's length in hours; defaults to the standard workday. */
  requiredHours?: number;
}

const SHORT_HOURS_COLOR = '#BE185D';

const formatMinutes = (totalMinutes: number): string => {
  const mins = Math.max(0, Math.round(totalMinutes));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
};

export function WorkdayProgress({ punchInTime, punchOutTime, shortBy, requiredHours }: WorkdayProgressProps) {
  const REQUIRED_HOURS = requiredHours && requiredHours > 0 ? requiredHours : ATTENDANCE_RULES.WORKDAY_HOURS;
  const REQUIRED_MINUTES = Math.round(REQUIRED_HOURS * 60);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [now, setNow] = useState(() => Date.now());
  const live = !punchOutTime;

  useEffect(() => {
    if (!live) return;
    // The display is to the minute, so a 30s tick keeps it honest without
    // waking the screen every second.
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [live]);

  const start = new Date(punchInTime).getTime();
  const end = punchOutTime ? new Date(punchOutTime).getTime() : now;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

  const workedMinutes = Math.floor((end - start) / 60000);
  const remainingMinutes = Math.max(0, REQUIRED_MINUTES - workedMinutes);
  const done = workedMinutes >= REQUIRED_MINUTES;
  const percent = Math.min(100, Math.round((workedMinutes / REQUIRED_MINUTES) * 100));
  const barColor = done ? colors.success : shortBy ? SHORT_HOURS_COLOR : colors.tint;

  return (
    <View style={[styles.wrap, { backgroundColor: barColor + '0F' }]}>
      <View style={styles.row}>
        <Ionicons name={done ? 'checkmark-circle' : 'hourglass-outline'} size={15} color={barColor} />
        <Text style={[styles.worked, { color: colors.text }]}>
          {formatMinutes(workedMinutes)}
          <Text style={{ color: colors.textMuted, fontWeight: '500' }}>
            {' '}of {REQUIRED_HOURS}h
          </Text>
        </Text>
        <Text
          style={[
            styles.remaining,
            { color: done ? colors.success : shortBy ? SHORT_HOURS_COLOR : colors.textMuted },
          ]}
        >
          {done
            ? `${REQUIRED_HOURS} hours completed`
            : shortBy
            ? `Short by ${shortBy}`
            : `${formatMinutes(remainingMinutes)} left`}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.hairline }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  worked: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  remaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
