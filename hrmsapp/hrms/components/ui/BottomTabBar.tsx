/**
 * Bottom Tab Bar Component - Reusable for screens outside tab navigation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const BottomTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const tabs = [
    {
      name: 'Home',
      route: '/(tabs)/dashboard',
      icon: 'home-outline',
      iconFocused: 'home',
    },
    {
      name: 'Attendance',
      route: '/(tabs)/attendance',
      icon: 'time-outline',
      iconFocused: 'time',
    },
    {
      name: '',
      route: '/(tabs)/quick-action',
      icon: 'add',
      iconFocused: 'add',
      isCenter: true,
    },
    {
      name: 'Profile',
      route: '/(tabs)/profile',
      icon: 'person-outline',
      iconFocused: 'person',
    },
    {
      name: 'Calendar',
      route: '/(tabs)/calendar',
      icon: 'calendar-outline',
      iconFocused: 'calendar',
    },
  ];

  const isActive = (route: string) => {
    if (route === '/(tabs)/attendance') {
      return pathname?.includes('/attendance') || pathname === route;
    }
    return pathname === route;
  };

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.cardBorder }]}>
      {tabs.map((tab, index) => {
        const active = isActive(tab.route);
        const isCenter = tab.isCenter;

        if (isCenter) {
          return (
            <TouchableOpacity
              key={index}
              style={styles.centerButton}
              onPress={() => handlePress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={styles.centerButtonInner}>
                <Ionicons name={tab.icon as any} size={28} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            style={styles.tab}
            onPress={() => handlePress(tab.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(active ? tab.iconFocused : tab.icon) as any}
              size={24}
              color={active ? colors.tint : colors.tabIconDefault}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active ? colors.tint : colors.tabIconDefault,
                },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  centerButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
