import React, { useEffect } from 'react'
import { Card, List } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDarList } from '../../features/dar/darSlice'

/**
 * Report Pipeline Card - Pugmark Dashboard Style
 * Shows Submitted/Approved/Pending counts and recent reports list
 */
const ReportPipelineCard = ({ workingReports = null, loading = false }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { darList = [] } = useSelector((state) => state.dar) || {}

  useEffect(() => {
    dispatch(fetchDarList({ page: 1, limit: 5 }))
  }, [dispatch])

  const submitted = workingReports?.submitted ?? 0
  const approved = workingReports?.approved ?? 0
  const pending = workingReports?.pending ?? 0
  const total = workingReports?.total ?? 0

  const recentReports = (Array.isArray(darList) ? darList : []).slice(0, 5)

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Card
      title={
        <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
          Report Pipeline
        </span>
      }
      style={{
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        height: '100%',
      }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
      bodyStyle={{ padding: '20px 24px' }}
      loading={loading}
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 70 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>{submitted}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>Submitted</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 70 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{approved}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>Approved</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 70 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}>{pending}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>Pending</div>
        </div>
      </div>

      <List
        size="small"
        dataSource={recentReports}
        locale={{ emptyText: 'No reports yet' }}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: 'pointer', padding: '10px 0' }}
            onClick={() => navigate('/dar/list')}
          >
            <List.Item.Meta
              avatar={<UploadOutlined style={{ fontSize: 16, color: '#1890ff' }} />}
              title={
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {item.project || item.projectName || 'Weekly Report'}
                </span>
              }
              description={
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {item.status || 'Submitted'}{' '}
                  {(item.updatedAt || item.submittedAt || item.createdAt) &&
                    formatTimeAgo(item.updatedAt || item.submittedAt || item.createdAt)}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default ReportPipelineCard
