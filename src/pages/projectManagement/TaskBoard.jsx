import React, { useEffect, useState } from 'react'
import { Card, Button, Space, Select, Modal, Form, Input, Tag, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
// Note: Drag and drop can be added later with react-beautiful-dnd or @dnd-kit
import { fetchTasks, updateTaskStatus, createTask } from '../../features/projectManagement/taskSlice'
import { fetchProjects } from '../../features/projectManagement/projectSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { TextArea } = Input

// Note: react-beautiful-dnd requires installation
// For now, using a simple card-based layout
const TaskBoard = () => {
  const dispatch = useDispatch()
  const { tasks, loading } = useSelector((state) => state.task)
  const { projects } = useSelector((state) => state.project)
  const { user } = useSelector((state) => state.auth)
  const [selectedProject, setSelectedProject] = useState(null)
  const [taskModalVisible, setTaskModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchTasks())
    dispatch(fetchProjects())
  }, [dispatch])

  const filteredTasks = selectedProject
    ? tasks.filter((t) => t.projectId === selectedProject)
    : tasks

  const taskColumns = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    blocked: filteredTasks.filter((t) => t.status === 'blocked'),
    review: filteredTasks.filter((t) => t.status === 'review'),
    approved: filteredTasks.filter((t) => t.status === 'approved'),
    completed: filteredTasks.filter((t) => t.status === 'completed'),
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await dispatch(
        updateTaskStatus({
          id: taskId,
          status: newStatus,
          comment: `Status changed to ${newStatus}`,
        })
      ).unwrap()
    } catch (error) {
      message.error('Failed to update task status')
    }
  }

  const onTaskCreate = async (values) => {
    try {
      await dispatch(
        createTask({
          ...values,
          projectId: selectedProject,
        })
      ).unwrap()
      setTaskModalVisible(false)
      form.resetFields()
      dispatch(fetchTasks())
    } catch (error) {
      message.error('Failed to create task')
    }
  }

  const getStatusColor = (status) => {
    const colorMap = {
      todo: 'default',
      in_progress: 'processing',
      blocked: 'error',
      review: 'warning',
      approved: 'success',
      completed: 'success',
    }
    return colorMap[status] || 'default'
  }

  const TaskCard = ({ task }) => (
    <Card
      size="small"
      style={{ marginBottom: 8, cursor: 'pointer' }}
      onClick={() => handleStatusChange(task.id, getNextStatus(task.status))}
    >
      <div>
        <strong>{task.title}</strong>
        <Tag color={getStatusColor(task.status)} style={{ float: 'right' }}>
          {task.status.replace('_', ' ')}
        </Tag>
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
        {task.projectName}
      </div>
      {task.dueDate && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
          Due: {task.dueDate}
        </div>
      )}
    </Card>
  )

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['todo', 'in_progress', 'review', 'approved', 'completed']
    const currentIndex = statusFlow.indexOf(currentStatus)
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : currentStatus
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Task Board</h1>
          <p className="page-description">Manage tasks in Kanban board</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space>
              <Select
                placeholder="Filter by Project"
                style={{ width: 250 }}
                allowClear
                value={selectedProject}
                onChange={setSelectedProject}
              >
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.id}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setTaskModalVisible(true)}
                disabled={!selectedProject}
              >
                Create Task
              </Button>
            </Space>

            <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
              {Object.entries(taskColumns).map(([status, statusTasks]) => (
                <Card
                  key={status}
                  title={
                    <span>
                      {status.replace('_', ' ').toUpperCase()} ({statusTasks.length})
                    </span>
                  }
                  style={{ minWidth: 250, flex: 1 }}
                >
                  {statusTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {statusTasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                      No tasks
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Space>
        </Card>

        <Modal
          title="Create Task"
          open={taskModalVisible}
          onCancel={() => {
            setTaskModalVisible(false)
            form.resetFields()
          }}
          footer={null}
        >
          <Form form={form} onFinish={onTaskCreate} layout="vertical">
            <Form.Item
              name="title"
              label="Task Title"
              rules={[{ required: true, message: 'Please enter task title' }]}
            >
              <Input placeholder="Enter task title" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={4} placeholder="Enter task description" />
            </Form.Item>
            <Form.Item
              name="assigneeId"
              label="Assign To"
              initialValue={user?.id}
            >
              <Select>
                <Select.Option value={user?.id}>{user?.name}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="priority"
              label="Priority"
              initialValue="medium"
            >
              <Select>
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="high">High</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setTaskModalVisible(false)
                    form.resetFields()
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default TaskBoard
