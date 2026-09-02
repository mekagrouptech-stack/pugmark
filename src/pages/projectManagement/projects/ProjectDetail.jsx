import React, { useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, Timeline, Modal, Form, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined, RollbackOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchProjectById, approveProject, clearSelectedProject } from '../../../features/projectManagement/projectSlice'
import { PROJECT_ROLES, APPROVAL_HIERARCHY } from '../../../utils/constants'
import DashboardLayout from '../../../layouts/DashboardLayout'

const { TextArea } = Input

const ProjectDetail = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { selectedProject, loading } = useSelector((state) => state.project)
  const { user } = useSelector((state) => state.auth)
  const [approvalModalVisible, setApprovalModalVisible] = React.useState(false)
  const [approvalAction, setApprovalAction] = React.useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id))
    }
    return () => {
      dispatch(clearSelectedProject())
    }
  }, [dispatch, id])

  const canApprove = () => {
    if (!selectedProject || !user) return false
    return selectedProject.currentApprover === user.role
  }

  const handleApproval = (action) => {
    setApprovalAction(action)
    setApprovalModalVisible(true)
  }

  const onApprovalSubmit = async (values) => {
    try {
      await dispatch(
        approveProject({
          id: selectedProject.id,
          action: approvalAction,
          comment: values.comment,
        })
      ).unwrap()
      setApprovalModalVisible(false)
      form.resetFields()
      dispatch(fetchProjectById(id))
    } catch (error) {
      message.error('Failed to process approval')
    }
  }

  if (loading && !selectedProject) {
    return (
      <DashboardLayout>
        <Card loading={true} />
      </DashboardLayout>
    )
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <Card>
          <p>Project not found</p>
          <Button onClick={() => navigate('/project/list')}>Back to List</Button>
        </Card>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status) => {
    const colorMap = {
      approved: 'green',
      submitted: 'blue',
      hod_review: 'orange',
      hr_review: 'purple',
      head_hr_review: 'cyan',
      rejected: 'red',
      draft: 'default',
    }
    return colorMap[status] || 'default'
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/project/list')}>
              Back
            </Button>
            <h1 className="page-title" style={{ margin: 0 }}>
              {selectedProject.name}
            </h1>
          </Space>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card>
              <Descriptions title="Project Information" bordered column={2}>
                <Descriptions.Item label="Project Name">{selectedProject.name}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedProject.status)}>
                    {selectedProject.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {selectedProject.description}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  {dayjs(selectedProject.startDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  {dayjs(selectedProject.endDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Budget">
                  ₹{selectedProject.budget?.toLocaleString('en-IN') || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <Tag>{selectedProject.priority?.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created By">{selectedProject.createdByName}</Descriptions.Item>
                <Descriptions.Item label="Current Approver">
                  {selectedProject.currentApprover
                    ? selectedProject.currentApprover.toUpperCase().replace('_', ' ')
                    : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {canApprove() && (
              <Card title="Approval Actions">
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleApproval('approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleApproval('reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    icon={<RollbackOutlined />}
                    onClick={() => handleApproval('send_back')}
                  >
                    Send Back
                  </Button>
                </Space>
              </Card>
            )}

            <Card title="Approval History">
              <Timeline>
                {selectedProject.approvalHistory?.map((history, index) => (
                  <Timeline.Item
                    key={index}
                    color={
                      history.action === 'approve'
                        ? 'green'
                        : history.action === 'reject'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    <div>
                      <strong>{history.action.toUpperCase()}</strong> by {history.by} ({history.byRole})
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      {dayjs(history.timestamp).format('DD/MM/YYYY HH:mm')}
                    </div>
                    {history.comment && <div style={{ marginTop: 4 }}>{history.comment}</div>}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Space>
        </Card>

        <Modal
          title={`${approvalAction?.toUpperCase()} Project`}
          open={approvalModalVisible}
          onCancel={() => {
            setApprovalModalVisible(false)
            form.resetFields()
          }}
          footer={null}
        >
          <Form form={form} onFinish={onApprovalSubmit} layout="vertical">
            <Form.Item
              name="comment"
              label="Comment"
              rules={[{ required: true, message: 'Please enter a comment' }]}
            >
              <TextArea rows={4} placeholder="Enter your comment" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                <Button
                  onClick={() => {
                    setApprovalModalVisible(false)
                    form.resetFields()
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ProjectDetail
