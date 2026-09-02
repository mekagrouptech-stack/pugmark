import React, { useEffect, useState } from 'react'
import { Card, Table, DatePicker, Space, Button, Row, Col, Tag, Typography, Modal, Select, message } from 'antd'
import {
  EnvironmentOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'
import AttendanceMap from '../../components/map/AttendanceMap'
import { fetchAttendance } from '../../features/attendance/attendanceSlice'
import { fetchOffices } from '../../features/office/officeSlice'
import { formatDistance } from '../../utils/locationUtils'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { RangePicker } = DatePicker
const { Text, Title } = Typography

const AttendanceReportWithMap = ({ embedded = false }) => {
  const dispatch = useDispatch()
  const { attendance, loading } = useSelector((state) => state.attendance)
  const { offices } = useSelector((state) => state.office)
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [mapModalVisible, setMapModalVisible] = useState(false)
  const [filterOffice, setFilterOffice] = useState('all')

  useEffect(() => {
    dispatch(fetchAttendance())
    dispatch(fetchOffices())
  }, [dispatch])

  const handleViewMap = (record) => {
    setSelectedRecord(record)
    setMapModalVisible(true)
  }

  const filteredAttendance = attendance.filter((record) => {
    const dateMatch =
      !dateRange ||
      (dateRange[0] && dateRange[1] &&
        !dayjs(record.date).isBefore(dateRange[0], 'day') &&
        !dayjs(record.date).isAfter(dateRange[1], 'day'))
    const officeMatch = filterOffice === 'all' || record.officeId === parseInt(filterOffice)
    return dateMatch && officeMatch
  })

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => formatDate(date),
    },
    {
      title: 'Check In',
      key: 'checkIn',
      render: (_, record) => (
        <div>
          <div>{record.checkIn}</div>
          {record.checkInLocation && (
            <div style={{ marginTop: 4 }}>
              <Tag
                size="small"
                color={record.checkInLocation.isWithinRadius ? 'green' : 'orange'}
                icon={record.checkInLocation.isWithinRadius ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {formatDistance(record.checkInLocation.distance)}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Check Out',
      key: 'checkOut',
      render: (_, record) => (
        <div>
          <div>{record.checkOut || '-'}</div>
          {record.checkOutLocation && (
            <div style={{ marginTop: 4 }}>
              <Tag
                size="small"
                color={record.checkOutLocation.isWithinRadius ? 'green' : 'orange'}
                icon={record.checkOutLocation.isWithinRadius ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {formatDistance(record.checkOutLocation.distance)}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Office',
      dataIndex: 'officeName',
      key: 'officeName',
      render: (name) => name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Present' ? 'green' : status === 'Absent' ? 'red' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewMap(record)}
          disabled={!record.checkInLocation && !record.checkOutLocation}
        >
          View Map
        </Button>
      ),
    },
  ]

  const getOfficeForRecord = (record) => {
    if (!record.officeId) return null
    return offices.find((office) => office.id === record.officeId)
  }

  const content = (
    <div className="page-container">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <Title level={2}>Attendance Report with Location</Title>
          <Text type="secondary">View attendance records with punch locations on map</Text>
        </div>

        <Card className="card-container" style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space wrap>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                size="large"
              />
              <Select
                style={{ width: 200 }}
                placeholder="Filter by Office"
                value={filterOffice}
                onChange={setFilterOffice}
                size="large"
              >
                <Select.Option value="all">All Offices</Select.Option>
                {offices.map((office) => (
                  <Select.Option key={office.id} value={office.id.toString()}>
                    {office.name}
                  </Select.Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchAttendance())} size="large">
                Refresh
              </Button>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredAttendance}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} records`,
            }}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <div style={{ color: '#8c8c8c' }}>No attendance records found</div>
                </div>
              ),
            }}
          />
        </Card>

        {/* Map View Modal */}
        <Modal
          title={
            <Space>
              <EnvironmentOutlined />
              <span>
                Attendance Location - {selectedRecord && dayjs(selectedRecord.date).format('DD/MM/YYYY')}
              </span>
            </Space>
          }
          open={mapModalVisible}
          onCancel={() => {
            setMapModalVisible(false)
            setSelectedRecord(null)
          }}
          footer={[
            <Button key="close" onClick={() => setMapModalVisible(false)}>
              Close
            </Button>,
          ]}
          width={900}
        >
          {selectedRecord && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Check In Location" style={{ marginBottom: 16 }}>
                  {selectedRecord.checkInLocation ? (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Coordinates:</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Lat: {selectedRecord.checkInLocation.latitude?.toFixed(6) || 'N/A'}
                            <br />
                            Lng: {selectedRecord.checkInLocation.longitude?.toFixed(6) || 'N/A'}
                          </Text>
                        </div>
                      </div>
                      <div>
                        <Text strong>Distance:</Text>
                        <Tag
                          color={selectedRecord.checkInLocation.isWithinRadius ? 'green' : 'orange'}
                          style={{ marginLeft: 8 }}
                        >
                          {formatDistance(selectedRecord.checkInLocation.distance)}
                        </Tag>
                        <Tag
                          color={selectedRecord.checkInLocation.isWithinRadius ? 'success' : 'warning'}
                          style={{ marginLeft: 4 }}
                        >
                          {selectedRecord.checkInLocation.isWithinRadius ? 'Within Range' : 'Outside Range'}
                        </Tag>
                      </div>
                      <div>
                        <Text strong>Time:</Text>
                        <Text style={{ marginLeft: 8 }}>{selectedRecord.checkIn}</Text>
                      </div>
                    </Space>
                  ) : (
                    <Text type="secondary">No location data available</Text>
                  )}
                </Card>

                {selectedRecord.checkOutLocation && (
                  <Card size="small" title="Check Out Location">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Coordinates:</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Lat: {selectedRecord.checkOutLocation.latitude?.toFixed(6) || 'N/A'}
                            <br />
                            Lng: {selectedRecord.checkOutLocation.longitude?.toFixed(6) || 'N/A'}
                          </Text>
                        </div>
                      </div>
                      <div>
                        <Text strong>Distance:</Text>
                        <Tag
                          color={selectedRecord.checkOutLocation.isWithinRadius ? 'green' : 'orange'}
                          style={{ marginLeft: 8 }}
                        >
                          {formatDistance(selectedRecord.checkOutLocation.distance)}
                        </Tag>
                        <Tag
                          color={selectedRecord.checkOutLocation.isWithinRadius ? 'success' : 'warning'}
                          style={{ marginLeft: 4 }}
                        >
                          {selectedRecord.checkOutLocation.isWithinRadius ? 'Within Range' : 'Outside Range'}
                        </Tag>
                      </div>
                      <div>
                        <Text strong>Time:</Text>
                        <Text style={{ marginLeft: 8 }}>{selectedRecord.checkOut}</Text>
                      </div>
                    </Space>
                  </Card>
                )}
              </Col>
              <Col xs={24} md={12}>
                <AttendanceMap
                  userLocation={
                    selectedRecord.checkInLocation
                      ? {
                          latitude: selectedRecord.checkInLocation.latitude,
                          longitude: selectedRecord.checkInLocation.longitude,
                        }
                      : null
                  }
                  officeLocation={getOfficeForRecord(selectedRecord)}
                  radius={getOfficeForRecord(selectedRecord)?.radius}
                  height={400}
                  showGeofence={true}
                  showDistance={true}
                />
              </Col>
            </Row>
          )}
        </Modal>
      </div>
  )
  return embedded ? content : <DashboardLayout>{content}</DashboardLayout>
}

export default AttendanceReportWithMap
