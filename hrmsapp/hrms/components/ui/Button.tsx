/**
 * Button — Refined Indigo design system
 *
 * primary  → indigo→violet gradient with a soft primary glow
 * secondary→ solid slate
 * outline  → hairline border, indigo label
 * ghost    → transparent, indigo label (no border)
 * danger   → rose gradient
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radius, Gradients, Shadows } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isGradient = variant === 'primary' || variant === 'danger';

  const sizePad =
    size === 'small'
      ? { paddingVertical: 10, paddingHorizontal: 18, fontSize: 14, minHeight: 40 }
      : size === 'large'
      ? { paddingVertical: 17, paddingHorizontal: 30, fontSize: 17, minHeight: 56 }
      : { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15.5, minHeight: 50 };

  const shell: ViewStyle = {
    borderRadius: Radius.md,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled || loading ? 0.55 : 1,
  };

  const inner: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
    paddingVertical: sizePad.paddingVertical,
    paddingHorizontal: sizePad.paddingHorizontal,
    minHeight: sizePad.minHeight,
  };

  const labelColor =
    variant === 'outline' || variant === 'ghost' ? colors.tint : '#FFFFFF';
  const label: TextStyle = {
    color: labelColor,
    fontSize: sizePad.fontSize,
    fontWeight: '700',
    letterSpacing: 0.2,
  };

  const content = loading ? (
    <ActivityIndicator color={labelColor} />
  ) : (
    <>
      {icon}
      <Text style={[label, textStyle]}>{title}</Text>
    </>
  );

  const gradientColors =
    variant === 'danger'
      ? Gradients.rose
      : colorScheme === 'dark'
      ? Gradients.brandDark
      : Gradients.brand;

  const solidStyle: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: colorScheme === 'dark' ? '#2B3654' : '#334155' }
      : variant === 'outline'
      ? {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.tint + '55',
        }
      : { backgroundColor: 'transparent' }; // ghost

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        shell,
        isGradient && !disabled && !loading ? Shadows.primaryGlow : null,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={inner}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[inner, solidStyle]}>{content}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({});
