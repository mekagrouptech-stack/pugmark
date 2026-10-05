import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types';
import { isAdmin, canManageEmployees } from '@/utils/helpers';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuthStore();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 85,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 4,
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quick-action"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#4F46E5',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="leaves"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
