import React, { useEffect, useState } from 'react'
import { Badge, Dropdown, List, Typography, Button } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import socketService from '../services/socketService'
import { STORAGE_KEYS } from '../utils/constants'
import { fetchLeaveBalance, fetchPendingApprovalLeaves } from '../features/leave/leaveSlice'
import { fetchAttendance } from '../features/attendance/attendanceSlice'
import { fetchDashboardData } from '../features/dashboard/dashboardSlice'
import { PROJECT_ROLES } from '../utils/constants'
import {
  ensureNotificationPermission,
  showBrowserNotification,
  getNotificationPermission,
  isNotificationSupported,
} from '../utils/pushNotifications'
import appLogo from '../../logo.jpeg'

// Map a socket payload to a desktop-notification title/body.
const buildPushText = (p) => {
  switch (p?.type) {
    case 'leave_applied':
      return {
        title: 'New leave request',
        body: `${p.applicantName || 'Employee'}: ${p.startDate} – ${p.endDate} (${p.leaveType || 'Leave'})`,
      }
    case 'leave_pending_hr':
      return {
        title: 'Leave pending your approval',
        body: `${p.applicantName || 'Employee'} — ${p.startDate} – ${p.endDate} (${p.leaveType || 'Leave'})`,
      }
    case 'leave_approved':
      return {
        title: 'Your leave was approved',
        body: `${p.startDate} – ${p.endDate} (${p.leaveType || 'Leave'})`,
      }
    case 'leave_rejected':
      return {
        title: 'Your leave was rejected',
        body: `${p.startDate} – ${p.endDate}${p.reason ? ` — ${p.reason}` : ''}`,
      }
    case 'dar_submitted':
      return {
        title: 'DAR submitted',
        body: `${p.employeeName || 'Employee'} for ${p.date} (${p.totalHours ?? 0} hrs)`,
      }
    case 'attendance_regulation_approved':
      return {
        title: 'Attendance regulation approved',
        body: `${p.date || ''} ${[p.checkIn, p.checkOut].filter(Boolean).join(' – ')}`.trim(),
      }
    case 'notice_received':
      return {
        title: `📢 ${p.title || 'New notice'}`,
        body: (p.message || '').slice(0, 120) + ((p.message || '').length > 120 ? '…' : ''),
      }
    default:
      return {
        title: 'HRMS Notification',
        body:
          p?.message ||
          (p?.user?.name ? `${p.user.name} ${p.method || ''} ${p.path || ''}`.trim() : 'You have a new notification'),
      }
  }
}

const { Text } = Typography

const PENDING_LEAVE_APPROVAL_PATH = '/leaves/pending-approval'
const DAR_LIST_PATH = '/dar/list'
const MY_ATTENDANCE_PATH = '/attendance/my-attendance'
const MY_NOTICES_PATH = '/notices/my'

