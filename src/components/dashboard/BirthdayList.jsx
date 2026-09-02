import React from 'react'
import { Card, Avatar, Empty, Typography } from 'antd'
import { GiftOutlined } from '@ant-design/icons'

const { Text } = Typography

const BirthdayList = ({ birthdays = [], loading = false }) => {
  return (
    <Card
      title={
        <span style={{ fontSize: 16, fontWeight: 600, color: '#262626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GiftOutlined style={{ color: '#eb2f96' }} />
          Birthdays Today
        </span>
      }
      style={{ borderRadius: 16, border: '1px solid #eef1f6', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)', height: '100%' }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '14px 20px' }}
      bodyStyle={{ padding: '12px 20px' }}
      loading={loading}
    >
      {birthdays.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No birthdays today" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {birthdays.map((emp) => (
            <div
              key={emp.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: '#fff0f6',
                borderRadius: 10,
                border: '1px solid #ffadd2',
              }}
            >
              <Avatar
                size={40}
                style={{ background: '#eb2f96', fontWeight: 700, flexShrink: 0 }}
              >
                {emp.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 14, display: 'block' }}>{emp.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {emp.designation || emp.department || emp.employeeCode}
                </Text>
              </div>
              <GiftOutlined style={{ fontSize: 20, color: '#eb2f96' }} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default BirthdayList
