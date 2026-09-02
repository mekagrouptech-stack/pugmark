import React, { useEffect, useState } from 'react'
import { Card, Table, Button, DatePicker, Select, Input, Space, message } from 'antd'
import { SaveOutlined, CalendarOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { fetchProjects } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const DarTimesheet = () => {
  const dispatch = useDispatch()
  const { projects, loading } = useSelector((state) => state.dar)
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week'))
  const [project, setProject] = useState(undefined)
  const [entries, setEntries] = useState({})
  const [saving, setSaving] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const weekLabel = `${weekStart.format('MMM D')} – ${weekStart.add(6, 'day').format('MMM D, YYYY')}`

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const getEntryKey = (dateStr, proj) => `${dateStr}_${proj || 'default'}`
  const getHours = (dateStr, proj) => {
    const key = getEntryKey(dateStr, proj)
    const val = entries[key]
    return val === undefined || val === '' ? '' : Number(val)
  }
  const setHours = (dateStr, proj, value) => {
    const key = getEntryKey(dateStr, proj)
    setEntries((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = weekDays.map((d) => ({
        date: d.format('YYYY-MM-DD'),
        project: project || 'General',
        hours: getHours(d.format('YYYY-MM-DD'), project) || 0,
      }))
      console.log('Timesheet submit:', payload)
      await new Promise((r) => setTimeout(r, 500))
      message.success('Timesheet saved successfully')
    } catch (err) {
      message.error('Failed to save timesheet')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      title: 'Project / Activity',
      dataIndex: 'project',
      key: 'project',
      width: 200,
      render: (_, record) => record.label,
    },
    ...weekDays.map((d) => ({
      title: d.format('ddd D'),
      dataIndex: d.format('YYYY-MM-DD'),
      key: d.format('YYYY-MM-DD'),
      width: 100,
      render: (_, record) => (
        <Input
          type="number"
          min={0}
          max={24}
          step={0.5}
          placeholder="0"
          value={getHours(d.format('YYYY-MM-DD'), record.projectValue)}
          onChange={(e) =>
            setHours(d.format('YYYY-MM-DD'), record.projectValue, e.target.value)
          }
          style={{ width: 70 }}
        />
      ),
    })),
    {
      title: 'Total',
      key: 'total',
      width: 80,
      render: (_, record) => {
        const total = weekDays.reduce(
          (sum, d) => sum + (getHours(d.format('YYYY-MM-DD'), record.projectValue) || 0),
          0
        )
        return <span style={{ fontWeight: 600 }}>{total || '-'}</span>
      },
    },
  ]

  const dataSource = [
    {
      key: '1',
      label: project ? projects.find((p) => p.name === project)?.name || project : 'General',
      projectValue: project,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Timesheet</h1>
          <p className="page-description">Log your daily hours for the week (DAR)</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap>
              <DatePicker
                picker="week"
                value={weekStart}
                onChange={(d) => d && setWeekStart(d.startOf('week'))}
                style={{ width: 200 }}
                suffixIcon={<CalendarOutlined />}
              />
              <Select
                placeholder="All projects"
                style={{ width: 220 }}
                allowClear
                value={project}
                onChange={setProject}
                loading={loading}
              >
                {projects.map((p) => (
                  <Select.Option key={p.id} value={p.name}>
                    {p.name}
                  </Select.Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                Save Timesheet
              </Button>
            </Space>

            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13 }}>
              Week: {weekLabel}
            </div>

            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              size="middle"
              bordered
            />
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DarTimesheet
