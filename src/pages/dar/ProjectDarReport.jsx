import React, { useEffect, useMemo, useState } from 'react'
import { Card, Table, DatePicker, Space, Statistic, Button, Form, Input, message, Modal } from 'antd'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjectSummary, fetchProjects, createProject } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom'

const { RangePicker } = DatePicker

const ProjectDarReport = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { projectSummary, projects, loading } = useSelector((state) => state.dar)
  const [dateRange, setDateRange] = useState(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectForm] = Form.useForm()

  useEffect(() => {
    dispatch(fetchProjectSummary({}))
    dispatch(fetchProjects())
  }, [dispatch])

  const handleDateChange = (value) => {
    setDateRange(value)
    const params = {}
    if (value && value.length === 2) {
      params.startDate = value[0].format('YYYY-MM-DD')
      params.endDate = value[1].format('YYYY-MM-DD')
    }
    dispatch(fetchProjectSummary(params))
  }

  const handleCreateProject = () => {
    projectForm
      .validateFields()
      .then((values) => {
        dispatch(createProject({ name: values.name, description: values.description || '' }))
          .unwrap()
          .then(() => {
            message.success('Project created successfully')
            setProjectModalOpen(false)
            projectForm.resetFields()
          })
          .catch((err) => {
            message.error(err || 'Failed to create project')
          })
      })
      .catch(() => {})
  }

  const columns = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'No. of DAR Days',
      dataIndex: 'darCount',
      key: 'darCount',
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (h) => `${h} hrs`,
    },
    {
      title: 'Avg Hours / Day',
      dataIndex: 'averageHoursPerDay',
      key: 'averageHoursPerDay',
      render: (h) => `${h} hrs`,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ]

  const tableData = useMemo(() => {
    const summaryByName = new Map(
      (projectSummary || []).map((s) => [s.projectName || 'Unassigned', s])
    )
    return (projects || []).map((p) => {
      const key = p.name || 'Unassigned'
      const s = summaryByName.get(key) || {}
      return {
        key: p.id,
        projectName: key,
        darCount: s.darCount || 0,
        totalHours: s.totalHours || 0,
        averageHoursPerDay: s.averageHoursPerDay || 0,
        description: p.description || '',
      }
    })
  }, [projects, projectSummary])

  const totalProjects = tableData.length
  const totalHours = tableData.reduce((sum, p) => sum + (p.totalHours || 0), 0)

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Project</h1>
          <p className="page-description">View your DAR hours grouped by project.</p>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card
            className="card-container"
            extra={
              <Button type="primary" onClick={() => setProjectModalOpen(true)}>
                + Create Project
              </Button>
            }
          >
            <Space direction="horizontal" size="large">
              <Statistic title="Projects" value={totalProjects} />
              <Statistic title="Total Hours" value={totalHours} suffix="hrs" />
            </Space>
          </Card>

          <Card className="card-container">
            <Space style={{ marginBottom: 16 }}>
              <RangePicker
                value={dateRange}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                placeholder={['From Date', 'To Date']}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Space>
            <Table
              rowKey="key"
              columns={columns}
              dataSource={tableData}
              loading={loading}
              pagination={false}
            />
          </Card>

          <Modal
            title="Create Project"
            open={projectModalOpen}
            onOk={handleCreateProject}
            onCancel={() => {
              setProjectModalOpen(false)
              projectForm.resetFields()
            }}
            okText="Create"
          >
            <Form layout="vertical" form={projectForm}>
              <Form.Item
                label="Project Name"
                name="name"
                rules={[{ required: true, message: 'Please enter project name' }]}
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={3} placeholder="Enter project description (optional)" />
              </Form.Item>
            </Form>
          </Modal>
        </Space>
      </div>
    </DashboardLayout>
  )
}

export default ProjectDarReport

