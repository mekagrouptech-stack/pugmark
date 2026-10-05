/**
 * Network Error Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  message = 'Network Error',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
        </View>
      </View>
      
      <Text style={styles.errorText}>{message}</Text>
      
      {onRetry && (
        <Button
          title="Retry"
          onPress={onRetry}
          variant="primary"
          style={styles.retryButton}
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
    backgroundColor: '#F5F5F5',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 32,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
    backgroundColor: '#1780A0',
  },
});
