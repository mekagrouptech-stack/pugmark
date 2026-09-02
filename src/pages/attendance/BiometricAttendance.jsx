import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Card, Table, DatePicker, Space, Tag, Button, message, Typography } from 'antd'
import { ReloadOutlined, ScanOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import biometricService from '../../features/attendance/biometricService'
import api from '../../services/api'

const { Text } = Typography

// Derived punch direction. The device's own status code is unreliable (eSSL
// terminals report "Check In" for every punch unless the in/out key is pressed),
// so the backend derives direction by position: an employee's FIRST punch of the
// day is the check-in and their LAST punch is the check-out. Everything between
// is an intermediate swipe and does not affect the day's in/out times.
const PUNCH_TYPE_LABELS = {
  IN: { label: 'Punch In', color: 'green' },
  OUT: { label: 'Punch Out', color: 'red' },
  MID: { label: 'Mid Punch', color: 'default' },
}

// eSSL / ZKTeco raw status codes, shown only as secondary reference.
const STATUS_LABELS = {
  0: 'Check In',
  1: 'Check Out',
  2: 'Break Out',
  3: 'Break In',
  4: 'OT In',
  5: 'OT Out',
}

// eSSL / ZKTeco verification-mode codes
const VERIFY_LABELS = {
  1: 'Fingerprint',
  4: 'Card',
  15: 'Face',
}

const REFRESH_INTERVAL_MS = 15000

const BiometricAttendance = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [date, setDate] = useState(dayjs())
  // Kept in a ref so the polling interval always reads the current date
  // without needing to be torn down and recreated on every change.
  const dateRef = useRef(date)

  const load = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true)
      const list = await biometricService.getDeviceLogs({
        date: dateRef.current.format('YYYY-MM-DD'),
      })
      setData((list || []).map((item) => ({ ...item, key: item.id })))
    } catch (err) {
      message.error(err?.message || 'Failed to load biometric attendance logs')
      setData([])
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  useEffect(() => {
    dateRef.current = date
    load()
  }, [date, load])

  // Pull punches from BOTH sources: FTP/WebDav CSV uploads AND the SOAP API.
  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await api.post('/ebio/pull', null, {
        params: { date: date.format('YYYY-MM-DD') },
      })
      message.success(res.data?.message || 'Biometric punches imported')
      load(false)
    } catch (err) {
      message.error(
        err?.response?.data?.message || err?.message || 'Biometric import failed'
      )
    } finally {
      setSyncing(false)
    }
  }

  // Auto-refresh every 15s without flashing the table spinner.
  useEffect(() => {
    const timer = setInterval(() => load(false), REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name, record) =>
        name || <Text type="secondary">Unmapped PIN {record.devicePin}</Text>,
    },
    {
      title: 'PIN',
      dataIndex: 'devicePin',
      key: 'devicePin',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => dept || '-',
    },
    {
      title: 'Time',
      dataIndex: 'punchTime',
      key: 'punchTime',
      render: (time) => (time ? dayjs(time).format('DD MMM YYYY, hh:mm:ss A') : '-'),
    },
    {
      title: 'Type',
      dataIndex: 'punchType',
      key: 'punchType',
      filters: [
        { text: 'Punch In', value: 'IN' },
        { text: 'Punch Out', value: 'OUT' },
        { text: 'Mid Punch', value: 'MID' },
      ],
      onFilter: (value, record) => record.punchType === value,
      render: (punchType, record) => {
        const entry = PUNCH_TYPE_LABELS[punchType] || PUNCH_TYPE_LABELS.MID
        return (
          <Space size={4}>
            <Tag color={entry.color}>{entry.label}</Tag>
            {record.punchCount > 1 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.punchIndex}/{record.punchCount}
              </Text>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Device Reported',
      dataIndex: 'status',
      key: 'status',
      responsive: ['lg'],
      render: (status) => (
        <Text type="secondary">{STATUS_LABELS[status] || `Code ${status}`}</Text>
      ),
    },
    {
      title: 'Verified By',
      dataIndex: 'verifyMode',
      key: 'verifyMode',
      render: (mode) => VERIFY_LABELS[mode] || `Mode ${mode}`,
    },
  ]

  return (
    <DashboardLayout>
      <Card
        title={
          <Space>
            <ScanOutlined />
            Biometric Attendance
          </Space>
        }
        extra={
          <Space>
            <DatePicker
              value={date}
              onChange={(value) => setDate(value || dayjs())}
              allowClear={false}
              format="DD MMM YYYY"
            />
            <Button icon={<ReloadOutlined />} onClick={() => load()}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              loading={syncing}
              onClick={handleSync}
            >
              Import Punches
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Each employee's first punch of the day is taken as Punch In and their last punch as Punch Out."
          description="Punches in between are recorded but do not change the day's in/out times. The same rule drives My Attendance, Team Attendance, the daily reports and payroll."
        />
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: (total) => `Total ${total} punches`,
          }}
          size="middle"
        />
      </Card>
    </DashboardLayout>
  )
}

export default BiometricAttendance
