/**
 * DAR List Screen - View all DARs with filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { darService } from '@/services/dar.service';
import { DAR, DARStatus, UserRole } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/utils/helpers';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function DARListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [dars, setDars] = useState<DAR[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DARStatus | 'ALL'>('ALL');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isManager = user?.role === UserRole.MANAGER;
  const isHR = user?.role === UserRole.HR || user?.role === UserRole.COMPANY_ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const loadDARs = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setPage(1);
        setError(null);
      }

      const currentPage = reset ? 1 : page;
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (startDate) {
        params.startDate = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        params.endDate = endDate.toISOString().split('T')[0];
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      let response;
      if (isHR) {
        response = await darService.getAllDARs(params);
      } else if (isManager) {
        response = await darService.getTeamDARs(params);
      } else {
        response = await darService.getMyDARs(params);
      }

      const items = response?.data || [];
      if (reset) {
        setDars(items);
      } else {
        setDars((prev) => [...prev, ...items]);
      }

      const totalPages = response?.totalPages || 1;
      const currentResponsePage = response?.page || currentPage;
      setHasMore(currentResponsePage < totalPages && items.length > 0);
      setPage(currentPage + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load DARs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, startDate, endDate, searchQuery, isManager, isHR]);

  useEffect(() => {
    loadDARs(true);
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadDARs(true);
      } else {
        loadDARs(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDARs(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadDARs(false);
    }
  };

  const getStatusColor = (status: DARStatus): string => {
    switch (status) {
      case DARStatus.DRAFT:
        return '#6B7280';
      case DARStatus.SUBMITTED:
        return '#3B82F6';
      case DARStatus.APPROVED:
        return '#10B981';
      case DARStatus.REJECTED:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleDeleteDAR = (id: string) => {
    Alert.alert(
      'Delete Daily Activity Report',
      'Are you sure you want to delete this Daily Activity Report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await darService.delete(id);
              setDars((prev) => prev.filter((dar) => dar.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const renderDARItem = ({ item }: { item: DAR }) => {
    const canEdit = item.status === DARStatus.DRAFT || (item.status === DARStatus.SUBMITTED && new Date(item.date) >= new Date(new Date().setHours(0, 0, 0, 0)));

    return (
      <Card
        style={styles.darCard}
        onPress={() => router.push(`/dar/${item.id}`)}
      >
        <View style={styles.darHeader}>
          <View style={styles.darHeaderLeft}>
            <Text style={[styles.darDate, { color: colors.text }]}>
              {formatDate(item.date)}
            </Text>
            {!isManager && !isHR && (
              <StatusBadge
                status={item.status}
                color={getStatusColor(item.status)}
              />
            )}
          </View>
          {isManager || isHR ? (
            <View>
              <Text style={[styles.employeeName, { color: colors.text }]}>
                {item.employeeName}
              </Text>
              <Text style={[styles.employeeId, { color: colors.icon }]}>
                {item.employeeId}
              </Text>
            </View>
          ) : (
            <View style={styles.darActionsRow}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (canEdit) {
                    router.push(`/dar/${item.id}/edit`);
                  }
                }}
                disabled={!canEdit}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={canEdit ? colors.tint : colors.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteDAR(item.id);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {item.projectName && (
          <View style={styles.darRow}>
            <Ionicons name="business-outline" size={16} color={colors.icon} />
            <Text style={[styles.darText, { color: colors.text }]} numberOfLines={1}>
              {item.projectName}
            </Text>
          </View>
        )}

        {item.workLocation && (
          <View style={styles.darRow}>
            <Ionicons name="location-outline" size={16} color={colors.icon} />
            <Text style={[styles.darText, { color: colors.text }]} numberOfLines={1}>
              {item.workLocation}
            </Text>
          </View>
        )}

        <Text style={[styles.darDescription, { color: colors.text }]} numberOfLines={2}>
          {item.activityDescription}
        </Text>

        <View style={styles.darFooter}>
          <View style={styles.darFooterLeft}>
            <View style={styles.darBadge}>
              <Ionicons name="time-outline" size={14} color={colors.icon} />
              <Text style={[styles.darBadgeText, { color: colors.icon }]}>
                {item.startTime} - {item.endTime} ({item.totalHours}h)
              </Text>
            </View>
            <View style={styles.darBadge}>
              <Ionicons name="folder-outline" size={14} color={colors.icon} />
              <Text style={[styles.darBadgeText, { color: colors.icon }]}>
                {item.taskCategory.replace('_', ' ')}
              </Text>
            </View>
          </View>
          {(isManager || isHR) && (
            <StatusBadge
              status={item.status}
              color={getStatusColor(item.status)}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Daily Activity Reports</Text>
        <TouchableOpacity onPress={() => router.push('/dar/create')}>
          <Ionicons name="add-circle" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <View style={[styles.filtersContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
          <Ionicons name="search" size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search DARs..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersRow}>
          <View style={[styles.filterContainer, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="All Status" value="ALL" />
              <Picker.Item label="Draft" value={DARStatus.DRAFT} />
              <Picker.Item label="Submitted" value={DARStatus.SUBMITTED} />
              <Picker.Item label="Approved" value={DARStatus.APPROVED} />
              <Picker.Item label="Rejected" value={DARStatus.REJECTED} />
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.dateFilterButton, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.icon} />
            <Text style={[styles.dateFilterText, { color: colors.text }]}>
              {startDate ? formatDate(startDate.toISOString()) : 'Start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateFilterButton, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.icon} />
            <Text style={[styles.dateFilterText, { color: colors.text }]}>
              {endDate ? formatDate(endDate.toISOString()) : 'End'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && dars.length === 0 ? (
        <Loading message="Loading DARs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadDARs(true)} />
      ) : dars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>No DARs found</Text>
          <Button
            title="Create DAR"
            onPress={() => router.push('/dar/create')}
            variant="primary"
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={dars}
          renderItem={renderDARItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && dars.length > 0 ? (
              <View style={styles.footerLoader}>
                <Loading message="" />
              </View>
            ) : null
          }
        />
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (date) {
              setStartDate(date);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (date) {
              setEndDate(date);
            }
          }}
        />
      )}
    </View>
  );
}

// Add missing imports
import { Button } from '@/components/ui/Button';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  dateFilterText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  darCard: {
    marginBottom: 12,
    padding: 16,
  },
  darHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  darHeaderLeft: {
    flex: 1,
  },
  darDate: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  employeeId: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  darRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  darText: {
    fontSize: 14,
    flex: 1,
  },
  darDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  darFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  darActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  darFooterLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  darBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  darBadgeText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  footerLoader: {
    padding: 16,
  },
});
