/**
 * Avatar Component
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getInitials } from '@/utils/helpers';

interface AvatarProps {
  firstName: string;
  lastName?: string;
  imageUrl?: string;
  size?: number;
  backgroundColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  firstName,
  lastName,
  imageUrl,
  size = 40,
  backgroundColor,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Use provided backgroundColor for background, or default to tint color with opacity
  const avatarBgColor = backgroundColor || colors.tint + '20';
  // Text color: if backgroundColor is provided (white), use blue; otherwise use tint color
  const textColor = backgroundColor === '#FFFFFF' || backgroundColor === '#ffffff' ? '#3B82F6' : (backgroundColor || colors.tint);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.avatarPlaceholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarBgColor,
        },
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          {
            color: textColor,
            fontSize: size * 0.4,
          },
        ]}
      >
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarText: {
    fontWeight: '600',
  },
});
