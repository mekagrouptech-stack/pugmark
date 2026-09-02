import React, { useEffect, useState, useRef } from 'react'
import { Card, Space, Alert, Select, Tag, Typography, message, Spin, Descriptions } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  ReloadOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'
import LocationConsentModal from '../../components/map/LocationConsentModal'
import { getCurrentLocation, checkLocationPermission } from '../../utils/locationUtils'
import { punchIn, punchOut, fetchAttendance } from '../../features/attendance/attendanceSlice'
import { fetchEmployees } from '../../features/hr/hrSlice'
import { calcLiveTotal } from '../../utils/attendanceTimeUtils'
import api from '../../services/api'

const { Text, Title } = Typography

// --- CSS injected once ---
const STYLE_ID = 'punch-btn-styles'
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes punchPulseGreen {
      0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.45); }
      70% { box-shadow: 0 0 0 18px rgba(22,163,74,0); }
      100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
    }
    @keyframes punchPulseRed {
      0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
      70% { box-shadow: 0 0 0 18px rgba(220,38,38,0); }
      100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
    }
    @keyframes punchDoneCheck {
      0% { transform: scale(0.7); opacity: 0; }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    .punch-btn {
      position: relative;
      width: 170px;
      height: 170px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 0.5px;
      transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
      outline: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .punch-btn:not(:disabled):hover {
      transform: scale(1.07);
      filter: brightness(1.08);
    }
    .punch-btn:not(:disabled):active {
      transform: scale(0.96);
    }
    .punch-btn:disabled {
      cursor: not-allowed;
      filter: saturate(0.3) brightness(1.1);
      opacity: 0.55;
    }
    .punch-btn-in {
      background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
      box-shadow: 0 8px 32px rgba(22,163,74,0.35), 0 2px 8px rgba(0,0,0,0.10);
    }
    .punch-btn-in:not(:disabled) {
      animation: punchPulseGreen 2s infinite;
    }
    .punch-btn-out {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      box-shadow: 0 8px 32px rgba(220,38,38,0.35), 0 2px 8px rgba(0,0,0,0.10);
    }
    .punch-btn-out:not(:disabled) {
      animation: punchPulseRed 2s infinite;
    }
    .punch-btn-done {
      background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%) !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
      animation: none !important;
    }
    .punch-btn .punch-icon {
      font-size: 42px;
      margin-bottom: 6px;
      line-height: 1;
    }
    .punch-btn .punch-label {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .punch-btn .punch-sub {
      font-size: 11px;
      font-weight: 500;
      opacity: 0.85;
      margin-top: 2px;
    }
    .punch-btn-done .punch-done-check {
      animation: punchDoneCheck 0.5s ease-out;
    }
    .punch-btn-ring {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 3px dashed rgba(255,255,255,0.25);
      pointer-events: none;
    }
    .punch-btn-in .punch-btn-ring { border-color: rgba(22,163,74,0.25); }
    .punch-btn-out .punch-btn-ring { border-color: rgba(220,38,38,0.25); }
    .punch-btn-done .punch-btn-ring { border-color: rgba(156,163,175,0.25); }

    .punch-clock {
      font-size: 40px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: 2px;
      color: #1e293b;
      line-height: 1;
    }
    .punch-clock-date {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 500;
    }
  `
  document.head.appendChild(style)
}

const LocationAttendancePunch = ({ embedded = false }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { loading: attendanceLoading } = useSelector((state) => state.attendance)
  const { employees } = useSelector((state) => state.hr || {})

  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [lastPunchRecord, setLastPunchRecord] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const isAdminOrManager = ['ADMIN', 'HR', 'MANAGER', 'HEAD_HR'].includes((user?.role || '').toUpperCase())

  useEffect(() => { injectStyles() }, [])

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get('/attendance/today')
      setTodayAttendance(res.data?.data || res.data || null)
    } catch {
      setTodayAttendance(null)
    }
  }

  const captureLocation = async () => {
    setLoadingLocation(true)
    setLocationError(null)
    try {
      const location = await getCurrentLocation()
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      })
      setLocationPermissionGranted(true)
    } catch (error) {
      setLocationError(error.message)
      setLocationPermissionGranted(false)
    } finally {
      setLoadingLocation(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (isAdminOrManager) dispatch(fetchEmployees())
      await fetchTodayAttendance()
      try {
        const granted = await checkLocationPermission()
        setLocationPermissionGranted(granted)
        if (granted) await captureLocation()
      } catch { /* silently skip if permission not granted yet */ }
      setInitialLoading(false)
    }
    init()
  }, [])

  const handleGetLocation = async () => {
    if (!locationPermissionGranted) {
      setShowConsentModal(true)
      return
    }
    await captureLocation()
  }

  const handlePunch = async (type) => {
    if (!userLocation) {
      message.warning('Please allow location access first')
      return
    }
    try {
      const effectiveUserId = isAdminOrManager && selectedEmployeeId ? selectedEmployeeId : user?.id
      const punchData = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        accuracy: userLocation.accuracy || null,
        targetUserId: effectiveUserId,
      }
      let result
      if (type === 'in') {
        result = await dispatch(punchIn(punchData)).unwrap()
        message.success(result.message || 'Punch In successful!')
      } else {
        result = await dispatch(punchOut(punchData)).unwrap()
        message.success(result.message || 'Punch Out successful!')
      }
      setLastPunchRecord({
        punch_type: type === 'in' ? 'IN' : 'OUT',
        check_in_time: result.checkInTime || null,
        check_out_time: result.checkOutTime || null,
        total_hours: result.totalHours || null,
      })
      dispatch(fetchAttendance())
      fetchTodayAttendance()
    } catch (error) {
      message.error(error.message || 'Failed to record attendance')
    }
  }

  const hasPunchedIn = !!(todayAttendance?.checkIn || todayAttendance?.checkInTime)
  const hasPunchedOut = !!(todayAttendance?.checkOut || todayAttendance?.checkOutTime)

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const punchInDisabled = !userLocation || hasPunchedIn || attendanceLoading
  const punchOutDisabled = !userLocation || !hasPunchedIn || hasPunchedOut || attendanceLoading

  const mainContent = (
    <>
      {initialLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Getting your location...</Text>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 750, margin: '0 auto', padding: '20px 0' }}>
          {/* Location Status Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            background: userLocation ? '#f0fdf4' : '#fefce8',
            borderRadius: 12,
            border: `1px solid ${userLocation ? '#bbf7d0' : '#fde68a'}`,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
            marginBottom: 24,
          }}>
            <Space>
              <EnvironmentOutlined style={{ color: userLocation ? '#16a34a' : '#d97706' }} />
              {userLocation ? (
                <Text style={{ color: '#16a34a' }}>
                  Location captured
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
                  </Text>
                </Text>
              ) : (
                <Text style={{ color: '#d97706' }}>Location not captured</Text>
              )}
            </Space>
            <button
              onClick={handleGetLocation}
              disabled={loadingLocation}
              style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#334155',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <ReloadOutlined spin={loadingLocation} />
              {userLocation ? 'Refresh' : 'Capture'}
            </button>
          </div>

          {locationError && (
            <Alert message={locationError} type="error" showIcon closable
              onClose={() => setLocationError(null)} style={{ marginBottom: 20 }} />
          )}

          {/* Admin/Manager: Employee Selector */}
          {isAdminOrManager && (
            <Card
              size="small"
              style={{
                marginBottom: 24,
                borderRadius: 14,
                border: '1px solid #eef1f6',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
              }}
            >
              <Text strong style={{ color: '#0f172a' }}>Punch For Employee:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Self (default) -- or select an employee"
                showSearch optionFilterProp="children"
                value={selectedEmployeeId}
                onChange={(value) => setSelectedEmployeeId(value || null)}
                allowClear
              >
                {(employees || []).map((emp) => (
                  <Select.Option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </Select.Option>
                ))}
              </Select>
            </Card>
          )}

          {/* ----- Punch panel (contained surface) ----- */}
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
              borderRadius: 20,
              border: '1px solid #eef1f6',
              boxShadow: '0 4px 18px rgba(15, 23, 42, 0.07)',
              padding: '32px 24px',
            }}
          >
          {/* Live Clock */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="punch-clock">{timeStr}</div>
            <div className="punch-clock-date">{dateStr}</div>
          </div>

          {/* ----- SPECIAL PUNCH BUTTONS ----- */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48,
            marginBottom: 36,
          }}>
            {/* PUNCH IN */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                className={`punch-btn punch-btn-in${hasPunchedIn ? ' punch-btn-done' : ''}`}
                disabled={punchInDisabled}
                onClick={() => handlePunch('in')}
              >
                <span className="punch-btn-ring" />
                {hasPunchedIn ? (
                  <>
                    <span className="punch-icon punch-done-check"><CheckCircleOutlined /></span>
                    <span className="punch-label">Done</span>
                    <span className="punch-sub">{todayAttendance?.checkIn || todayAttendance?.checkInTime}</span>
                  </>
                ) : (
                  <>
                    <span className="punch-icon"><LoginOutlined /></span>
                    <span className="punch-label">Punch In</span>
                    <span className="punch-sub">Start your day</span>
                  </>
                )}
              </button>
            </div>

            {/* PUNCH OUT */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                className={`punch-btn punch-btn-out${hasPunchedOut ? ' punch-btn-done' : ''}`}
                disabled={punchOutDisabled}
                onClick={() => handlePunch('out')}
              >
                <span className="punch-btn-ring" />
                {hasPunchedOut ? (
                  <>
                    <span className="punch-icon punch-done-check"><CheckCircleOutlined /></span>
                    <span className="punch-label">Done</span>
                    <span className="punch-sub">{todayAttendance?.checkOut || todayAttendance?.checkOutTime}</span>
                  </>
                ) : (
                  <>
                    <span className="punch-icon"><LogoutOutlined /></span>
                    <span className="punch-label">Punch Out</span>
                    <span className="punch-sub">End your day</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Today's Status Cards */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              flex: 1, padding: '14px 16px', background: '#f0fdf4',
              borderRadius: 10, border: '1px solid #bbf7d0', textAlign: 'center',
            }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Punch In</Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>
                {todayAttendance?.checkIn || todayAttendance?.checkInTime || '--:--'}
              </div>
            </div>
            <div style={{
              flex: 1, padding: '14px 16px', background: '#fef2f2',
              borderRadius: 10, border: '1px solid #fecaca', textAlign: 'center',
            }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Punch Out</Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                {todayAttendance?.checkOut || todayAttendance?.checkOutTime || '--:--'}
              </div>
            </div>
            {hasPunchedIn && (
              <div style={{
                flex: 1, padding: '14px 16px', background: '#eff6ff',
                borderRadius: 10, border: '1px solid #bfdbfe', textAlign: 'center',
              }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Hours</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>
                  {calcLiveTotal(
                    todayAttendance?.checkIn || todayAttendance?.checkInTime,
                    todayAttendance?.checkOut || todayAttendance?.checkOutTime || null,
                    now
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
          {/* ----- end punch panel ----- */}

          {/* Last Punch Result */}
          {lastPunchRecord && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Text strong style={{ fontSize: 13 }}>Last Punch Result</Text>
              <Descriptions column={2} size="small" bordered style={{ marginTop: 8 }}>
                <Descriptions.Item label="Type">
                  <Tag color={lastPunchRecord.punch_type === 'IN' ? 'green' : 'red'}>
                    {lastPunchRecord.punch_type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Check In">{lastPunchRecord.check_in_time || '-'}</Descriptions.Item>
                <Descriptions.Item label="Check Out">{lastPunchRecord.check_out_time || '-'}</Descriptions.Item>
                <Descriptions.Item label="Total Hours">
                  {lastPunchRecord.total_hours != null ? `${lastPunchRecord.total_hours} h` : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </div>
      )}

      <LocationConsentModal
        visible={showConsentModal}
        onAccept={() => { setShowConsentModal(false); captureLocation() }}
        onDecline={() => { setShowConsentModal(false); message.info('Location access is required for attendance punching') }}
      />
    </>
  )

  if (embedded) return mainContent
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Title level={2}>Location-Based Attendance</Title>
          <Text type="secondary">Punch in/out with location verification</Text>
        </div>
        {mainContent}
      </div>
    </DashboardLayout>
  )
}

export default LocationAttendancePunch
