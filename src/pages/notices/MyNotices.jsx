import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Empty, Badge, Space, message } from 'antd'
import {
  NotificationOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_BASE_URL, STORAGE_BASE_URL } from '../../utils/constants'

const priorityColor = { normal: 'default', important: 'blue', urgent: 'red' }

const MyNotices = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem('hrms_token')

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/notices/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setNotices(data.data || [])
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notices/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch {
      // non-fatal
    }
  }

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notices/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotices((prev) => prev.map((n) => ({ ...n, isRead: true })))
      message.success('All notices marked as read')
    } catch {
      message.error('Could not update notices')
    }
  }

  const unread = notices.filter((n) => !n.isRead).length

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            <NotificationOutlined /> My Notices{' '}
            {unread > 0 && <Badge count={unread} style={{ marginLeft: 8 }} />}
          </h1>
          <p className="page-description">Important notices sent to you by HR / Admin.</p>
        </div>

        <Card
          extra={
            <Space>
              {unread > 0 && (
                <Button size="small" icon={<CheckOutlined />} onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
              <Button size="small" icon={<ReloadOutlined />} onClick={fetchNotices}>
                Refresh
              </Button>
            </Space>
          }
        >
          {notices.length === 0 && !loading ? (
            <Empty description="No notices yet" />
          ) : (
            <List
              loading={loading}
              itemLayout="vertical"
              dataSource={notices}
              pagination={{ pageSize: 8 }}
              renderItem={(n) => (
                <List.Item
                  key={n.id}
                  style={{
                    background: n.isRead ? 'transparent' : 'rgba(67,56,202,0.04)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 8,
                    borderLeft: `4px solid ${
                      n.priority === 'urgent'
                        ? '#dc2626'
                        : n.priority === 'important'
                        ? '#4338ca'
                        : '#cbd5e1'
                    }`,
                  }}
                  actions={[
                    n.attachmentPath && (
                      <a
                        key="pdf"
                        href={`${STORAGE_BASE_URL}${n.attachmentPath}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <PaperClipOutlined /> {n.attachmentName || 'View PDF'}
                      </a>
                    ),
                    !n.isRead && (
                      <a key="read" onClick={() => markRead(n.id)}>
                        <CheckOutlined /> Mark as read
                      </a>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {!n.isRead && <Badge status="processing" />}
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{n.title}</span>
                        <Tag color={priorityColor[n.priority] || 'default'}>
                          {String(n.priority).toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        From {n.senderName || 'HR'} ·{' '}
                        {n.createdAt ? dayjs(n.createdAt).format('DD MMM YYYY, HH:mm') : ''}
                      </span>
                    }
                  />
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{n.message}</div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default MyNotices
