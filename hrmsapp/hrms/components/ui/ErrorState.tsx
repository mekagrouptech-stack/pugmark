/**
 * Error State Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry && (
        <Button
          title="Retry"
          onPress={onRetry}
          variant="primary"
          style={{ marginTop: 16 }}
        />
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
  message: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
