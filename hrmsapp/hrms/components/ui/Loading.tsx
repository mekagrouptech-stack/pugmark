/**
 * Loading Component
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ message, size = 'large' }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.tint} />
      {message && (
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
  },
});
