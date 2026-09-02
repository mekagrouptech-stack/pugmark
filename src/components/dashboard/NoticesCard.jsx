import React, { useEffect, useState } from 'react'
import { Card, List, Tag, Badge, Empty, Button, Skeleton } from 'antd'
import { NotificationOutlined, PaperClipOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { API_BASE_URL } from '../../utils/constants'

// Matches the accent colours the My Notices page uses, so a notice looks the
// same wherever it is read.
const PRIORITY_ACCENT = { urgent: '#dc2626', important: '#4338ca', normal: '#cbd5e1' }
const PRIORITY_TAG = { urgent: 'red', important: 'blue', normal: 'default' }

// The dashboard shows a preview, not the archive — the rest are one click away.
const PREVIEW_COUNT = 4

const cardStyle = {
  borderRadius: 16,
  border: '1px solid #eef1f6',
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
  height: '100%',
}

const NoticesCard = () => {
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notices/my`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token')}` },
        })
        const data = await res.json()
        if (!cancelled && data.success) setNotices(data.data || [])
      } catch {
        // Non-fatal: an unreachable notices API should not blank the dashboard.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const unread = notices.filter((n) => !n.isRead).length
  const preview = notices.slice(0, PREVIEW_COUNT)

  return (
    <Card
      title={
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          <NotificationOutlined style={{ marginRight: 8, color: '#4338ca' }} />
          Notices
          {unread > 0 && <Badge count={unread} style={{ marginLeft: 8 }} />}
        </span>
      }
      extra={
        notices.length > 0 && (
          <Button type="link" size="small" onClick={() => navigate('/notices/my')} style={{ padding: 0 }}>
            View all <ArrowRightOutlined />
          </Button>
        )
      }
      style={cardStyle}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
      bodyStyle={{ padding: '8px 24px 16px' }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : preview.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notices yet" />
      ) : (
        <List
          dataSource={preview}
          split={false}
          renderItem={(n) => (
            <List.Item
              key={n.id}
              onClick={() => navigate('/notices/my')}
              style={{
                cursor: 'pointer',
                display: 'block',
                padding: '10px 12px',
                marginTop: 8,
                borderRadius: 8,
                background: n.isRead ? 'transparent' : 'rgba(67,56,202,0.04)',
                borderLeft: `4px solid ${PRIORITY_ACCENT[n.priority] || PRIORITY_ACCENT.normal}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!n.isRead && <Badge status="processing" />}
                <span
                  style={{
                    fontWeight: 600,
                    color: '#0f172a',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {n.title}
                </span>
                {n.attachmentPath && <PaperClipOutlined style={{ color: '#94a3b8' }} />}
                <Tag color={PRIORITY_TAG[n.priority] || 'default'} style={{ marginInlineEnd: 0 }}>
                  {String(n.priority || 'normal').toUpperCase()}
                </Tag>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.message}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                From {n.senderName || 'HR'}
                {n.createdAt ? ` · ${dayjs(n.createdAt).format('DD MMM YYYY, HH:mm')}` : ''}
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

export default NoticesCard
