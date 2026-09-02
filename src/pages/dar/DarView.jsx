import React, { useEffect, useState } from 'react'
import { Card, Descriptions, Tag, Timeline, Button, Space, Typography, Modal, Input, message } from 'antd'
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchDarById, clearSelectedDar, approveDar, rejectDar } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { Title, Text } = Typography
const { TextArea } = Input

const DarView = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { selectedDar, loading } = useSelector((state) => state.dar)
  const { user } = useSelector((state) => state.auth)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveComments, setApproveComments] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (id) {
      dispatch(fetchDarById(id))
    }
    return () => {
      dispatch(clearSelectedDar())
    }
  }, [dispatch, id])

  const getStatusColor = (status) => {
    const colorMap = {
      Draft: 'default',
      Submitted: 'processing',
      Approved: 'success',
      Rejected: 'error',
    }
    return colorMap[status] || 'default'
  }

  const getCategoryColor = (category) => {
    const colorMap = {
      Design: 'purple',
      Engineering: 'blue',
      Site: 'green',
      QAQC: 'orange',
      Admin: 'cyan',
    }
    return colorMap[category] || 'default'
  }

  const getStatusColorForActivity = (status) => {
    const colorMap = {
      Completed: 'green',
      'In Progress': 'blue',
      Blocked: 'red',
    }
    return colorMap[status] || 'default'
  }

  if (loading && !selectedDar) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <Card loading={true} />
        </div>
      </DashboardLayout>
    )
  }

  if (!selectedDar) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <Card>
            <p>DAR not found</p>
            <Button onClick={() => navigate('/dar/list')}>Back to List</Button>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const canEdit = selectedDar.status === 'Draft' || selectedDar.status === 'Rejected'

  const isResponsiblePerson =
    user &&
    (Number(selectedDar.reportingManagerId) === Number(user.id) ||
      ['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(user.role))
  const canApprove = isResponsiblePerson && selectedDar.status === 'Submitted'

  const handleApprove = () => {
    setApproveModalOpen(true)
  }

  const handleApproveConfirm = () => {
    dispatch(approveDar({ id: selectedDar.id, comments: approveComments }))
    setApproveModalOpen(false)
    setApproveComments('')
  }

  const handleReject = () => {
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection')
      return
    }
    dispatch(rejectDar({ id: selectedDar.id, reason: rejectReason }))
    setRejectModalOpen(false)
    setRejectReason('')
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dar/list')}>
              Back
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              DAR Details
            </Title>
          </Space>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card>
              <Descriptions title="DAR Information" bordered column={2}>
                <Descriptions.Item label="Date">
                  {dayjs(selectedDar.date).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Project">{selectedDar.project}</Descriptions.Item>
                <Descriptions.Item label="Total Hours">
                  <Text strong>{selectedDar.totalHours} hrs</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedDar.status)}>{selectedDar.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created On">
                  {dayjs(selectedDar.createdAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                {selectedDar.submittedAt && (
                  <Descriptions.Item label="Submitted On">
                    {dayjs(selectedDar.submittedAt).format('DD/MM/YYYY HH:mm')}
                  </Descriptions.Item>
                )}
                {selectedDar.approvedAt && (
                  <>
                    <Descriptions.Item label="Approved On">
                      {dayjs(selectedDar.approvedAt).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Approved By">
                      {selectedDar.approvedBy || 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </Card>

            <Card title="Activities Timeline">
              <Timeline>
                {selectedDar.activities?.map((activity, index) => (
                  <Timeline.Item key={activity.id || index} color={getCategoryColor(activity.category)}>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div>
                          <Title level={5} style={{ margin: 0 }}>
                            {activity.taskTitle}
                          </Title>
                          <Space style={{ marginTop: 4 }}>
                            <Tag color={getCategoryColor(activity.category)}>{activity.category}</Tag>
                            <Tag color={getStatusColorForActivity(activity.status)}>
                              {activity.status}
                            </Tag>
                          </Space>
                        </div>
                        <Text>{activity.description}</Text>
                        <div>
                          <Text type="secondary">
                            {activity.startTime && activity.endTime
                              ? `${activity.startTime} - ${activity.endTime}`
                              : ''}{' '}
                            ({activity.hoursSpent} hrs)
                          </Text>
                        </div>
                        {activity.blockers && (
                          <div>
                            <Text strong>Blockers: </Text>
                            <Text type="danger">{activity.blockers}</Text>
                          </div>
                        )}
                      </Space>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            {selectedDar.remarks && (
              <Card title="Remarks">
                <Text>{selectedDar.remarks}</Text>
              </Card>
            )}

            {selectedDar.approvalComments && (
              <Card title="Approval Comments">
                <Text>{selectedDar.approvalComments}</Text>
              </Card>
            )}

            {(canEdit || canApprove) && (
              <Card>
                <Space wrap>
                  {canEdit && (
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/dar/edit/${id}`)}
                    >
                      Edit DAR
                    </Button>
                  )}
                  {canApprove && (
                    <>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={handleApprove}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      >
                        Approve
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={handleReject}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </Space>
              </Card>
            )}

            <Modal
              title="Approve DAR"
              open={approveModalOpen}
              onCancel={() => {
                setApproveModalOpen(false)
                setApproveComments('')
              }}
              onOk={handleApproveConfirm}
              okText="Approve"
            >
              <p style={{ marginBottom: 12 }}>Add optional comments for the employee:</p>
              <TextArea
                rows={3}
                placeholder="Comments (optional)"
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
              />
            </Modal>

            <Modal
              title="Reject DAR"
              open={rejectModalOpen}
              onCancel={() => {
                setRejectModalOpen(false)
                setRejectReason('')
              }}
              onOk={handleRejectConfirm}
              okText="Reject"
              okButtonProps={{ danger: true }}
            >
              <p style={{ marginBottom: 12 }}>Please provide a reason for rejection (required):</p>
              <TextArea
                rows={3}
                placeholder="Reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </Modal>
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DarView
