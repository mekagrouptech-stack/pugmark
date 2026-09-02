import React from 'react'
import { Card, Descriptions } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const LeaveRules = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Leave Rules</h1>
          <p className="page-description">Company leave policy and rules</p>
        </div>

        <Card className="card-container">
          <Descriptions title="Leave Policy" bordered column={1}>
            <Descriptions.Item label="Sick Leave">
              Maximum 12 days per year. Medical certificate required for leaves exceeding 3 consecutive days.
            </Descriptions.Item>
            <Descriptions.Item label="Casual Leave">
              Maximum 12 days per year. Cannot be clubbed with other leaves.
            </Descriptions.Item>
            <Descriptions.Item label="Earned Leave">
              Accrued at 1.25 days per month. Can be carried forward up to 30 days.
            </Descriptions.Item>
            <Descriptions.Item label="Compensatory Off">
              Granted for working on holidays or weekends. Must be utilized within 3 months.
            </Descriptions.Item>
            <Descriptions.Item label="Leave Application">
              Leave applications must be submitted at least 2 days in advance. Emergency leaves require manager approval.
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default LeaveRules
