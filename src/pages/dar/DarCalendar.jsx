import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Calendar,
  Select,
  Space,
  Modal,
  List,
  Tag,
  Empty,
  Skeleton,
  Badge,
} from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchDarList, fetchProjects, transformDarToCalendar } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const DarCalendar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { darList, projects, loading } = useSelector((state) => state.dar)

  const [calendarValue, setCalendarValue] = useState(dayjs())
  const [filters, setFilters] = useState({
    project: undefined,
    status: undefined,
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDateDars, setSelectedDateDars] = useState([])

  const calendarEvents = useMemo(
    () => (darList.length > 0 ? transformDarToCalendar(darList) : []),
    [darList]
  )

  const fetchDataForMonth = (date) => {
    const monthStart = date.startOf('month').format('YYYY-MM-DD')
    const monthEnd = date.endOf('month').format('YYYY-MM-DD')
    dispatch(fetchDarList({ dateFrom: monthStart, dateTo: monthEnd }))
  }

  useEffect(() => {
    fetchDataForMonth(calendarValue)
    dispatch(fetchProjects())
  }, [dispatch])

  const handlePanelChange = (date) => {
    setCalendarValue(date)
    fetchDataForMonth(date)
  }

  const getStatusColor = (status) => {
    const colorMap = {
      Draft: 'default',
      Submitted: 'processing',
      Approved: 'success',
      Rejected: 'error',
    }
    return colorMap[status] || 'default'
  }

  // Get DARs for a specific date
  const getDarsForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD')
    return calendarEvents.filter((event) => {
      if (filters.project && event.project !== filters.project) return false
      if (filters.status && event.status !== filters.status) return false
      return event.date === dateStr
    })
  }

  // Calendar cell renderer
  const dateCellRender = (value) => {
    const dars = getDarsForDate(value)
    if (dars.length === 0) return null

    const totalHours = dars.reduce((sum, dar) => sum + dar.totalHours, 0)

    return (
      <div
        style={{
          padding: '4px',
          cursor: 'pointer',
        }}
        onClick={() => {
          setSelectedDate(value)
          setSelectedDateDars(dars)
          setModalVisible(true)
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
          {dars.length} DAR{dars.length > 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: '10px', color: '#666' }}>
          {totalHours.toFixed(1)}h
        </div>
        <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: '2px' }}>
          {dars.slice(0, 3).map((dar) => (
            <Badge
              key={dar.id}
              color={getStatusColor(dar.status)}
              style={{ width: '4px', height: '4px', borderRadius: '50%' }}
            />
          ))}
          {dars.length > 3 && (
            <span style={{ fontSize: '9px', color: '#999' }}>+{dars.length - 3}</span>
          )}
        </div>
      </div>
    )
  }

  // Month cell renderer (summary view)
  const monthCellRender = (value) => {
    const monthStart = value.startOf('month')
    const monthEnd = value.endOf('month')
    const monthDars = calendarEvents.filter((event) => {
      const eventDate = dayjs(event.date)
      if (filters.project && event.project !== filters.project) return false
      if (filters.status && event.status !== filters.status) return false
      return eventDate.isAfter(monthStart.subtract(1, 'day')) && eventDate.isBefore(monthEnd.add(1, 'day'))
    })

    if (monthDars.length === 0) return null

    const totalHours = monthDars.reduce((sum, dar) => sum + dar.totalHours, 0)

    return (
      <div style={{ padding: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
          {monthDars.length} DARs
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {totalHours.toFixed(1)}h
        </div>
      </div>
    )
  }

  const handleViewDar = (darId) => {
    setModalVisible(false)
    navigate(`/dar/view/${darId}`)
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  if (loading && calendarEvents.length === 0) {
    return (
      <DashboardLayout>
        <Card>
          <Skeleton active />
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Calendar View</h1>
          <p className="page-description">View DARs in calendar format</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Filters */}
            <Space wrap>
              <Select
                placeholder="Filter by Project"
                style={{ width: 200 }}
                allowClear
                value={filters.project}
                onChange={(value) => handleFilterChange('project', value)}
              >
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.name}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="Filter by Status"
                style={{ width: 150 }}
                allowClear
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Submitted">Submitted</Select.Option>
                <Select.Option value="Approved">Approved</Select.Option>
                <Select.Option value="Rejected">Rejected</Select.Option>
              </Select>
            </Space>

            {/* Calendar */}
            <Card>
              <Calendar
                value={calendarValue}
                onPanelChange={handlePanelChange}
                dateCellRender={dateCellRender}
                monthCellRender={monthCellRender}
                style={{ background: '#fff' }}
              />
            </Card>

            {/* Legend */}
            <Card size="small">
              <Space>
                <span style={{ fontWeight: 'bold' }}>Status Colors:</span>
                <Tag color="default">Draft</Tag>
                <Tag color="processing">Submitted</Tag>
                <Tag color="success">Approved</Tag>
                <Tag color="error">Rejected</Tag>
              </Space>
            </Card>
          </Space>
        </Card>

        {/* Date Detail Modal */}
        <Modal
          title={
            selectedDate ? `DARs for ${selectedDate.format('MMMM DD, YYYY')}` : 'DARs'
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          {selectedDateDars.length === 0 ? (
            <Empty description="No DARs found for this date" />
          ) : (
            <List
              dataSource={selectedDateDars}
              renderItem={(dar) => (
                <List.Item
                  actions={[
                    <a key="view" onClick={() => handleViewDar(dar.id)}>
                      View Details
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{dar.project}</span>
                        <Tag color={getStatusColor(dar.status)}>{dar.status}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>Total Hours: {dar.totalHours} hrs</div>
                        {dar.activities && dar.activities.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <strong>Activities:</strong>
                            <ul style={{ marginTop: '4px', marginBottom: 0 }}>
                              {dar.activities.slice(0, 3).map((activity, index) => (
                                <li key={index} style={{ fontSize: '12px' }}>
                                  {activity.taskTitle} ({activity.hoursSpent}h)
                                </li>
                              ))}
                              {dar.activities.length > 3 && (
                                <li style={{ fontSize: '12px', color: '#999' }}>
                                  +{dar.activities.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default DarCalendar