const NotificationBell = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token } = useSelector((state) => state.auth)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission())

  // Route to open when a given notification type is clicked (in the OS popup).
  const pathForType = (type) => {
    if (type === 'leave_applied' || type === 'leave_pending_hr') return PENDING_LEAVE_APPROVAL_PATH
    if (type === 'dar_submitted') return DAR_LIST_PATH
    if (type === 'attendance_regulation_approved') return MY_ATTENDANCE_PATH
    if (type === 'notice_received') return MY_NOTICES_PATH
    return null
  }

  // Ask for desktop-notification permission once the user is logged in.
  useEffect(() => {
    if (!user) return
    ensureNotificationPermission().then(setNotifPerm)
  }, [user])

  useEffect(() => {
    if (!user || !token) return

    let isMounted = true

    const connectSocket = async () => {
      try {
        await socketService.connect(token)
        if (!isMounted) return

        const addNotification = (payload) => {
          setNotifications((prev) => [payload, ...prev].slice(0, 50))
          setUnread((prev) => prev + 1)

          // Raise a native desktop/browser push notification.
          const { title, body } = buildPushText(payload)
          const target = pathForType(payload?.type)
          showBrowserNotification({
            title,
            body,
            tag: `${payload?.type || 'notification'}-${payload?.id || payload?.timestamp || Date.now()}`,
            icon: appLogo,
            onClick: () => target && navigate(target),
          })

          if (payload?.type === 'leave_approved') {
            dispatch(fetchLeaveBalance(new Date().getFullYear()))
          }
          // Refresh Pending Leave Approval list when new leave needs approval
          if (payload?.type === 'leave_applied' || payload?.type === 'leave_pending_hr') {
            dispatch(fetchPendingApprovalLeaves())
          }
          // Refresh attendance when regulation is approved (shows in My Attendance, calendar, etc.)
          if (payload?.type === 'attendance_regulation_approved') {
            const regDate = payload?.date ? new Date(payload.date) : new Date()
            const y = regDate.getFullYear()
            const m = regDate.getMonth()
            const start = new Date(y, m, 1)
            const end = new Date(y, m + 1, 0)
            dispatch(fetchAttendance({
              startDate: start.toISOString().slice(0, 10),
              endDate: end.toISOString().slice(0, 10),
              limit: 100,
            }))
            // Refresh dashboard so calendar and summary reflect the new attendance
            if (user?.id) {
              dispatch(fetchDashboardData({
                userId: user.id,
                role: user.role || PROJECT_ROLES.EMPLOYEE,
                department: user.department,
              }))
            }
          }
        }

        socketService.on('admin_notification', addNotification)
        socketService.on('leave_applied', addNotification)
        socketService.on('leave_pending_hr', addNotification)
        socketService.on('leave_approved', addNotification)
        socketService.on('leave_rejected', addNotification)
        socketService.on('dar_submitted', addNotification)
        socketService.on('attendance_regulation_approved', addNotification)
        socketService.on('notice_received', addNotification)

        return () => {
          if (socketService.off) {
            socketService.off('admin_notification', addNotification)
            socketService.off('leave_applied', addNotification)
            socketService.off('leave_pending_hr', addNotification)
            socketService.off('leave_approved', addNotification)
            socketService.off('leave_rejected', addNotification)
            socketService.off('dar_submitted', addNotification)
            socketService.off('attendance_regulation_approved', addNotification)
            socketService.off('notice_received', addNotification)
          }
        }
      } catch {
        // Socket unreachable (e.g. backend not running); socketService logs once
      }
    }

    const cleanupPromise = connectSocket()

    return () => {
      isMounted = false
      cleanupPromise
        .then((cleanup) => {
          if (typeof cleanup === 'function') cleanup()
        })
        .catch(() => {})
    }
  }, [user, token])

  if (!user) {
    return null
  }

  const dropdownContent = (
    <div
      style={{
        width: 360,
        maxHeight: 400,
        overflowY: 'auto',
        padding: '8px 0',
        background: '#ffffff',
      }}
    >
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>Notifications</Text>
        {unread > 0 && (
          <Text
            style={{ float: 'right', fontSize: 12, cursor: 'pointer' }}
            type="secondary"
            onClick={(e) => {
              e.stopPropagation()
              setUnread(0)
            }}
          >
            Mark all as read
          </Text>
        )}
      </div>

      {/* Desktop notification permission prompt / status */}
      {isNotificationSupported() && notifPerm !== 'granted' && (
        <div
          style={{
            padding: '10px 16px',
            background: notifPerm === 'denied' ? '#fff1f0' : '#eff6ff',
            borderBottom: '1px solid #f0f0f0',
            fontSize: 12,
          }}
        >
          {notifPerm === 'denied' ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Desktop notifications are blocked. Enable them for this site in your browser's site
              settings (the icon left of the address bar).
            </Text>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Get desktop alerts for leaves, DARs &amp; approvals.
              </Text>
              <Button
                size="small"
                type="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  ensureNotificationPermission().then((p) => {
                    setNotifPerm(p)
                    if (p === 'granted') {
                      showBrowserNotification({
                        title: 'Notifications enabled ✓',
                        body: "You'll now get desktop alerts from HRMS.",
                        icon: appLogo,
                      })
                    }
                  })
                }}
              >
                Enable
              </Button>
            </div>
          )}
        </div>
      )}
      {isNotificationSupported() && notifPerm === 'granted' && (
        <div style={{ padding: '6px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
          <Text
            style={{ fontSize: 11, cursor: 'pointer', color: '#2563eb' }}
            onClick={(e) => {
              e.stopPropagation()
              showBrowserNotification({
                title: 'Test notification',
                body: 'Desktop notifications are working correctly.',
                icon: appLogo,
              })
            }}
          >
            Send test notification
          </Text>
        </div>
      )}
      {notifications.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#8c8c8c', background: '#ffffff' }}>
          <Text type="secondary">No notifications yet</Text>
        </div>
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => {
            const ts = item.timestamp ? new Date(item.timestamp).toLocaleString() : ''
            if (item.type === 'leave_applied') {
              return (
                <List.Item
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate(PENDING_LEAVE_APPROVAL_PATH)
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13 }}>
                        Leave applied by <strong>{item.applicantName || 'Employee'}</strong>
                        {item.applicantEmployeeCode ? ` (${item.applicantEmployeeCode})` : ''}:{' '}
                        {item.startDate} – {item.endDate} ({item.leaveType || 'Leave'})
                      </Text>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{ts}</Text>}
                  />
                </List.Item>
              )
            }
            if (item.type === 'leave_pending_hr') {
              return (
                <List.Item
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate(PENDING_LEAVE_APPROVAL_PATH)
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13, color: '#1890ff' }}>
                        Leave pending your approval: <strong>{item.applicantName || 'Employee'}</strong>
                        {item.applicantEmployeeCode ? ` (${item.applicantEmployeeCode})` : ''} —{' '}
                        {item.startDate} – {item.endDate} ({item.leaveType || 'Leave'})
                      </Text>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{ts}</Text>}
                  />
                </List.Item>
              )
            }
            if (item.type === 'dar_submitted') {
              return (
                <List.Item
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate(DAR_LIST_PATH)
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13 }}>
                        DAR submitted by <strong>{item.employeeName || 'Employee'}</strong>
                        {item.employeeCode ? ` (${item.employeeCode})` : ''} for{' '}
                        {item.date}
                        {item.projectName ? ` · ${item.projectName}` : ''} (
                        {item.totalHours ?? 0} hrs)
                      </Text>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{ts}</Text>}
                  />
                </List.Item>
              )
            }
            if (item.type === 'leave_approved') {
              return (
                <List.Item style={{ padding: '8px 16px' }}>
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13, color: '#52c41a' }}>
                        Your leave was <strong>approved</strong>: {item.startDate} – {item.endDate} ({item.leaveType || 'Leave'})
                      </Text>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{ts}</Text>}
                  />
                </List.Item>
              )
            }
            if (item.type === 'leave_rejected') {
              const dateRange = item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : 'Leave'
              return (
                <List.Item style={{ padding: '8px 16px' }}>
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13, color: '#ff4d4f' }}>
                        Your leave was <strong>rejected</strong>: {dateRange} ({item.leaveType || 'Leave'})
                        {item.reason ? ` — ${item.reason}` : ''}
                      </Text>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{ts}</Text>}
                  />
                </List.Item>
              )
            }
            if (item.type === 'notice_received') {
              return (
                <List.Item
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate(MY_NOTICES_PATH)
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13, color: item.priority === 'urgent' ? '#ff4d4f' : '#4338ca' }}>
                        📢 <strong>{item.title || 'New notice'}</strong>
                        {item.senderName ? ` — ${item.senderName}` : ''}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {(item.message || '').slice(0, 90)}
                        {(item.message || '').length > 90 ? '…' : ''} · {ts}
                      </Text>
                    }
                  />
                </List.Item>
              )
            }
            if (item.type === 'attendance_regulation_approved') {
              const dateStr = item.date || ''
              const timeStr = [item.checkIn, item.checkOut].filter(Boolean).join(' – ')
              return (
                <List.Item
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate(MY_ATTENDANCE_PATH)
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Text style={{ fontSize: 13, color: '#52c41a' }}>
                        Your attendance regulation was <strong>approved</strong>
                        {dateStr ? ` for ${dateStr}` : ''}
                        {timeStr ? ` (${timeStr})` : ''}
                      </Text>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{ts}</Text>}
                  />
                </List.Item>
              )
            }
            return (
              <List.Item style={{ padding: '8px 16px' }}>
                <List.Item.Meta
                  title={
                    <Text style={{ fontSize: 13 }}>
                      {item.user?.name || 'User'} ({item.user?.role || 'ROLE'}) did{' '}
                      <strong>{item.method}</strong> on <code>{item.path}</code>
                    </Text>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Status {item.status} · {ts}
                    </Text>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      popupRender={() => dropdownContent}
      placement="bottomRight"
      trigger={['click']}
    >
      <Badge count={unread} overflowCount={99} offset={[-2, 2]}>
        <BellOutlined
          style={{
            fontSize: 20,
            cursor: 'pointer',
          }}
        />
      </Badge>
    </Dropdown>
  )
}

export default NotificationBell

