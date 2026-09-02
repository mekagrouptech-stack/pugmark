import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Select,
  DatePicker,
  Space,
  Tooltip,
  Tag,
  Drawer,
  Descriptions,
  Empty,
  Skeleton,
} from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchDarList, fetchProjects, transformDarToGantt } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { RangePicker } = DatePicker

const GanttChart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { darList, projects, loading } = useSelector((state) => state.dar)

  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(7, 'days'), dayjs()],
    project: undefined,
    status: undefined,
  })
  const [selectedTask, setSelectedTask] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [groupBy, setGroupBy] = useState('project')

  const ganttTasks = useMemo(
    () => (darList.length > 0 ? transformDarToGantt(darList) : []),
    [darList]
  )

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  useEffect(() => {
    if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
      const dateFrom = filters.dateRange[0].format('YYYY-MM-DD')
      const dateTo = filters.dateRange[1].format('YYYY-MM-DD')
      dispatch(fetchDarList({ dateFrom, dateTo }))
    }
  }, [dispatch, filters.dateRange])

  // Filter and group tasks
  const filteredAndGroupedTasks = useMemo(() => {
    let filtered = [...ganttTasks]

    // Apply filters
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = filters.dateRange[0].startOf('day')
      const endDate = filters.dateRange[1].endOf('day')
      filtered = filtered.filter((task) => {
        const taskDate = dayjs(task.startDate)
        return taskDate.isAfter(startDate.subtract(1, 'day')) && taskDate.isBefore(endDate.add(1, 'day'))
      })
    }

    if (filters.project) {
      filtered = filtered.filter((task) => task.projectName === filters.project)
    }

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status)
    }

    // Group tasks
    const grouped = {}
    filtered.forEach((task) => {
      const key = groupBy === 'project' ? task.projectName : task.status
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(task)
    })

    return grouped
  }, [ganttTasks, filters, groupBy])

  // Calculate timeline bounds (use filter range when set, else from task data)
  const timelineBounds = useMemo(() => {
    if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
      return {
        min: filters.dateRange[0].startOf('day'),
        max: filters.dateRange[1].endOf('day'),
      }
    }
    if (ganttTasks.length === 0) {
      return { min: dayjs().startOf('day'), max: dayjs().add(1, 'day') }
    }
    const dates = ganttTasks.map((task) => [
      dayjs(task.startDate),
      dayjs(task.endDate),
    ]).flat()
    const timestamps = dates.map((d) => d.valueOf())
    return {
      min: dayjs(Math.min(...timestamps)).startOf('day'),
      max: dayjs(Math.max(...timestamps)).endOf('day'),
    }
  }, [ganttTasks, filters.dateRange])

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setDrawerVisible(true)
  }

  const handleViewDar = () => {
    if (selectedTask) {
      setDrawerVisible(false)
      navigate(`/dar/view/${selectedTask.darId}`)
    }
  }

  const getStatusColor = (status) => {
    const colorMap = {
      Draft: '#d9d9d9',
      Submitted: '#1890ff',
      Approved: '#52c41a',
      Rejected: '#ff4d4f',
    }
    return colorMap[status] || '#d9d9d9'
  }

  const getCategoryColor = (category) => {
    const colorMap = {
      Design: '#722ed1',
      Engineering: '#1890ff',
      Site: '#52c41a',
      QAQC: '#fa8c16',
      Admin: '#13c2c2',
    }
    return colorMap[category] || '#d9d9d9'
  }

  // Calculate position and width for task bar
  const getTaskBarStyle = (task) => {
    const taskStart = dayjs(task.startDate)
    const taskEnd = dayjs(task.endDate)
    const timelineStart = timelineBounds.min.startOf('day')
    const timelineEnd = timelineBounds.max.endOf('day')
    
    const totalDays = Math.max(1, timelineEnd.diff(timelineStart, 'day') + 1)
    const taskStartOffset = Math.max(0, taskStart.diff(timelineStart, 'day'))
    const taskDurationHours = taskEnd.diff(taskStart, 'hour', true)
    const taskDurationDays = taskDurationHours / 24
    
    const leftPercent = (taskStartOffset / totalDays) * 100
    const widthPercent = Math.max((taskDurationDays / totalDays) * 100, 2) // Min 2% width

    return {
      left: `${Math.min(leftPercent, 98)}%`,
      width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
      backgroundColor: getStatusColor(task.status),
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  if (loading && ganttTasks.length === 0) {
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
          <h1 className="page-title">Gantt Chart View</h1>
          <p className="page-description">Timeline visualization of DAR activities</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Filters */}
            <Space wrap>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Filter by Project"
                style={{ width: 200 }}
                allowClear
                value={filters.project}
                onChange={(value) => handleFilterChange('project', value)}
              >
                {(projects || []).map((project) => (
                  <Select.Option key={project.id || project.name} value={project.name}>
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
              <Select
                placeholder="Group By"
                style={{ width: 150 }}
                value={groupBy}
                onChange={setGroupBy}
              >
                <Select.Option value="project">Project</Select.Option>
                <Select.Option value="status">Status</Select.Option>
              </Select>
            </Space>

            {/* Gantt Chart */}
            {Object.keys(filteredAndGroupedTasks).length === 0 ? (
              <Empty description="No tasks found for the selected filters" />
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                {/* Timeline Header */}
                <div
                  style={{
                    display: 'flex',
                    minWidth: '100%',
                    borderBottom: '2px solid #1890ff',
                    padding: '8px 0',
                    background: '#fafafa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <div style={{ width: '200px', flexShrink: 0, padding: '4px 12px', fontSize: '12px', fontWeight: 600 }}>
                    Task / Date
                  </div>
                  <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                    {Array.from({ length: Math.max(1, timelineBounds.max.diff(timelineBounds.min, 'day') + 1) }).map(
                      (_, index) => {
                        const date = timelineBounds.min.add(index, 'day')
                        return (
                          <div
                            key={index}
                            style={{
                              flex: 1,
                              minWidth: '80px',
                              textAlign: 'center',
                              borderRight: '1px solid #e8e8e8',
                              padding: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {date.format('MMM DD')}
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>

                {/* Task Rows */}
                {Object.entries(filteredAndGroupedTasks).map(([groupKey, tasks]) => (
                  <div key={groupKey} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {/* Group Header */}
                    <div
                      style={{
                        display: 'flex',
                        background: '#f5f5f5',
                        padding: '8px 12px',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #e8e8e8',
                      }}
                    >
                      <div style={{ width: '200px', flexShrink: 0 }}>
                        {groupBy === 'project' ? (
                          <Tag color="blue">{groupKey}</Tag>
                        ) : (
                          <Tag color={getStatusColor(groupKey)}>{groupKey}</Tag>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}></div>
                    </div>

                    {/* Tasks in Group */}
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          padding: '8px 0',
                          position: 'relative',
                          minHeight: '40px',
                          alignItems: 'center',
                        }}
                      >
                        {/* Task Label */}
                        <div
                          style={{
                            width: '200px',
                            flexShrink: 0,
                            padding: '0 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Tag color={getCategoryColor(task.category)} size="small">
                            {task.category}
                          </Tag>
                          <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.taskTitle}
                          </span>
                        </div>

                        {/* Timeline Area */}
                        <div
                          style={{
                            flex: 1,
                            position: 'relative',
                            height: '32px',
                            minWidth: '600px',
                          }}
                        >
                          <Tooltip
                            title={
                              <div>
                                <div><strong>{task.taskTitle}</strong></div>
                                <div>Project: {task.projectName}</div>
                                <div>Hours: {task.totalHours}</div>
                                <div>Status: {task.status}</div>
                                <div>Time: {task.startTime} - {task.endTime}</div>
                              </div>
                            }
                          >
                            <div
                              onClick={() => handleTaskClick(task)}
                              style={{
                                ...getTaskBarStyle(task),
                                position: 'absolute',
                                height: '24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scaleY(1.2)'
                                e.currentTarget.style.zIndex = '5'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scaleY(1)'
                                e.currentTarget.style.zIndex = '1'
                              }}
                            >
                              {task.totalHours}h
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Space>
        </Card>

        {/* Task Detail Drawer */}
        <Drawer
          title="Task Details"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={400}
          extra={
            <Space>
              <a onClick={handleViewDar}>View Full DAR</a>
            </Space>
          }
        >
          {selectedTask && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Task Title">
                {selectedTask.taskTitle}
              </Descriptions.Item>
              <Descriptions.Item label="Project">
                {selectedTask.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color={getCategoryColor(selectedTask.category)}>
                  {selectedTask.category}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedTask.status)}>
                  {selectedTask.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Time">
                {selectedTask.startTime} - {selectedTask.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="Hours">
                {selectedTask.totalHours} hrs
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedTask.description || 'No description'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Drawer>
      </div>
    </DashboardLayout>
  )
}

export default GanttChart
