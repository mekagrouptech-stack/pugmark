import React, { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Alert,
  Modal,
  Input,
  Select,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Descriptions,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import AttendanceMap from '../map/AttendanceMap'
import LocationConsentModal from '../map/LocationConsentModal'
import { getCurrentLocation, checkLocationPermission } from '../../utils/locationUtils'
import { punchIn, punchOut, fetchAttendance } from '../../features/attendance/attendanceSlice'
import { fetchEmployees } from '../../features/hr/hrSlice'
import { calcLiveTotal } from '../../utils/attendanceTimeUtils'
import api from '../../services/api'

const { TextArea } = Input
const { Text, Title } = Typography

const LocationAttendanceModal = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { loading: attendanceLoading } = useSelector((state) => state.attendance)
  const { employees } = useSelector((state) => state.hr || {})

  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [lastPunchRecord, setLastPunchRecord] = useState(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [now, setNow] = useState(new Date())

  // Live clock tick
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [open])

  const isAdminOrManager = ['ADMIN', 'HR', 'MANAGER', 'HEAD_HR'].includes((user?.role || '').toUpperCase())

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get('/attendance/today')
      setTodayAttendance(res.data?.data || res.data || null)
    } catch {
      setTodayAttendance(null)
    }
  }

  useEffect(() => {
    if (open) {
      if (isAdminOrManager) {
        dispatch(fetchEmployees())
      }
      fetchTodayAttendance()
      // Auto-capture location on open
      checkLocationPermission().then((granted) => {
        setLocationPermissionGranted(granted)
        if (granted) {
          captureLocation()
        }
      })
    } else {
      setUserLocation(null)
      setLocationError(null)
      setLastPunchRecord(null)
      setSelectedEmployeeId(null)
      setTodayAttendance(null)
    }
  }, [open, dispatch, user])

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
      message.error(error.message)
      setLocationPermissionGranted(false)
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleGetLocation = async () => {
    if (!locationPermissionGranted) {
      setShowConsentModal(true)
      return
    }
    await captureLocation()
  }

  const handlePunch = async (type) => {
    if (!userLocation) {
      message.warning('Please capture your location first')
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
        distance: result.location?.distance ?? null,
        is_within_radius: result.location?.isWithinRadius ?? null,
      })

      dispatch(fetchAttendance())
      fetchTodayAttendance()
      if (onSuccess) onSuccess(result)
    } catch (error) {
      message.error(error.message || 'Failed to record attendance')
    }
  }

  return (
    <>
      <Modal
        title={
          <Space>
            <EnvironmentOutlined />
            <Title level={4} style={{ margin: 0 }}>Punch Attendance</Title>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        style={{ top: 20 }}
        destroyOnHidden
      >
        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '8px 0' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              {/* Location Status */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Select Employee (for Admin/HR/Manager) */}
                  {isAdminOrManager && (
                    <div>
                      <Text strong>Punch For Employee:</Text>
                      <Select
                        style={{ width: '100%', marginTop: 8 }}
                        placeholder="Self (default) — or select an employee"
                        showSearch
                        optionFilterProp="children"
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
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong>Your Location:</Text>
                        {userLocation ? (
                          <div style={{ marginTop: 4 }}>
                            <Tag color="green" icon={<CheckCircleOutlined />}>Captured</Tag>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              Lat: {userLocation.latitude.toFixed(6)}, Lng: {userLocation.longitude.toFixed(6)}
                            </Text>
                          </div>
                        ) : (
                          <div style={{ marginTop: 4 }}>
                            <Tag color="default" icon={<CloseCircleOutlined />}>Not Captured</Tag>
                          </div>
                        )}
                      </div>
                      <Button
                        type="primary"
                        icon={<EnvironmentOutlined />}
                        onClick={handleGetLocation}
                        loading={loadingLocation}
                        size="small"
                      >
                        {userLocation ? 'Update Location' : 'Capture Location'}
                      </Button>
                    </Space>
                  </div>

                  {locationError && (
                    <Alert
                      message="Location Error"
                      description={locationError}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setLocationError(null)}
                    />
                  )}
                </Space>
              </Card>

              {/* Map */}
              <AttendanceMap
                userLocation={userLocation}
                height={350}
                showGeofence={false}
                showDistance={false}
                loading={loadingLocation}
                error={locationError}
              />
            </Col>

            <Col xs={24} lg={10}>
              {/* Punch Buttons */}
              {/* Today's Attendance Status */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14 }}>Today's Attendance</Text>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Punch In</Text>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>
                        {todayAttendance?.checkIn || todayAttendance?.checkInTime || '--:--'}
                      </div>
                    </div>
                    <CheckCircleOutlined style={{ fontSize: 24, color: todayAttendance?.checkIn || todayAttendance?.checkInTime ? '#16a34a' : '#d1d5db' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Punch Out</Text>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>
                        {todayAttendance?.checkOut || todayAttendance?.checkOutTime || '--:--'}
                      </div>
                    </div>
                    <CloseCircleOutlined style={{ fontSize: 24, color: todayAttendance?.checkOut || todayAttendance?.checkOutTime ? '#dc2626' : '#d1d5db' }} />
                  </div>
                  {!!(todayAttendance?.checkIn || todayAttendance?.checkInTime) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Total Hours</Text>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>
                          {calcLiveTotal(
                            todayAttendance?.checkIn || todayAttendance?.checkInTime,
                            todayAttendance?.checkOut || todayAttendance?.checkOutTime || null,
                            now
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card
                title={
                  <Space>
                    <CheckCircleOutlined />
                    <span>Attendance Punch</span>
                  </Space>
                }
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    block
                    onClick={() => handlePunch('in')}
                    disabled={!userLocation || !!(todayAttendance?.checkIn || todayAttendance?.checkInTime)}
                    loading={attendanceLoading}
                    style={{ height: 60, fontSize: 18, fontWeight: 600 }}
                  >
                    {(todayAttendance?.checkIn || todayAttendance?.checkInTime) ? 'Already Punched In' : 'Punch In'}
                  </Button>

                  <Button
                    danger
                    size="large"
                    icon={<CloseCircleOutlined />}
                    block
                    onClick={() => handlePunch('out')}
                    disabled={!userLocation || !(todayAttendance?.checkIn || todayAttendance?.checkInTime) || !!(todayAttendance?.checkOut || todayAttendance?.checkOutTime)}
                    loading={attendanceLoading}
                    style={{ height: 60, fontSize: 18, fontWeight: 600 }}
                  >
                    {(todayAttendance?.checkOut || todayAttendance?.checkOutTime) ? 'Already Punched Out' : 'Punch Out'}
                  </Button>

                  {lastPunchRecord && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong style={{ fontSize: 13 }}>Last Punch</Text>
                      <Card size="small" style={{ marginTop: 8 }}>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Type">{lastPunchRecord.punch_type}</Descriptions.Item>
                          <Descriptions.Item label="Check In">{lastPunchRecord.check_in_time || '-'}</Descriptions.Item>
                          <Descriptions.Item label="Check Out">{lastPunchRecord.check_out_time || '-'}</Descriptions.Item>
                          <Descriptions.Item label="Total Hours">
                            {lastPunchRecord.total_hours != null ? `${lastPunchRecord.total_hours} h` : '-'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </Modal>

      {/* Location Consent Modal */}
      <LocationConsentModal
        visible={showConsentModal}
        onAccept={() => {
          setShowConsentModal(false)
          captureLocation()
        }}
        onDecline={() => {
          setShowConsentModal(false)
          message.info('Location access is required for attendance punching')
        }}
      />
    </>
  )
}

export default LocationAttendanceModal
