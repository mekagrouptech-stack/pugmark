/**
 * DAR Detail Screen - View/Edit DAR details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { darService } from '@/services/dar.service';
import { DAR, DARStatus, UserRole } from '@/types';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { formatDate, formatDateTime } from '@/utils/helpers';
import { isAdmin, canManageEmployees } from '@/utils/helpers';

export default function DARDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const [dar, setDar] = useState<DAR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isManager = user?.role === UserRole.MANAGER;
  const isHR = isAdmin(user?.role) || canManageEmployees(user?.role);
  const isOwner = dar?.userId === user?.id;
  const canEdit = isOwner && (dar?.status === DARStatus.DRAFT || (dar?.status === DARStatus.SUBMITTED && new Date(dar.date) >= new Date(new Date().setHours(0, 0, 0, 0))));
  const canApprove = isManager && dar?.status === DARStatus.SUBMITTED;

  useEffect(() => {
    loadDAR();
  }, [id]);

  const loadDAR = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await darService.getById(id);
      setDar(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load DAR');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve DAR',
      'Are you sure you want to approve this Daily Activity Report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setShowCommentModal(true);
            setComment('');
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject DAR',
      'Are you sure you want to reject this Daily Activity Report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: () => {
            setShowCommentModal(true);
            setComment('');
          },
        },
      ]
    );
  };

  const submitAction = async (action: 'approve' | 'reject') => {
    if (!dar) return;

    try {
      setActionLoading(true);
      if (action === 'approve') {
        await darService.approve({
          darId: dar.id,
          comments: comment || undefined,
        });
        Alert.alert('Success', 'DAR approved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        if (!comment.trim()) {
          Alert.alert('Error', 'Please provide a rejection reason');
          return;
        }
        await darService.reject({
          darId: dar.id,
          reason: comment,
        });
        Alert.alert('Success', 'DAR rejected successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
      setShowCommentModal(false);
      loadDAR();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!dar) return;

    Alert.alert(
      'Submit DAR',
      'Are you sure you want to submit this DAR for approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setActionLoading(true);
              await darService.submit(dar.id);
              Alert.alert('Success', 'DAR submitted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to submit DAR');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>DAR Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <Loading message="Loading DAR..." />
      </View>
    );
  }

  if (error || !dar) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>DAR Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ErrorState message={error || 'DAR not found'} onRetry={loadDAR} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>DAR Details</Text>
        {canEdit && (
          <TouchableOpacity onPress={() => router.push(`/dar/${dar.id}/edit`)}>
            <Ionicons name="create-outline" size={24} color={colors.tint} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(dar.date)}
            </Text>
            <StatusBadge status={dar.status} color={getStatusColor(dar.status)} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Employee Information</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Name:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{dar.employeeName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Employee ID:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{dar.employeeId}</Text>
            </View>
            {dar.department && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Department:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{dar.department}</Text>
              </View>
            )}
            {dar.designation && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Designation:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{dar.designation}</Text>
              </View>
            )}
            {dar.reportingManagerName && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Reporting Manager:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {dar.reportingManagerName}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Details</Text>
            {dar.projectName && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color={colors.icon} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Project / Site</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{dar.projectName}</Text>
                </View>
              </View>
            )}
            {dar.workLocation && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color={colors.icon} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Work Location</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{dar.workLocation}</Text>
                  {dar.workLocationLatitude && dar.workLocationLongitude && (
                    <Text style={[styles.detailSubtext, { color: colors.icon }]}>
                      {dar.workLocationLatitude.toFixed(6)}, {dar.workLocationLongitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="folder-outline" size={20} color={colors.icon} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Task Category</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {dar.taskCategory.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={colors.icon} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Time</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {dar.startTime} - {dar.endTime} ({dar.totalHours} hours)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Description</Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {dar.activityDescription}
            </Text>
          </View>

          {dar.remarks && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Remarks</Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>{dar.remarks}</Text>
            </View>
          )}

          {dar.issuesFaced && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Issues Faced</Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>{dar.issuesFaced}</Text>
            </View>
          )}

          {dar.attachments && dar.attachments.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Attachments</Text>
              {dar.attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.id}
                  style={[styles.attachmentItem, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}
                >
                  <Ionicons
                    name={attachment.type === 'IMAGE' ? 'image-outline' : 'document-outline'}
                    size={20}
                    color={colors.icon}
                  />
                  <Text style={[styles.attachmentText, { color: colors.text }]} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.icon} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status Information</Text>
            {dar.submittedAt && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Submitted At:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDateTime(dar.submittedAt)}
                </Text>
              </View>
            )}
            {dar.approvedAt && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Approved At:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDateTime(dar.approvedAt)}
                </Text>
              </View>
            )}
            {dar.rejectedAt && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Rejected At:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDateTime(dar.rejectedAt)}
                </Text>
              </View>
            )}
            {dar.rejectionReason && (
              <View style={styles.rejectionBox}>
                <Text style={[styles.rejectionLabel, { color: '#EF4444' }]}>Rejection Reason:</Text>
                <Text style={[styles.rejectionText, { color: colors.text }]}>
                  {dar.rejectionReason}
                </Text>
              </View>
            )}
            {dar.managerComments && (
              <View style={styles.commentBox}>
                <Text style={[styles.commentLabel, { color: colors.icon }]}>Manager Comments:</Text>
                <Text style={[styles.commentText, { color: colors.text }]}>
                  {dar.managerComments}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {dar.status === DARStatus.DRAFT && isOwner && (
          <View style={styles.actionContainer}>
            <Button
              title="Submit DAR"
              onPress={handleSubmit}
              variant="primary"
              loading={actionLoading}
              fullWidth
            />
          </View>
        )}

        {canApprove && (
          <View style={styles.actionContainer}>
            <Button
              title="Approve"
              onPress={handleApprove}
              variant="primary"
              loading={actionLoading}
              style={styles.actionButton}
            />
            <Button
              title="Reject"
              onPress={handleReject}
              variant="danger"
              loading={actionLoading}
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {canApprove ? 'Add Comment (Optional)' : 'Rejection Reason *'}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.icon + '40',
                  color: colors.text,
                },
              ]}
              placeholder={canApprove ? 'Add comments...' : 'Enter rejection reason'}
              placeholderTextColor={colors.icon}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowCommentModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={canApprove ? 'Approve' : 'Reject'}
                onPress={() => submitAction(canApprove ? 'approve' : 'reject')}
                variant={canApprove ? 'primary' : 'danger'}
                loading={actionLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  attachmentText: {
    flex: 1,
    fontSize: 14,
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
  },
  commentBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
