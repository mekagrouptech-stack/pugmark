import React from 'react'
import { Card, Avatar, Empty, Typography, Tag } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'

const { Text } = Typography

const WorkAnniversaryList = ({ anniversaries = [], loading = false }) => {
  return (
    <Card
      title={
        <span style={{ fontSize: 16, fontWeight: 600, color: '#262626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#faad14' }} />
          Work Anniversaries Today
        </span>
      }
      style={{ borderRadius: 16, border: '1px solid #eef1f6', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)', height: '100%' }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '14px 20px' }}
      bodyStyle={{ padding: '12px 20px' }}
      loading={loading}
    >
      {anniversaries.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No work anniversaries today" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {anniversaries.map((emp) => (
            <div
              key={emp.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: '#fffbe6',
                borderRadius: 10,
                border: '1px solid #ffe58f',
              }}
            >
              <Avatar
                size={40}
                style={{ background: '#faad14', fontWeight: 700, flexShrink: 0 }}
              >
                {emp.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 14, display: 'block' }}>{emp.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {emp.designation || emp.department || emp.employeeCode}
                </Text>
              </div>
              <Tag color="gold" style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>
                {emp.years} {emp.years === 1 ? 'Year' : 'Years'}
              </Tag>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default WorkAnniversaryList
