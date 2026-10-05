/**
 * Card — Refined Indigo design system
 * Soft, generously rounded surface with layered elevation and a hairline edge.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  shadow?: boolean;
  /** 'elevated' (default) floats with shadow; 'flat' is a bordered surface. */
  variant?: 'elevated' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 18,
  shadow = true,
  variant = 'elevated',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.hairline,
          padding,
        },
        variant === 'elevated' && shadow ? Shadows.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
