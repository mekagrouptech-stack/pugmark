import React from 'react'
import { Card } from 'antd'
import { useLocation } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

const DAR_SUBPAGES = {
  '/dar/client': {
    title: 'Client',
    description: 'Manage clients for daily activity and timesheet.',
  },
  '/dar/project': {
    title: 'Project',
    description: 'View and filter DAR and timesheet by project.',
  },
  '/dar/team-timesheet': {
    title: "My Team's Timesheet",
    description: "View and manage your team's timesheet entries.",
  },
  '/dar/edit-timesheet': {
    title: 'Edit Timesheet',
    description: 'Edit existing timesheet entries.',
  },
  '/dar/day-to-day': {
    title: 'Day-to-Day Timesheet',
    description: 'Daily time entry and view by day.',
  },
  '/dar/incomplete': {
    title: 'Incomplete Timesheets',
    description: 'Review and complete pending timesheet entries.',
  },
  '/dar/import': {
    title: 'Import Timesheet',
    description: 'Import timesheet data from file.',
  },
  '/dar/my-utilization': {
    title: 'My Utilization',
    description: 'View your utilization and capacity.',
  },
  '/dar/team-utilization': {
    title: 'My Team Utilization',
    description: "View your team's utilization and capacity.",
  },
}

const DarSubPage = () => {
  const { pathname } = useLocation()
  const config = DAR_SUBPAGES[pathname] || {
    title: 'DAR',
    description: 'Daily Activity Report.',
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{config.title}</h1>
          <p className="page-description">{config.description}</p>
        </div>
        <Card className="card-container">
          <p style={{ color: '#8c8c8c' }}>Content for this section can be added here.</p>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DarSubPage
