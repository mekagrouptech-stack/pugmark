import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Space, Input } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchProjects } from '../../../features/projectManagement/projectSlice'
import DashboardLayout from '../../../layouts/DashboardLayout'
import ActionButton from '../../../components/common/ActionButton'
import ButtonGroup from '../../../components/common/ButtonGroup'
import usePagination from '../../../hooks/usePagination'
import { getTablePagination } from '../../../components/common/TablePagination'

const { Search } = Input

const ProjectList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { projects, loading } = useSelector((state) => state.project)
  const { user } = useSelector((state) => state.auth)
  const [searchText, setSearchText] = useState('')

  // Pagination hook - resets when search changes
  const { pagination, handleTableChange } = usePagination(1, 10, [searchText])

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          approved: 'green',
          submitted: 'blue',
          hod_review: 'orange',
          hr_review: 'purple',
          head_hr_review: 'cyan',
          rejected: 'red',
          draft: 'default',
        }
        return <Tag color={colorMap[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `₹${budget?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Created By',
      dataIndex: 'createdByName',
      key: 'createdByName',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <ActionButton
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/project/${record.id}`)}
            size="small"
          >
            View
          </ActionButton>
          {(user?.role === 'admin' || record.createdBy === user?.id) && (
            <ActionButton
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/project/${record.id}/edit`)}
              size="small"
            >
              Edit
            </ActionButton>
          )}
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Projects</h1>
          <p className="page-description">Manage all projects</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <ButtonGroup align="start" style={{ marginBottom: 16 }}>
              <ActionButton
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/project/create')}
              >
                Create Project
              </ActionButton>
            </ButtonGroup>

            <Space style={{ marginBottom: 16 }}>
              <Search
                placeholder="Search projects..."
                allowClear
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={setSearchText}
              />
            </Space>

            <Table
              columns={columns}
              dataSource={projects.filter((p) =>
                searchText
                  ? p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                    p.description?.toLowerCase().includes(searchText.toLowerCase())
                  : true
              )}
              loading={loading}
              rowKey="id"
              pagination={getTablePagination({
                ...pagination,
                total: projects.length,
              })}
              onChange={handleTableChange}
              scroll={{ x: 800 }}
            />
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ProjectList
