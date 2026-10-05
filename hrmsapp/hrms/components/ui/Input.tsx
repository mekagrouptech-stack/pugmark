/**
 * Input — Refined Indigo design system
 * Filled surface, rounded, with an indigo focus ring and a tracked-out label.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.tint
    : colors.cardBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: focused ? colors.surface : colors.backgroundSecondary,
            borderColor,
            borderWidth: focused || error ? 1.5 : 1,
          },
          focused ? styles.focusRing : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, { color: colors.text, flex: 1 }, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
  },
  focusRing: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    fontSize: 15.5,
    paddingVertical: 13,
  },
  leftIcon: {},
  rightIcon: {},
  error: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: '500',
  },
});
