/**
 * Empty State Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline',
  title,
  message,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={[styles.iconTile, { backgroundColor: colors.tint + '14' }]}>
        <Ionicons name={icon} size={34} color={colors.tint} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconTile: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  message: {
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 300,
  },
});
