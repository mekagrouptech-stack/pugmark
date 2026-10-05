/**
 * Employees Tab Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { getFullName, getInitials } from '@/utils/helpers';

export default function EmployeesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({ limit: 50, isActive: true });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  if (loading) {
    return <Loading message="Loading employees..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Employees</Text>
        <TouchableOpacity onPress={() => router.push('/employees/add')}>
          <Ionicons name="add-circle" size={32} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {employees.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Employees"
            message="No employees found"
          />
        ) : (
          employees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              onPress={() => router.push(`/employees/${employee.id}`)}
            >
              <Card style={styles.employeeCard}>
                <View style={styles.employeeRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
                    <Text style={[styles.avatarText, { color: colors.tint }]}>
                      {getInitials(employee.firstName, employee.lastName)}
                    </Text>
                  </View>
                  <View style={styles.employeeInfo}>
                    <Text style={[styles.employeeName, { color: colors.text }]}>
                      {getFullName(employee.firstName, employee.lastName)}
                    </Text>
                    <Text style={[styles.employeeId, { color: colors.icon }]}>
                      {employee.employeeId}
                    </Text>
                    {employee.department && (
                      <Text style={[styles.employeeDept, { color: colors.icon }]}>
                        {employee.department} • {employee.designation}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </View>
              </Card>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  employeeCard: {
    margin: 16,
    marginTop: 0,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  employeeId: {
    fontSize: 12,
    marginTop: 2,
  },
  employeeDept: {
    fontSize: 12,
    marginTop: 4,
  },
});
