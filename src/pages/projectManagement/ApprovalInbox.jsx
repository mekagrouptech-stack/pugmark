import React, { useEffect, useState } from 'react'
import { Card, Table, Space, Modal, Form, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchPendingApprovals, processApproval } from '../../features/projectManagement/approvalSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import ActionButton from '../../components/common/ActionButton'
import FormButtonGroup from '../../components/common/FormButtonGroup'
import usePagination from '../../hooks/usePagination'
import { getTablePagination } from '../../components/common/TablePagination'

const { TextArea } = Input

const ApprovalInbox = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pendingApprovals, loading } = useSelector((state) => state.approval)
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [approvalAction, setApprovalAction] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  // Pagination hook
  const { pagination, handleTableChange, setTotal } = usePagination(1, 10)

  useEffect(() => {
    dispatch(fetchPendingApprovals())
  }, [dispatch])

  useEffect(() => {
    if (pendingApprovals) {
      setTotal(pendingApprovals.length)
    }
  }, [pendingApprovals, setTotal])

  const handleApproval = (project, action) => {
    setSelectedProject(project)
    setApprovalAction(action)
    setApprovalModalVisible(true)
  }

  const onApprovalSubmit = async (values) => {
    if (submitting) return // Prevent duplicate submissions
    
    try {
      setSubmitting(true)
      await dispatch(
        processApproval({
          projectId: selectedProject.id,
          action: approvalAction,
          comment: values.comment,
        })
      ).unwrap()
      setApprovalModalVisible(false)
      form.resetFields()
      dispatch(fetchPendingApprovals())
      message.success('Approval processed successfully')
    } catch (error) {
      message.error(error?.message || 'Failed to process approval')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `₹${budget?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Created By',
      dataIndex: 'createdByName',
      key: 'createdByName',
    },
    {
      title: 'Created On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <ActionButton
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/project/${record.id}`)}
            size="small"
          >
            View
          </ActionButton>
          <ActionButton
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApproval(record, 'approve')}
          >
            Approve
          </ActionButton>
          <ActionButton
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleApproval(record, 'reject')}
          >
            Reject
          </ActionButton>
          <ActionButton
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleApproval(record, 'send_back')}
          >
            Send Back
          </ActionButton>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Approval Inbox</h1>
          <p className="page-description">Review and approve pending projects</p>
        </div>

        <Card className="card-container">
          <Table
            columns={columns}
            dataSource={pendingApprovals}
            loading={loading}
            rowKey="id"
            pagination={getTablePagination({
              ...pagination,
              total: pendingApprovals?.length || 0,
            })}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            locale={{ emptyText: 'No pending approvals' }}
          />
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
              <FormButtonGroup align="end">
                <ActionButton
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  disabled={submitting}
                >
                  Submit
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    setApprovalModalVisible(false)
                    form.resetFields()
                  }}
                  disabled={submitting}
                >
                  Cancel
                </ActionButton>
              </FormButtonGroup>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ApprovalInbox
