/**
 * Dashboard Screen - New Theme Design
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Gradients, Shadows, Radius } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { dashboardService } from '@/services/dashboard.service';
import { leaveService } from '@/services/leave.service';
import { attendanceService } from '@/services/attendance.service';
import { DashboardStats, Leave, Attendance, AttendanceStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { NetworkError } from '@/components/ui/NetworkError';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { CalendarStrip } from '@/components/ui/CalendarStrip';
import { WorkdayProgress } from '@/components/ui/WorkdayProgress';
import { getFullName, formatDate, formatDateTime, formatDateLocal, isAdmin, canApproveLeaves } from '@/utils/helpers';
import { employeeService } from '@/services/employee.service';
import { darService } from '@/services/dar.service';
import { payrollService } from '@/services/payroll.service';
import { Employee, DARStats } from '@/types';
// Removed USE_MOCK_AUTH - all data comes from real APIs

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [birthdays, setBirthdays] = useState<Employee[]>([]);
  const [anniversaries, setAnniversaries] = useState<Employee[]>([]);
  const [employeesOnLeave, setEmployeesOnLeave] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [darStats, setDarStats] = useState<DARStats | null>(null);
  const [payslipCount, setPayslipCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-280)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: open ? 0 : -280,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: open ? 0.5 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogout = () => {
    toggleSidebar(false);
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

  const sidebarItems = [
    { icon: 'home-outline', label: 'Dashboard', onPress: () => { toggleSidebar(false); } },
    { icon: 'person-outline', label: 'My Profile', onPress: () => { toggleSidebar(false); router.push('/(tabs)/profile'); } },
    { icon: 'calendar-outline', label: 'My Attendance', onPress: () => { toggleSidebar(false); router.push('/attendance/calendar'); } },
    { icon: 'document-text-outline', label: 'Leaves', onPress: () => { toggleSidebar(false); router.push('/leaves'); } },
    { icon: 'cash-outline', label: 'Pay Slips', onPress: () => { toggleSidebar(false); router.push('/payroll'); } },
    { icon: 'clipboard-outline', label: 'DAR', onPress: () => { toggleSidebar(false); router.push('/dar/list'); } },
    { icon: 'wallet-outline', label: 'Reimbursements', onPress: () => { toggleSidebar(false); router.push('/reimbursements'); } },
    { icon: 'chatbubbles-outline', label: 'Grievances', onPress: () => { toggleSidebar(false); router.push('/grievances'); } },
    { icon: 'people-outline', label: 'Employees', onPress: () => { toggleSidebar(false); router.push('/employees'); } },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => { toggleSidebar(false); router.push('/notifications'); } },
    { icon: 'settings-outline', label: 'Settings', onPress: () => { toggleSidebar(false); router.push('/settings'); } },
  ];

  const loadData = async () => {
    try {
      setError(null);
      const [statsData, leavesData] = await Promise.all([
        dashboardService.getStats(user?.companyId),
        leaveService.getLeaves({ limit: 5, status: 'PENDING' }),
      ]);
      setStats(statsData);
      setRecentLeaves(leavesData.data);
      
      // Load birthdays, anniversaries, employees on leave, today's attendance, DAR stats, payslips, and notifications
      await Promise.all([
        loadBirthdays(),
        loadAnniversaries(),
        loadEmployeesOnLeave(),
        loadTodayAttendance(),
        loadDARStats(),
        loadPayslipCount(),
        loadNotificationCount(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBirthdays = async () => {
    try {
      const today = new Date();
      const todayStr = formatDateLocal(today); // Use local date format
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      
      const response = await employeeService.getEmployees({ isActive: true });
      const todayBirthdays = response.data.filter((emp) => {
        if (!emp.dateOfBirth) return false;
        try {
          const dob = new Date(emp.dateOfBirth);
          // Compare month and day (ignore year for birthdays)
          return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
        } catch {
          return false;
        }
      });
      setBirthdays(todayBirthdays);
    } catch (error) {
      console.error('Error loading birthdays:', error);
      setBirthdays([]); // Set empty array on error
    }
  };

  const loadAnniversaries = async () => {
    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      
      const response = await employeeService.getEmployees({ isActive: true });
      const todayAnniversaries = response.data.filter((emp) => {
        if (!emp.dateOfJoining) return false;
        try {
          const doj = new Date(emp.dateOfJoining);
          // Compare month and day (ignore year for anniversaries)
          return doj.getMonth() + 1 === todayMonth && doj.getDate() === todayDay;
        } catch {
          return false;
        }
      });
      setAnniversaries(todayAnniversaries);
    } catch (error) {
      console.error('Error loading anniversaries:', error);
      setAnniversaries([]); // Set empty array on error
    }
  };

  const loadEmployeesOnLeave = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDateLocal(today); // Use local date format
      
      // Get all approved leaves that include today in their date range
      const response = await leaveService.getLeaves({
        status: 'APPROVED',
        limit: 100, // Get more leaves to check date ranges
      });
      
      // Filter leaves where today falls within the leave date range
      const todayLeaves = (response.data || []).filter((leave) => {
        try {
          const startDate = new Date(leave.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(leave.endDate);
          endDate.setHours(23, 59, 59, 999);
          
          // Check if today is within the leave date range
          return today >= startDate && today <= endDate;
        } catch {
          return false;
        }
      });
      
      // Get unique employees from today's leaves
      const uniqueEmployees = todayLeaves.reduce((acc: any[], leave) => {
        const employeeId = leave.employeeId || leave.userId;
        if (employeeId && !acc.find((emp) => emp.employeeId === employeeId)) {
          acc.push({
            id: employeeId,
            employeeId: employeeId,
            firstName: leave.employeeName?.split(' ')[0] || 'Employee',
            lastName: leave.employeeName?.split(' ').slice(1).join(' ') || '',
            employeeName: leave.employeeName || 'Employee',
            leaveType: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
          });
        }
        return acc;
      }, []);
      
      setEmployeesOnLeave(uniqueEmployees);
    } catch (error) {
      console.error('Error loading employees on leave:', error);
      setEmployeesOnLeave([]); // Set empty array on error
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const attendance = await attendanceService.getTodayAttendance();
      setTodayAttendance(attendance);
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  };

  const loadDARStats = async () => {
    try {
      const stats = await darService.getStats(user?.id);
      setDarStats(stats);
    } catch (error) {
      console.error('Error loading DAR stats:', error);
    }
  };

  const loadPayslipCount = async () => {
    try {
      const response = await payrollService.getPayrolls({ userId: user?.id, limit: 1 });
      setPayslipCount(response.total || response.data?.length || 0);
    } catch (error) {
      console.error('Error loading payslip count:', error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      // Count pending leaves as notifications
      const leavesData = await leaveService.getLeaves({ limit: 50, status: 'PENDING' });
      const pendingCount = leavesData?.data?.length || 0;
      setNotificationCount(pendingCount);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error && !stats) {
    if (error.includes('Network') || error.includes('network')) {
      return <NetworkError onRetry={loadData} />;
    }
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const serviceIcons = [
    {
      icon: 'mail-outline',
      label: 'Requests',
      count: stats?.pendingLeaves || 0,
      color: '#10B981',
      onPress: () => router.push('/leaves'),
    },
    {
      icon: 'calendar-outline',
      label: 'Leaves',
      count: stats?.onLeave || 0,
      color: '#F59E0B',
      onPress: () => router.push('/leaves'),
    },
    {
      icon: 'document-text-outline',
      label: 'DAR',
      count: darStats?.submittedToday || 0,
      color: '#8B5CF6',
      onPress: () => router.push('/dar/list'),
    },
    {
      icon: 'time-outline',
      label: 'Attendance',
      count: stats?.presentToday || 0,
      color: '#3B82F6',
      onPress: () => router.push('/attendance/list'),
    },
    {
      icon: 'wallet-outline',
      label: 'Pay Slips',
      count: payslipCount,
      color: '#3B82F6',
      onPress: () => router.push('/payroll'),
    },
    {
      icon: 'people-outline',
      label: 'Team',
      count: stats?.totalEmployees || 0,
      color: '#8B5CF6',
      onPress: () => router.push('/employees'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Header — gradient hero */}
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => toggleSidebar(true)}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Search Bar - Center */}
        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: '#FFFFFF20' }]}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.searchPlaceholder}>Search...</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.profileButton}
          >
            <View style={styles.profileAvatarContainer}>
              <Avatar
                firstName={user?.firstName || 'User'}
                lastName={user?.lastName}
                size={40}
                backgroundColor="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </View>
        </View>
        <View style={styles.headerGreeting}>
          <Text style={styles.hiTextLight}>Hi {user?.firstName || 'User'} 👋</Text>
          <Text style={styles.greetingTextLight}>{getGreeting()}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Today's Check In/Out Section */}
        {todayAttendance && (
          <View style={styles.attendanceSection}>
            <Card style={styles.attendanceCard}>
              {(() => {
                const isAbsent =
                  !todayAttendance.punchIn && !todayAttendance.punchOut;
                const key = (isAbsent
                  ? 'absent'
                  : String(todayAttendance.status || 'present')
                ).toLowerCase();
                const statusColor =
                  key.includes('present')
                    ? '#10B981'
                    : key.includes('late') || key.includes('half')
                    ? '#F59E0B'
                    : key.includes('leave')
                    ? colors.tint
                    : '#EF4444';
                const status = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const inTime = todayAttendance.punchIn
                  ? todayAttendance.punchIn.displayTime ??
                    formatDateTime(todayAttendance.punchIn.time).split(', ')[1]
                  : '--:--';
                const outTime = todayAttendance.punchOut
                  ? todayAttendance.punchOut.displayTime ??
                    formatDateTime(todayAttendance.punchOut.time).split(', ')[1]
                  : '--:--';
                return (
                  <>
                    {/* Header: title + status pill */}
                    <View style={styles.attnHeader}>
                      <View style={styles.attnTitleRow}>
                        <View style={[styles.attnTitleIcon, { backgroundColor: colors.tint + '18' }]}>
                          <Ionicons name="time-outline" size={15} color={colors.tint} />
                        </View>
                        <Text style={[styles.attendanceCardTitle, { color: colors.text }]}>
                          Today's Attendance
                        </Text>
                      </View>
                      <View style={[styles.attnPill, { backgroundColor: statusColor + '1A', borderColor: statusColor + '33' }]}>
                        <View style={[styles.attnDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.attnPillText, { color: statusColor }]}>{status}</Text>
                      </View>
                    </View>

                    {isAbsent ? (
                      <View style={styles.attnEmpty}>
                        <View style={[styles.attnEmptyIcon, { backgroundColor: colors.tint + '14' }]}>
                          <Ionicons name="calendar-outline" size={26} color={colors.tint} />
                        </View>
                        <Text style={[styles.attnEmptyTitle, { color: colors.text }]}>
                          No punches recorded yet
                        </Text>
                        <Text style={[styles.attnEmptySub, { color: colors.textMuted }]}>
                          Attendance syncs automatically from the biometric device.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.attnTiles}>
                          <View style={styles.attnTile}>
                            <View style={[styles.attnTileIcon, { backgroundColor: '#10B98118' }]}>
                              <Ionicons name="log-in" size={18} color="#10B981" />
                            </View>
                            <Text style={[styles.attnTileLabel, { color: colors.textMuted }]}>Check In</Text>
                            <Text style={[styles.attnTileTime, { color: colors.text }]}>{inTime}</Text>
                            {todayAttendance.isLate && todayAttendance.lateBy ? (
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EA580C', marginTop: 2 }}>
                                Late {todayAttendance.lateBy}
                              </Text>
                            ) : null}
                          </View>
                          <View style={[styles.attnTileSep, { backgroundColor: colors.hairline }]} />
                          <View style={styles.attnTile}>
                            <View style={[styles.attnTileIcon, { backgroundColor: '#EF444418' }]}>
                              <Ionicons name="log-out" size={18} color="#EF4444" />
                            </View>
                            <Text style={[styles.attnTileLabel, { color: colors.textMuted }]}>Check Out</Text>
                            <Text style={[styles.attnTileTime, { color: colors.text }]}>{outTime}</Text>
                          </View>
                        </View>
                        {/* The shift today is judged against. */}
                        {todayAttendance.expectedCheckIn ? (
                          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>
                            {todayAttendance.shiftName ? `${todayAttendance.shiftName} · ` : ''}
                            {todayAttendance.expectedCheckIn} – {todayAttendance.expectedCheckOut}
                            {todayAttendance.lateAfter ? `  (late after ${todayAttendance.lateAfter})` : ''}
                          </Text>
                        ) : null}
                        {/* Progress towards the shift's required hours — live
                            from the check-in, not only once a check-out exists. */}
                        {todayAttendance.punchIn && (
                          <WorkdayProgress
                            punchInTime={todayAttendance.punchIn.time}
                            punchOutTime={todayAttendance.punchOut?.time}
                            requiredHours={todayAttendance.requiredHours}
                          />
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </Card>
          </View>
        )}

        {/* Stats Cards Section - Birthday, Anniversary, Leave */}
        <View style={styles.statsSection}>
          <Text style={[styles.statsSectionTitle, { color: colors.text }]}>Today's Overview</Text>
          <View style={styles.statsRow}>
            {/* Birthday Card */}
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/employees/birthdays')}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#0EA5E918' }]}>
                <Ionicons name="gift" size={24} color="#0EA5E9" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{birthdays.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Birthdays</Text>
            </TouchableOpacity>

            {/* Anniversary Card */}
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/employees/anniversaries')}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{anniversaries.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Anniversaries</Text>
            </TouchableOpacity>

            {/* Leave Card */}
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/employees/on-leave')}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#EC489918' }]}>
                <Ionicons name="calendar" size={24} color="#EC4899" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{employeesOnLeave.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>On Leave</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* New Tabs Section */}
        <View style={styles.section}>
          <View style={styles.tabsGrid}>
            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/wall')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="images-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>MY WALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/leaves')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>LEAVES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/payroll')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="document-text-outline" size={24} color="#10B981" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>PAYSLIPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/attendance/calendar')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="time-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>ATTENDANCE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/requests')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="mail-outline" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>REQUESTS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/reimbursements')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#EC489920' }]}>
                <Ionicons name="wallet-outline" size={24} color="#EC4899" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>REIMBURSEMENTS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/grievances')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="chatbubbles-outline" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>GRIEVANCES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/investment')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#0EA5E920' }]}>
                <Ionicons name="trending-up-outline" size={24} color="#0EA5E9" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>INVESTMENT DECLARATION</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/group')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="people-outline" size={24} color="#10B981" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>GROUP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/events')}
            >
              <View style={[styles.tabIconContainer, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.tabLabel, { color: colors.text }]}>EVENTS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Please Choose Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Please Choose Services</Text>
          <View style={styles.servicesGrid}>
            {serviceIcons.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.serviceCard, { backgroundColor: colors.cardBackground }]}
                onPress={service.onPress}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={32} color={service.color} />
                </View>
                <Text style={[styles.serviceLabel, { color: colors.text }]}>{service.label}</Text>
                <Text style={[styles.serviceCount, { color: service.color }]}>{service.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Leave Applications - Admin Only */}
        {isAdmin(user?.role) && recentLeaves.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Leave Application
              </Text>
              <TouchableOpacity onPress={() => router.push('/leaves')}>
                <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentLeaves.slice(0, 3).map((leave) => (
              <Card key={leave.id} style={styles.leaveCard}>
                <View style={styles.leaveCardContent}>
                  <Avatar
                    firstName={leave.employeeName.split(' ')[0]}
                    lastName={leave.employeeName.split(' ')[1]}
                    size={50}
                  />
                  <View style={styles.leaveInfo}>
                    <Text style={[styles.leaveEmployeeName, { color: colors.text }]}>
                      {leave.employeeName}
                    </Text>
                    <Text style={[styles.leaveDate, { color: colors.icon }]}>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </Text>
                    <Text style={[styles.leaveType, { color: colors.icon }]}>
                      {leave.leaveType} Leave Request
                    </Text>
                  </View>
                  <View style={styles.leaveActions}>
                    <StatusBadge status="pending" size="small" />
                    <View style={styles.leaveActionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => {
                          // Handle cancel
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={async () => {
                          try {
                            await leaveService.approveLeave(leave.id);
                            loadData();
                          } catch (error) {
                            console.error('Error approving leave:', error);
                          }
                        }}
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Today's Attendance */}
        {stats && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Attendance</Text>
            <View style={styles.attendanceStats}>
              <View style={[styles.attendanceStatCard, { backgroundColor: colors.tint + '20' }]}>
                <Text style={[styles.attendanceStatValue, { color: colors.tint }]}>
                  {stats.presentToday}
                </Text>
                <Text style={[styles.attendanceStatLabel, { color: colors.text }]}>Presents</Text>
              </View>
              <View style={[styles.attendanceStatCard, { backgroundColor: '#F59E0B20' }]}>
                <Text style={[styles.attendanceStatValue, { color: '#F59E0B' }]}>
                  {stats.monthlyAttendance.halfDay}
                </Text>
                <Text style={[styles.attendanceStatLabel, { color: colors.text }]}>Late</Text>
              </View>
              <View style={[styles.attendanceStatCard, { backgroundColor: '#EF444420' }]}>
                <Text style={[styles.attendanceStatValue, { color: '#EF4444' }]}>
                  {stats.monthlyAttendance.absent}
                </Text>
                <Text style={[styles.attendanceStatLabel, { color: colors.text }]}>Absent</Text>
              </View>
            </View>
          </View>
        )}

        {/* Calendar Strip */}
        <View style={styles.section}>
          <CalendarStrip onDateSelect={(date) => console.log('Selected date:', date)} />
        </View>
      </ScrollView>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
          <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar Drawer */}
      <Animated.View
        style={[
          styles.sidebarContainer,
          { transform: [{ translateX: sidebarAnim }], backgroundColor: colors.cardBackground },
        ]}
      >
        {/* Sidebar Header - User Info */}
        <View style={[styles.sidebarHeader, { backgroundColor: colors.tint }]}>
          <TouchableOpacity style={styles.sidebarClose} onPress={() => toggleSidebar(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.sidebarAvatar}>
            <View style={styles.sidebarAvatarCircle}>
              <Text style={styles.sidebarAvatarText}>
                {user?.firstName?.[0]?.toUpperCase() || 'U'}{user?.lastName?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
          </View>
          <Text style={styles.sidebarUserName}>
            {user?.firstName || 'User'} {user?.lastName || ''}
          </Text>
          <Text style={styles.sidebarUserEmail}>{user?.email || ''}</Text>
          <Text style={styles.sidebarUserRole}>{user?.role?.replace('_', ' ') || 'Employee'}</Text>
        </View>

        {/* Sidebar Menu Items */}
        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {sidebarItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sidebarItem}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <Ionicons name={item.icon as any} size={22} color={colors.tint} />
              <Text style={[styles.sidebarItemLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={[styles.sidebarDivider, { backgroundColor: colors.icon + '20' }]} />

          {/* Logout */}
          <TouchableOpacity style={styles.sidebarItem} onPress={handleLogout} activeOpacity={0.6}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={[styles.sidebarItemLabel, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 22,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    ...Shadows.primaryGlow,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerGreeting: {
    marginTop: 18,
    paddingHorizontal: 2,
  },
  hiTextLight: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
    marginBottom: 2,
  },
  greetingTextLight: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    maxWidth: '50%',
  },
  searchPlaceholder: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileButton: {
    // Make the entire area clickable
  },
  profileAvatarContainer: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  greetingSection: {
    padding: 20,
    paddingBottom: 16,
  },
  hiText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaveCard: {
    marginBottom: 12,
    padding: 16,
  },
  leaveCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaveEmployeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  leaveDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  leaveType: {
    fontSize: 12,
  },
  leaveActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  leaveActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
  },
  approveButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  attendanceStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  attendanceStatLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 124,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9ECF4',
    ...Shadows.card,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  attendanceSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  attendanceCard: {
    padding: 18,
  },
  attendanceCardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  attnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attnTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  attnTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  attnDot: { width: 6, height: 6, borderRadius: 6 },
  attnPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  attnEmpty: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 12 },
  attnEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  attnEmptyTitle: { fontSize: 15, fontWeight: '700' },
  attnEmptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
    maxWidth: 260,
  },
  attnTiles: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  attnTile: { flex: 1, alignItems: 'center', gap: 4 },
  attnTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  attnTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  attnTileTime: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  attnTileSep: { width: 1, height: 56, marginHorizontal: 8 },
  checkInOutRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkInOutItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  checkInOutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkInOutInfo: {
    flex: 1,
  },
  checkInOutLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  checkInOutTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  noAttendanceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noAttendanceText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  totalHoursSpannedWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
  totalHoursSpanned: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tabItem: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  // Sidebar styles
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 998,
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sidebarHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sidebarClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  sidebarAvatar: {
    marginBottom: 12,
  },
  sidebarAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF40',
  },
  sidebarAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  sidebarUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sidebarUserEmail: {
    fontSize: 12,
    color: '#FFFFFFB0',
    marginBottom: 4,
  },
  sidebarUserRole: {
    fontSize: 12,
    color: '#FFFFFF90',
    textTransform: 'uppercase',
    fontWeight: '600',
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  sidebarItemLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sidebarDivider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 8,
  },
});
