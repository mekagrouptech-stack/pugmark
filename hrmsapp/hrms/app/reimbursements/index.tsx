/**
 * Reimbursements - My Requests
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  reimbursementService,
  ReimbursementRequest,
  ReimbursementStatus,
} from '@/services/reimbursement.service';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/helpers';

const STATUS_COLORS: Record<ReimbursementStatus, string> = {
  Pending: '#F59E0B',
  Approved: '#10B981',
  Rejected: '#EF4444',
};

export default function ReimbursementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await reimbursementService.getMyRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading reimbursements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return <Loading message="Loading reimbursements..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Reimbursements</Text>
        <TouchableOpacity onPress={() => router.push('/reimbursements/apply')}>
          <Ionicons name="add-circle" size={26} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={requests.length === 0 ? styles.emptyWrap : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {requests.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Reimbursement Requests"
            message="Tap + to submit your first reimbursement claim."
          />
        ) : (
          requests.map((req) => {
            const statusColor = STATUS_COLORS[req.status] ?? colors.icon;
            return (
              <Card key={String(req.id)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.typeRow}>
                    <View style={[styles.iconChip, { backgroundColor: colors.tint + '18' }]}>
                      <Ionicons name="receipt-outline" size={18} color={colors.tint} />
                    </View>
                    <View>
                      <Text style={[styles.type, { color: colors.text }]}>
                        {req.requestType}
                      </Text>
                      <Text style={[styles.period, { color: colors.icon }]}>
                        {req.periodFrom ? formatDate(req.periodFrom) : '-'}
                        {req.periodTo ? ` – ${formatDate(req.periodTo)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{req.status}</Text>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <Text style={[styles.amountLabel, { color: colors.icon }]}>Total Amount</Text>
                  <Text style={[styles.amount, { color: colors.text }]}>
                    {formatCurrency(req.totalAmount)}
                  </Text>
                </View>

                {req.expenseDetails?.length > 0 && (
                  <Text style={[styles.items, { color: colors.icon }]}>
                    {req.expenseDetails.length} expense item
                    {req.expenseDetails.length > 1 ? 's' : ''}
                  </Text>
                )}

                {req.status === 'Rejected' && req.rejectionReason ? (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionText}>
                      Rejected: {req.rejectionReason}
                    </Text>
                  </View>
                ) : null}

                {req.createdOn ? (
                  <Text style={[styles.createdOn, { color: colors.icon }]}>
                    Submitted {formatDate(req.createdOn)}
                  </Text>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  card: { margin: 16, marginTop: 0, padding: 18 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: { fontSize: 16, fontWeight: '600' },
  period: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: { fontSize: 13 },
  amount: { fontSize: 18, fontWeight: '700' },
  items: { fontSize: 12, marginTop: 8 },
  rejectionBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  rejectionText: { color: '#B91C1C', fontSize: 12 },
  createdOn: { fontSize: 11, marginTop: 10 },
});
