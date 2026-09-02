import React, { useState, useEffect, useRef } from 'react'
import { Layout, Avatar, Dropdown, Button, Space, Typography, Divider, Tag, Input, message, Tooltip, Drawer, Grid } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  MailOutlined,
  IdcardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  BookOutlined,
  BellOutlined,
  UserSwitchOutlined,
  LoginOutlined,
  LogoutOutlined as LogoutIcon,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { punchIn, punchOut, fetchAttendance } from '../features/attendance/attendanceSlice'
import { getCurrentLocation } from '../utils/locationUtils'
import Sidebar from './Sidebar'
import NotificationBell from '../components/NotificationBell'
import logo from '../../logo.jpeg'
import sidebarLogo from '../../sidebarlogo.png'
import { getStorageUrl } from '../utils/constants'
import api from '../services/api'
import { calcLiveTotal as calcLiveTotalUtil } from '../utils/attendanceTimeUtils'

const { Text } = Typography
const { useBreakpoint } = Grid

const { Header, Sider, Content } = Layout

// Inject header punch button styles once
const PUNCH_HEADER_STYLE_ID = 'header-punch-styles'
const injectPunchStyles = () => {
  if (document.getElementById(PUNCH_HEADER_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = PUNCH_HEADER_STYLE_ID
  s.textContent = `
    @keyframes headerPunchPulse {
      0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
      70% { box-shadow: 0 0 0 8px rgba(22,163,74,0); }
      100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
    }
    @keyframes headerPunchPulseRed {
      0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
      70% { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
      100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
    }
    .header-punch-btn {
      display: inline-flex; align-items: center; gap: 5px;
      border: none; border-radius: 16px; padding: 0 10px; height: 28px;
      font-weight: 700; font-size: 11px; letter-spacing: 0.3px;
      cursor: pointer; color: #fff; transition: transform 0.15s, filter 0.15s;
      white-space: nowrap; flex-shrink: 0;
    }
    .header-punch-btn:not(:disabled):hover { transform: scale(1.05); filter: brightness(1.1); }
    .header-punch-btn:not(:disabled):active { transform: scale(0.97); }
    .header-punch-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: saturate(0.3); animation: none !important; }
    .header-punch-in {
      background: linear-gradient(135deg, #22c55e, #15803d);
      animation: headerPunchPulse 2s infinite;
    }
    .header-punch-out {
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      animation: headerPunchPulseRed 2s infinite;
    }
    .header-punch-done {
      background: linear-gradient(135deg, #d1d5db, #9ca3af) !important;
      animation: none !important;
    }
    .header-punch-panel {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 3px 8px; height: 44px;
      flex-wrap: nowrap; overflow: hidden; flex-shrink: 0;
    }
    .header-punch-clock {
      font-size: 13px; font-weight: 800; color: #1e293b;
      font-variant-numeric: tabular-nums; line-height: 1.2;
      letter-spacing: 0.3px; white-space: nowrap;
    }
    .header-punch-date {
      font-size: 9px; color: #94a3b8; font-weight: 500; line-height: 1; white-space: nowrap;
    }
    .header-punch-sep {
      width: 1px; height: 24px; background: #e2e8f0; flex-shrink: 0;
    }
    .header-punch-info {
      display: flex; flex-direction: column; align-items: center;
      line-height: 1; flex-shrink: 0;
    }
    .header-punch-info-label {
      font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .header-punch-info-value {
      font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums;
      margin-top: 1px; white-space: nowrap;
    }
  `
  document.head.appendChild(s)
}

/**
 * The header's live clock and punch readout.
 *
 * Deliberately its own component: the clock ticks once a second, and while the
 * `now` state lived on DashboardLayout every tick re-rendered the layout — and
 * with it `{children}`, i.e. the whole active page. On table- and chart-heavy
 * screens that was a full React reconcile every second for a display that only
 * ever changes three text nodes. Owning the state down here confines each tick
 * to this subtree.
 *
 * Memoised so a parent re-render (sidebar collapse, route change) does not
 * remount the interval.
 */
const HeaderClock = React.memo(function HeaderClock({ todayAtt }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const checkIn = todayAtt?.checkIn || todayAtt?.checkInTime
  const checkOut = todayAtt?.checkOut || todayAtt?.checkOutTime
  const liveTotal = checkIn ? calcLiveTotalUtil(checkIn, checkOut || null, now) : '--:--'

  return (
    <div className="header-punch-panel">
      {/* Live Clock */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="header-punch-clock">
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
        <span className="header-punch-date">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <span className="header-punch-sep" />

      {/* In / Out / Total — read-only, sourced from biometric device punches */}
      <div className="header-punch-info">
        <span className="header-punch-info-label">In</span>
        <span className="header-punch-info-value" style={{ color: '#16a34a' }}>
          {checkIn || '--:--'}
        </span>
      </div>
      <div className="header-punch-info">
        <span className="header-punch-info-label">Out</span>
        <span className="header-punch-info-value" style={{ color: '#dc2626' }}>
          {checkOut || '--:--'}
        </span>
      </div>
      <div className="header-punch-info">
        <span className="header-punch-info-label">Total</span>
        <span className="header-punch-info-value" style={{ color: '#2563eb' }}>
          {liveTotal}
        </span>
      </div>
    </div>
  )
})

const DashboardLayout = ({ children, hideHeader = false }) => {
  const screens = useBreakpoint()
  const isMobile = !screens.md // < 768px
  const isTablet = screens.md && !screens.lg // 768-992px
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { loading: attendanceLoading } = useSelector((state) => state.attendance)

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet && !collapsed) setCollapsed(true)
  }, [isTablet])

  // Close drawer on navigation (mobile)
  const closeMobileDrawer = () => setMobileDrawerOpen(false)

  // --- Header Punch State ---
  const [todayAtt, setTodayAtt] = useState(null)
  const [punchLoading, setPunchLoading] = useState(false)

  useEffect(() => { injectPunchStyles() }, [])

  const fetchToday = async () => {
    try {
      const res = await api.get('/attendance/today')
      setTodayAtt(res.data?.data || res.data || null)
    } catch { setTodayAtt(null) }
  }

  // Fetch on mount + refresh every 60 seconds
  useEffect(() => {
    fetchToday()
    const interval = setInterval(fetchToday, 60000)
    return () => clearInterval(interval)
  }, [])

  const hasPunchedIn = !!(todayAtt?.checkIn || todayAtt?.checkInTime)
  const hasPunchedOut = !!(todayAtt?.checkOut || todayAtt?.checkOutTime)

  const handleHeaderPunch = async (type) => {
    setPunchLoading(true)
    try {
      const loc = await getCurrentLocation()
      const punchData = { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy || null }
      if (type === 'in') {
        const result = await dispatch(punchIn(punchData)).unwrap()
        message.success(result.message || 'Punch In successful!')
      } else {
        const result = await dispatch(punchOut(punchData)).unwrap()
        message.success(result.message || 'Punch Out successful!')
      }
      dispatch(fetchAttendance())
      fetchToday()
    } catch (error) {
      message.error(error.message || 'Please allow location access for attendance')
    } finally {
      setPunchLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleSearch = (value) => {
    console.log('Searching for:', value)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ]

  // Useful Links menu items
  const usefulLinksItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'pugmark-manual',
      icon: <BookOutlined />,
      label: 'Pugmark Manual',
      onClick: () => navigate('/pugmark-manual'),
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'Attendance',
      onClick: () => navigate('/attendance/my-attendance'),
    },
    {
      key: 'punch',
      icon: <CalendarOutlined />,
      label: 'Punch Attendance',
      onClick: () => navigate('/attendance/punch'),
    },
    {
      key: 'request-regulation',
      icon: <ClockCircleOutlined />,
      label: 'Request Attendance Regulation',
      onClick: () => navigate('/attendance/request-regulation'),
    },
    {
      key: 'leaves',
      icon: <FileTextOutlined />,
      label: 'Apply Leave',
      onClick: () => navigate('/leaves/apply'),
    },
    {
      key: 'salary',
      icon: <DollarOutlined />,
      label: 'My Salary',
      onClick: () => navigate('/salary/my-salary'),
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Chat',
      onClick: () => navigate('/chat'),
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      onClick: () => navigate('/reports'),
    },
    {
      key: 'helpdesk',
      icon: <QuestionCircleOutlined />,
      label: 'Helpdesk',
      onClick: () => navigate('/helpdesk'),
    },
  ]

  // Gradient mapping for app icons (professional palette)
  const iconGradients = {
    dashboard: ['#2563eb', '#4f46e5'],
    'pugmark-manual': ['#7c3aed', '#a855f7'],
    attendance: ['#16a34a', '#22c55e'],
    punch: ['#f59e0b', '#fbbf24'],
    'request-regulation': ['#f97316', '#fb923c'],
    leaves: ['#0d9488', '#14b8a6'],
    salary: ['#7c3aed', '#6366f1'],
    chat: ['#db2777', '#ec4899'],
    reports: ['#ea580c', '#f97316'],
    helpdesk: ['#dc2626', '#ef4444'],
  }

  // Custom dropdown overlay for Useful Links - Grid Layout
  const usefulLinksOverlay = (
    <div
      style={{
        width: isMobile ? 'min(92vw, 340px)' : 380,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
        border: '1px solid #eef1f6',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(180deg, #f8fafc, #ffffff)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Quick Links</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Jump to any module</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '18px 16px',
        }}
      >
        {usefulLinksItems.map((item) => {
          const [g1, g2] = iconGradients[item.key] || ['#2563eb', '#4f46e5']
          return (
            <div
              key={item.key}
              onClick={item.onClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                cursor: 'pointer',
                borderRadius: 12,
                padding: '10px 4px',
                transition: 'transform 0.18s ease, background 0.18s ease',
                background: 'transparent',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${g1}, ${g2})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  boxShadow: `0 6px 16px ${g1}55`,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 26, color: '#fff' }}>{item.icon}</span>
              </div>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  textAlign: 'center',
                  color: '#334155',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                  width: '100%',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.label}
              </Text>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Custom dropdown overlay with user profile information
  const dropdownOverlay = (
    <div style={{ width: isMobile ? 'min(92vw, 280px)' : 280, padding: '16px 0', background: '#fafafa' }}>
      {/* User Profile Header */}
      <div style={{ padding: '0 16px 16px 16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Avatar
          size={64}
          style={{ backgroundColor: '#2563eb', marginBottom: 12 }}
          src={user?.avatar ? getStorageUrl(user.avatar) : undefined}
        >
          {user?.name ? (
            user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          ) : (
            <UserOutlined />
          )}
        </Avatar>
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 16, display: 'block' }}>
            {user?.name || 'User'}
          </Text>
          <Tag color="blue" style={{ marginTop: 4 }}>
            {user?.role?.toUpperCase() || 'EMPLOYEE'}
          </Tag>
        </div>
      </div>

      {/* User Information */}
      <div style={{ padding: '12px 16px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {user?.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MailOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {user.email}
              </Text>
            </div>
          )}
          {user?.employeeCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IdcardOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {user.employeeCode}
              </Text>
            </div>
          )}
          {user?.department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {user.department}
              </Text>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserSwitchOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />
            {(user?.reportingManagerName || user?.reportTo) ? (
              <Space size={6} style={{ flex: 1, minWidth: 0 }}>
                <Avatar
                  size={24}
                  style={{ backgroundColor: '#2563eb', flexShrink: 0, fontSize: 12 }}
                >
                  {(user.reportingManagerName || user.reportTo)
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Avatar>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Report To: {user.reportingManagerName || user.reportTo}
                </Text>
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Report To: Not assigned
              </Text>
            )}
          </div>
        </Space>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Menu Items */}
      <div>
        {userMenuItems.map((item) => {
          if (item.type === 'divider') {
            return <Divider key="divider" style={{ margin: '8px 0' }} />
          }
          return (
            <div
              key={item.key}
              onClick={item.onClick}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background-color 0.2s',
                color: item.danger ? '#ff4d4f' : 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const sidebarHeader = (
    <div
      onClick={() => { navigate('/dashboard'); closeMobileDrawer() }}
      style={{
        minHeight: 72,
        padding: collapsed && !isMobile ? 12 : '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(0,0,0,0.85)',
        overflow: 'hidden',
        borderBottom: '1px solid #f0f0f0',
        boxSizing: 'border-box',
        cursor: 'pointer',
      }}
    >
      <img
        src={collapsed && !isMobile ? logo : sidebarLogo}
        alt="HRMS Logo"
        style={{
          maxHeight: collapsed && !isMobile ? 32 : 60,
          maxWidth: collapsed && !isMobile ? 32 : '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
        }}
      />
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          {sidebarHeader}
          <Sidebar collapsed={collapsed} />
        </Sider>
      )}
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          open={mobileDrawerOpen}
          onClose={closeMobileDrawer}
          width={260}
          styles={{
            body: { padding: 0, background: '#fff' },
            header: { display: 'none' },
          }}
        >
          {sidebarHeader}
          <div onClick={closeMobileDrawer}>
            <Sidebar collapsed={false} />
          </div>
        </Drawer>
      )}
      <Layout style={{ marginLeft: (hideHeader || isMobile) ? 0 : (collapsed ? 80 : 250), transition: 'all 0.2s' }}>
        {!hideHeader && (
          <Header
            style={{
              padding: isMobile ? '0 8px' : '0 16px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
              position: 'sticky',
              top: 0,
              zIndex: 9,
              gap: isMobile ? 4 : 8,
              height: isMobile ? 56 : 64,
              lineHeight: isMobile ? '56px' : '64px',
            }}
          >
            <Button
              type="text"
              icon={
                isMobile
                  ? <MenuUnfoldOutlined />
                  : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
              }
              onClick={() => isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)}
              style={{ fontSize: 18, width: 40, height: isMobile ? 40 : 48, flexShrink: 0 }}
            />
            {!isMobile && (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 8px', minWidth: 0 }}>
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={(e) => handleSearch(e.target.value)}
                  allowClear
                  style={{ maxWidth: 360, width: '100%', borderRadius: 20, background: '#f8fafc' }}
                />
              </div>
            )}
            {isMobile && <div style={{ flex: 1 }} />}
            <Space size={isMobile ? 4 : 8} style={{ flexShrink: 0 }}>
              {/* --- Punch Panel (hidden on mobile — moved to compact form) --- */}
              {!isMobile && <HeaderClock todayAtt={todayAtt} />}
              {/* --- Compact mobile attendance status (biometric, read-only) --- */}
              {isMobile && (
                <Tooltip
                  title={`In: ${todayAtt?.checkIn || todayAtt?.checkInTime || '--:--'} · Out: ${
                    todayAtt?.checkOut || todayAtt?.checkOutTime || '--:--'
                  }`}
                >
                  <div
                    className="header-punch-btn header-punch-in header-punch-done"
                    style={{ height: 34, padding: '0 10px', fontSize: 11, cursor: 'default' }}
                  >
                    <CheckCircleOutlined />
                    {todayAtt?.checkIn || todayAtt?.checkInTime || '--:--'}
                  </div>
                </Tooltip>
              )}
              <NotificationBell />
              <Dropdown
                popupRender={() => usefulLinksOverlay}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  type="text"
                  icon={<AppstoreOutlined />}
                  style={{
                    fontSize: 18,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Dropdown>
              <Dropdown
                popupRender={() => dropdownOverlay}
                placement="bottomRight"
                trigger={['click']}
              >
                <Space style={{ cursor: 'pointer' }} size={8}>
                  <Avatar
                    size={32}
                    style={{ backgroundColor: '#2563eb', flexShrink: 0 }}
                    src={user?.avatar ? getStorageUrl(user.avatar) : undefined}
                  >
                    {user?.name ? (
                      user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    ) : (
                      <UserOutlined />
                    )}
                  </Avatar>
                </Space>
              </Dropdown>
            </Space>
          </Header>
        )}
        <Content style={{ margin: hideHeader ? 0 : (isMobile ? '12px 8px' : '24px 16px'), padding: 0, minHeight: hideHeader ? '100vh' : 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default DashboardLayout
