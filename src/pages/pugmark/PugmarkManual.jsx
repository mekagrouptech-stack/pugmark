import React from 'react'
import { Card, Typography, Collapse, Tag, Anchor, Row, Col, Alert } from 'antd'
import {
  ClockCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  NotificationOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'

const { Title, Paragraph, Text } = Typography

/**
 * Pugmark HRMS user manual.
 *
 * Documents how the system actually behaves rather than describing features in
 * the abstract — the rules below (first/last biometric punch, the 10:15 late
 * mark, the fixed CTC split, the ₹12,00,000 TDS threshold) are the ones
 * implemented in backend/utils/salaryStructure.js and the attendance services,
 * so this page and the code should be changed together.
 */

// Each section renders as a collapsible panel with its own anchor target.
const SECTIONS = [
  {
    key: 'attendance',
    icon: <ClockCircleOutlined />,
    title: 'Attendance',
    tag: 'Everyone',
    body: (
      <>
        <Paragraph>
          Attendance comes from two sources: the <Text strong>biometric device</Text> at the office,
          and <Text strong>app punches</Text> recorded with your location.
        </Paragraph>
        <Title level={5}>How your in/out times are decided</Title>
        <Paragraph>
          For each day, your <Text strong>first punch is taken as Punch In</Text> and your{' '}
          <Text strong>last punch as Punch Out</Text>. Any punches in between — stepping out for
          lunch, a site visit — are recorded but do not change the day&apos;s in/out times or your
          total hours. The device&apos;s own in/out label is ignored, because the terminal reports
          every punch the same way unless the in/out key is pressed.
        </Paragraph>
        <Title level={5}>Late marks</Title>
        <Paragraph>
          A first punch after <Text strong>10:15 AM IST</Text> is a late mark. You can see your own
          in <Text code>My Attendance</Text>; managers see the team&apos;s under{' '}
          <Text code>My Team &rsaquo; List Late Mark</Text>.
        </Paragraph>
        <Title level={5}>Missing or wrong punch?</Title>
        <Paragraph>
          Raise it through <Text code>My Attendance &rsaquo; Request Attendance Regulation</Text>.
          It goes to your reporting manager, and once approved the corrected day appears in your
          records and counts towards payroll.
        </Paragraph>
      </>
    ),
  },
  {
    key: 'leaves',
    icon: <CalendarOutlined />,
    title: 'Leaves',
    tag: 'Everyone',
    body: (
      <>
        <Paragraph>
          Apply from <Text code>My Leaves &rsaquo; Apply for Leave</Text>. Requests route to your
          reporting manager and, where configured, to HR for a second approval — you can follow the
          status in <Text code>My Leave History</Text>.
        </Paragraph>
        <Paragraph>
          <Text code>My Leave Balance</Text> shows what you have left, and{' '}
          <Text code>Holiday List</Text> shows the company holiday calendar. Days approved as leave
          are not treated as loss of pay when payroll runs.
        </Paragraph>
      </>
    ),
  },
  {
    key: 'salary',
    icon: <DollarOutlined />,
    title: 'Salary & payslips',
    tag: 'Everyone',
    body: (
      <>
        <Paragraph>
          <Text code>Salary &rsaquo; My Salary</Text> shows your full CTC breakup, and{' '}
          <Text code>My Payslips</Text> holds each month&apos;s slip for download.
        </Paragraph>
        <Title level={5}>How the structure is built</Title>
        <Paragraph>
          Every employee follows the same company structure, calculated from a single Monthly CTC
          figure. As a share of Gross: <Text strong>Basic 50%</Text>, <Text strong>HRA 25%</Text>,{' '}
          <Text strong>Special Allowance 15%</Text> and <Text strong>Bonus 10%</Text>. Gratuity is
          4.81% of Basic. These percentages are fixed by policy and cannot be changed per employee.
        </Paragraph>
        <Title level={5}>Deductions</Title>
        <Paragraph>
          Take-home is Gross minus Employee PF, Professional Tax and TDS. PF is ₹1,800 a month when
          the with-PF structure applies; Professional Tax is ₹200 a month.{' '}
          <Text strong>TDS applies only when annual CTC is above ₹12,00,000</Text> — below that no
          TDS is deducted and it does not appear on your payslip at all.
        </Paragraph>
      </>
    ),
  },
  {
    key: 'reimbursements',
    icon: <FileTextOutlined />,
    title: 'Reimbursements',
    tag: 'Everyone',
    body: (
      <Paragraph>
        Claim under <Text code>Reimbursements</Text> — <Text strong>Non-CTC</Text> for general
        expenses and <Text strong>Travel</Text> for trip costs. Attach your bills, submit, and track
        progress in <Text code>My Reimbursement Request</Text>. Approvers see everything waiting on
        them in <Text code>My Team Reimbursement Request</Text>.
      </Paragraph>
    ),
  },
  {
    key: 'dar',
    icon: <FileTextOutlined />,
    title: 'Daily Activity Report (DAR)',
    tag: 'Everyone',
    body: (
      <Paragraph>
        Log what you worked on each day under <Text code>DAR</Text>, against a client and project.
        Submitted reports go to your approver via <Text code>Pending Approvals</Text>, and the
        utilization views (<Text code>My Utilization</Text>, <Text code>Gantt Chart</Text>,{' '}
        <Text code>Calendar View</Text>) summarise where your time went.
      </Paragraph>
    ),
  },
  {
    key: 'notices',
    icon: <NotificationOutlined />,
    title: 'Notices',
    tag: 'Everyone',
    body: (
      <Paragraph>
        Company announcements arrive in <Text code>Notices &rsaquo; My Notices</Text>, and also by
        email plus a bell notification. Admin and HR can publish to everyone or to selected
        employees, with an optional PDF attachment, from <Text code>Send Notice</Text>.
      </Paragraph>
    ),
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    title: 'Your profile',
    tag: 'Everyone',
    body: (
      <Paragraph>
        Keep your details current under <Text code>My Profile</Text> — basic, personal, contact,
        educational and employment information, plus documents. Managers and HR can see how complete
        each record is from the <Text strong>Account Completed</Text> column on{' '}
        <Text code>My Team &rsaquo; My Team Members</Text>, so gaps are easy to spot and chase.
      </Paragraph>
    ),
  },
  {
    key: 'manager',
    icon: <TeamOutlined />,
    title: 'For managers',
    tag: 'Manager / HOD',
    body: (
      <>
        <Paragraph>
          <Text code>My Team</Text> is the hub: team members and their profile completeness, daily
          and period attendance, late marks, leave history, and every request awaiting your
          approval — attendance regulations, comp-offs, leaves and reimbursements.
        </Paragraph>
        <Paragraph>
          Approvals waiting on you are badged in the sidebar, so you can see at a glance what is
          outstanding without opening each screen.
        </Paragraph>
      </>
    ),
  },
  {
    key: 'hr',
    icon: <SettingOutlined />,
    title: 'For HR & Admin',
    tag: 'HR / Admin',
    body: (
      <>
        <Title level={5}>Setting a salary structure</Title>
        <Paragraph>
          Go to <Text code>HR Manager &rsaquo; Salary Structures</Text>, pick an employee, then set{' '}
          <Text strong>Monthly CTC</Text> and whether <Text strong>PF applies</Text>. For anyone
          above ₹12,00,000 annual CTC a <Text strong>Monthly TDS</Text> field also appears. The
          tables update live as you type and nothing is stored until you press Save.
        </Paragraph>
        <Title level={5}>Running payroll</Title>
        <Paragraph>
          <Text code>Payroll</Text> generates a month&apos;s salary from the structure, prorated by
          attendance: earnings scale with payable days, while Professional Tax and TDS are charged
          in full. Biometric punches are rolled into attendance before the run, so import the
          month&apos;s punches first.
        </Paragraph>
        <Title level={5}>Biometric imports</Title>
        <Paragraph>
          The office terminal pushes punches automatically. To pull them on demand, use{' '}
          <Text code>Attendance &rsaquo; Biometric Attendance</Text> and press{' '}
          <Text strong>Import Punches</Text> — the imported day is written into attendance
          immediately, applying the first-in / last-out rule.
        </Paragraph>
        <Title level={5}>People and access</Title>
        <Paragraph>
          Create and manage employees under <Text code>User Management</Text>; new joiners are
          emailed their login details automatically. Roles and permissions live in{' '}
          <Text code>Access Control Manager</Text>, and departments, designations and employee-code
          series under the master screens.
        </Paragraph>
      </>
    ),
  },
]

const PugmarkManual = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Pugmark Manual</h1>
          <p className="page-description">
            How to use Pugmark HRMS — attendance, leaves, salary and approvals
          </p>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={18}>
            <Card className="card-container" style={{ marginBottom: 20 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                Welcome to Pugmark HRMS
              </Title>
              <Paragraph>
                Everything you need day to day lives in the left sidebar, grouped by area. What you
                can see depends on your role: employees get their own attendance, leaves and salary;
                managers additionally get their team and its approvals; HR and Admin get payroll and
                the company-wide settings.
              </Paragraph>
              <Alert
                type="info"
                showIcon
                message="Two rules worth knowing"
                description={
                  <>
                    Your first punch of the day is your Punch In and your last is your Punch Out —
                    punches in between do not change your hours. And a first punch after 10:15 AM
                    IST counts as a late mark.
                  </>
                }
              />
            </Card>

            <Collapse
              defaultActiveKey={['attendance']}
              items={SECTIONS.map((section) => ({
                key: section.key,
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {section.icon}
                    <span style={{ fontWeight: 600 }}>{section.title}</span>
                    <Tag color={section.tag === 'Everyone' ? 'blue' : 'purple'}>{section.tag}</Tag>
                  </span>
                ),
                children: section.body,
              }))}
            />

            <Card className="card-container" style={{ marginTop: 20 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                Need help?
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Raise a ticket in <Text code>Helpdesk</Text>, or use the{' '}
                <Text code>Useful Links</Text> shortcuts to talk to HR, Admin or Medical directly.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card className="card-container" title="On this page">
              <Anchor
                affix={false}
                items={SECTIONS.map((section) => ({
                  key: section.key,
                  href: `#${section.key}`,
                  title: section.title,
                }))}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default PugmarkManual
