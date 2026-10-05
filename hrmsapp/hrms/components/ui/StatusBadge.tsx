/**
 * Status Badge Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'inProgress' | 'inReview';
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return colors.approved;
      case 'rejected':
        return colors.rejected;
      case 'inProgress':
        return colors.inProgress;
      case 'inReview':
        return colors.inReview;
      default:
        return colors.pending;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'inProgress':
        return 'In Progress';
      case 'inReview':
        return 'In Review';
      default:
        return 'Pending';
    }
  };

  const fontSize = size === 'small' ? 10.5 : size === 'large' ? 14 : 12;
  const padH = size === 'small' ? 9 : size === 'large' ? 14 : 11;
  const padV = size === 'small' ? 4 : size === 'large' ? 7 : 5.5;
  const dot = size === 'small' ? 5 : 6;
  const color = getStatusColor();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '1A',
          borderColor: color + '33',
          paddingHorizontal: padH,
          paddingVertical: padV,
        },
      ]}
    >
      <View style={{ width: dot, height: dot, borderRadius: dot, backgroundColor: color }} />
      <Text style={[styles.badgeText, { color, fontSize }]}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
