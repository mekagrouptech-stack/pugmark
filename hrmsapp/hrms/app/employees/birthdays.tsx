/**
 * Employees with Birthdays Today Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { getFullName } from '@/utils/helpers';
// Removed USE_MOCK_AUTH - all data comes from real APIs

export default function BirthdaysScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      // Fetch all employees and filter by date of birth
      // TODO: Backend endpoint needed: GET /api/employees/birthdays
      const response = await employeeService.getEmployees({ isActive: true });
      const todayBirthdays = response.data.filter((emp) => {
        if (!emp.dateOfBirth) return false;
        const dob = new Date(emp.dateOfBirth);
        return dob.getMonth() + 1 === month && dob.getDate() === day;
      });
      setEmployees(todayBirthdays);
    } catch (error) {
      console.error('Error loading birthdays:', error);
      setEmployees([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading birthdays..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Birthday of Employees</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {employees.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="gift-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No birthdays today</Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              There are no employees celebrating their birthday today
            </Text>
          </Card>
        ) : (
          employees.map((employee) => (
            <Card key={employee.id} style={styles.employeeCard}>
              <View style={styles.employeeRow}>
                <Avatar
                  firstName={employee.firstName}
                  lastName={employee.lastName}
                  size={60}
                />
                <View style={styles.employeeInfo}>
                  <Text style={[styles.employeeName, { color: colors.text }]}>
                    {getFullName(employee.firstName, employee.lastName)}
                  </Text>
                  <Text style={[styles.employeeDetail, { color: colors.icon }]}>
                    {employee.designation || 'Employee'}
                  </Text>
                  <Text style={[styles.employeeDetail, { color: colors.icon }]}>
                    {employee.department || 'Department'}
                  </Text>
                </View>
                <View style={[styles.birthdayIcon, { backgroundColor: '#0EA5E920' }]}>
                  <Ionicons name="gift" size={24} color="#0EA5E9" />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  employeeCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  employeeDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  birthdayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    margin: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
