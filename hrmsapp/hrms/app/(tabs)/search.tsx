/**
 * Search Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="search-outline"
        title="Search"
        message="Search functionality coming soon"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
