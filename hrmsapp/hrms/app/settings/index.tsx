/**
 * Settings Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { getFullName, getInitials } from '@/utils/helpers';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const settingsItems = [
    {
      icon: 'person-outline',
      title: 'Profile',
      subtitle: 'View and edit your profile',
      onPress: () => router.push('/settings/profile'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Change Password',
      subtitle: 'Update your password',
      onPress: () => router.push('/settings/change-password'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification settings',
      onPress: () => router.push('/notifications'),
    },
    {
      icon: 'color-palette-outline',
      title: 'Theme',
      subtitle: colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode',
      onPress: () => {
        // Theme toggle can be implemented here
        Alert.alert('Theme', 'Theme settings coming soon');
      },
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* User Profile Card */}
      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.tint }]}>
            {user ? getInitials(user.firstName, user.lastName) : 'U'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user ? getFullName(user.firstName, user.lastName) : 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.icon }]}>
          {user?.email || ''}
        </Text>
        <Text style={[styles.userRole, { color: colors.tint }]}>
          {user?.role?.replace('_', ' ') || ''}
        </Text>
      </Card>

      {/* Settings Items */}
      <Card style={styles.settingsCard}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingsItem,
              index !== settingsItems.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.icon + '20',
              },
            ]}
            onPress={item.onPress}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name={item.icon as any} size={24} color={colors.tint} />
              <View style={styles.settingsItemText}>
                <Text style={[styles.settingsItemTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.settingsItemSubtitle, { color: colors.icon }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: '#EF444420' }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        <Text style={[styles.logoutText, { color: '#EF4444' }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCard: {
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    marginTop: 8,
    textTransform: 'capitalize',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    padding: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
