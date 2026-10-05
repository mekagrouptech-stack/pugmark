/**
 * Profile Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Gradients, Radius, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { getFullName } from '@/utils/helpers';
import { Avatar } from '@/components/ui/Avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const menuItems = [
    { icon: 'person-outline', tint: colors.tint, label: 'Edit Profile', onPress: () => router.push('/settings') },
    { icon: 'cash-outline', tint: '#10B981', label: 'My Salary', onPress: () => router.push('/salary') },
    { icon: 'wallet-outline', tint: '#0EA5E9', label: 'Payroll', onPress: () => router.push('/payroll') },
    { icon: 'calendar-outline', tint: '#F59E0B', label: 'My Leaves', onPress: () => router.push('/leaves') },
    { icon: 'receipt-outline', tint: '#EC4899', label: 'Reimbursements', onPress: () => router.push('/reimbursements') },
    { icon: 'chatbubbles-outline', tint: '#EF4444', label: 'Grievances', onPress: () => router.push('/grievances') },
  ] as const;

  const reportTo =
    (user as any)?.reportingManagerName || (user as any)?.reportTo || 'Head of Department';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Gradient hero */}
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Profile</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarRing}>
            <Avatar firstName={user?.firstName || 'User'} lastName={user?.lastName} size={82} backgroundColor="#FFFFFF" />
          </View>
          <Text style={styles.userName}>
            {user ? getFullName(user.firstName, user.lastName) : 'User'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{user?.role?.replace(/_/g, ' ') || 'Employee'}</Text>
          </View>
          <Text style={styles.reportTo}>Reports to {reportTo}</Text>
        </LinearGradient>

        {/* Menu */}
        <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground, borderColor: colors.hairline }, Shadows.card]}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                i < menuItems.length && { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <View style={[styles.menuChip, { backgroundColor: item.tint + '18' }]}>
                <Ionicons name={item.icon as any} size={19} color={item.tint} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#EF444410', borderColor: '#EF444433' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 18,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...Shadows.lifted,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: -0.4,
  },
  userEmail: { fontSize: 13.5, marginTop: 3, color: 'rgba(255,255,255,0.8)' },
  rolePill: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  reportTo: { fontSize: 12.5, marginTop: 12, color: 'rgba(255,255,255,0.7)' },
  menuContainer: {
    margin: 16,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  menuChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 15,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
});
