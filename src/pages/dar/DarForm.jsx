import React, { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Space,
  TimePicker,
  message,
  Button,
} from 'antd'
import ActionButton from '../../components/common/ActionButton'
import FormButtonGroup from '../../components/common/FormButtonGroup'
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  createDar,
  updateDar,
  submitDar,
  fetchDarById,
  fetchProjects,
  clearSelectedDar,
} from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { TextArea } = Input
const { Option } = Select

const DarForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { selectedDar, projects, loading } = useSelector((state) => state.dar)
  const [form] = Form.useForm()
  const [totalHours, setTotalHours] = useState(0)

  useEffect(() => {
    dispatch(fetchProjects())
    if (isEdit) {
      dispatch(fetchDarById(id))
    } else {
      dispatch(clearSelectedDar())
      form.setFieldsValue({
        date: dayjs(),
      })
    }
    return () => {
      dispatch(clearSelectedDar())
    }
  }, [dispatch, id, isEdit, form])

  useEffect(() => {
    if (selectedDar && isEdit) {
      const validStatus = (s) => (statusOptions.includes(s) ? s : 'In Progress')
      const parseTime = (t) => {
        if (!t) return null
        const formats = ['HH:mm', 'HH:mm:ss', 'h:mm a']
        for (const fmt of formats) {
          const parsed = dayjs(t, fmt, true)
          if (parsed.isValid()) return parsed
        }
        return dayjs(t)
      }
      const activities = (selectedDar.activities || []).map((activity) => ({
        ...activity,
        status: validStatus(activity.status),
        startTime: parseTime(activity.startTime),
        endTime: parseTime(activity.endTime),
        hoursSpent: parseFloat(activity.hoursSpent) || 0,
      }))
      form.setFieldsValue({
        date: dayjs(selectedDar.date),
        project: selectedDar.project || undefined,
        activities: activities.length ? activities : [{ taskTitle: '', description: '', hoursSpent: 0, status: 'In Progress' }],
        remarks: selectedDar.remarks,
      })
      calculateTotalHours(activities)
    }
  }, [selectedDar, isEdit, form])

  const calculateTotalHours = (activities) => {
    const total = activities.reduce((sum, activity) => {
      return sum + (parseFloat(activity.hoursSpent) || 0)
    }, 0)
    setTotalHours(total)
  }

  /** Calculate hours between start and end time (handles overnight, e.g. 22:00 to 06:00) */
  const calcHoursBetween = (startTime, endTime) => {
    if (!startTime || !endTime) return null
    try {
      const start = startTime.format ? startTime : dayjs(startTime, 'HH:mm')
      const end = endTime.format ? endTime : dayjs(endTime, 'HH:mm')
      let hours = end.diff(start, 'hour', true)
      if (hours < 0) hours += 24 // Overnight: e.g. 10:00 to 07:00 = 21 hours
      return hours > 0 ? Math.round(hours * 10) / 10 : 0
    } catch (e) {
      console.warn('Time calculation error:', e)
      return null
    }
  }

  /** Recalculate hoursSpent for all activities and update form */
  const recalculateHoursFromTimes = (activities) => {
    if (!Array.isArray(activities)) return activities
    let hasChanges = false
    const updated = activities.map((act) => {
      const startTime = act?.startTime
      const endTime = act?.endTime
      if (startTime && endTime) {
        const hours = calcHoursBetween(startTime, endTime)
        if (hours != null && (act.hoursSpent ?? 0) !== hours) {
          hasChanges = true
          return { ...act, hoursSpent: hours }
        }
      }
      return act
    })
    if (hasChanges) {
      form.setFieldsValue({ activities: updated })
      calculateTotalHours(updated)
    }
    return updated
  }

  const handleActivityTimeChange = (index, field, value) => {
    const activities = form.getFieldValue('activities') || []
    const updated = activities.map((act, i) =>
      i === index ? { ...act, [field]: value } : act
    )
    form.setFieldsValue({ activities: updated })
    recalculateHoursFromTimes(updated)
  }

  const handleSave = async (submit = false) => {
    try {
      const values = await form.validateFields()
      const darData = {
        date: values.date.format('YYYY-MM-DD'),
        project: values.project,
        activities: values.activities.map((activity, index) => ({
          id: activity.id || index + 1,
          taskTitle: activity.taskTitle,
          description: activity.description,
          startTime: activity.startTime ? dayjs(activity.startTime).format('HH:mm') : null,
          endTime: activity.endTime ? dayjs(activity.endTime).format('HH:mm') : null,
          hoursSpent: activity.hoursSpent || 0,
          status: activity.status,
          blockers: activity.blockers || '',
        })),
        remarks: values.remarks || '',
        totalHours: totalHours,
        // When submitting, save as Draft first; submitDar will set SUBMITTED
        status: 'Draft',
      }

      if (isEdit) {
        await dispatch(updateDar({ id, data: darData })).unwrap()
        if (submit) {
          await dispatch(submitDar(id)).unwrap()
        }
      } else {
        const result = await dispatch(createDar(darData)).unwrap()
        if (submit) {
          await dispatch(submitDar(result.id)).unwrap()
        }
      }

      navigate('/dar/list')
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || 'Form validation failed'
      console.error('DAR save failed:', error)
      message.error(errMsg)
    }
  }

  const statusOptions = ['Completed', 'In Progress', 'Blocked']

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{isEdit ? 'Edit DAR' : 'Create DAR'}</h1>
          <p className="page-description">
            {isEdit ? 'Update your daily activity report' : 'Create a new daily activity report'}
          </p>
        </div>

        <Card className="card-container">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              date: dayjs(),
              activities: [
                {
                  taskTitle: '',
                  description: '',
                  hoursSpent: 0,
                  status: 'In Progress',
                },
              ],
            }}
          >
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              label="Project"
              name="project"
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select placeholder="Select Project" loading={loading}>
                {projects.map((project) => (
                  <Option key={project.id} value={project.name}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.List name="activities">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      title={`Activity ${name + 1}`}
                      style={{ marginBottom: 16 }}
                      extra={
                        fields.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => {
                              remove(name)
                              const activities = form.getFieldValue('activities') || []
                              const updated = activities.filter((_, i) => i !== name)
                              calculateTotalHours(updated)
                            }}
                          >
                            Remove
                          </Button>
                        ) : null
                      }
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Form.Item
                          {...restField}
                          name={[name, 'taskTitle']}
                          label="Task Title"
                          rules={[{ required: true, message: 'Please enter task title' }]}
                        >
                          <Input placeholder="Enter task title" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Description"
                          rules={[{ required: true, message: 'Please enter description' }]}
                        >
                          <TextArea rows={3} placeholder="Enter task description" />
                        </Form.Item>

                        <Space wrap>
                          <Form.Item
                            {...restField}
                            name={[name, 'status']}
                            label="Status"
                            rules={[{ required: true, message: 'Please select status' }]}
                            style={{ width: 200 }}
                          >
                            <Select placeholder="Select status">
                              {statusOptions.map((stat) => (
                                <Option key={stat} value={stat}>
                                  {stat}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Space>

                        <Space wrap>
                          <Form.Item
                            {...restField}
                            name={[name, 'startTime']}
                            label="Start Time"
                            style={{ width: 150 }}
                          >
                            <TimePicker
                              format="h:mm a"
                              use12Hours
                              onChange={(time) => handleActivityTimeChange(name, 'startTime', time)}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'endTime']}
                            label="End Time"
                            style={{ width: 150 }}
                          >
                            <TimePicker
                              format="h:mm a"
                              use12Hours
                              onChange={(time) => handleActivityTimeChange(name, 'endTime', time)}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'hoursSpent']}
                            label="Hours Spent (auto-calculated)"
                            rules={[
                              {
                                required: true,
                                message: 'Hours will be calculated from start and end time',
                              },
                            ]}
                            style={{ width: 150 }}
                          >
                            <InputNumber
                              min={0}
                              step={0.5}
                              precision={1}
                              placeholder="Calculated"
                              readOnly
                              style={{ width: '100%', pointerEvents: 'none', backgroundColor: '#fafafa' }}
                            />
                          </Form.Item>
                        </Space>

                        <Form.Item
                          {...restField}
                          name={[name, 'blockers']}
                          label="Blockers (Optional)"
                        >
                          <TextArea rows={2} placeholder="Describe any blockers or issues" />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginBottom: 16 }}
                  >
                    Add Activity
                  </Button>
                </>
              )}
            </Form.List>

            <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
              <strong>Total Hours: {totalHours.toFixed(1)} hrs</strong>
            </div>

            <Form.Item name="remarks" label="Remarks">
              <TextArea rows={4} placeholder="Enter any additional remarks" />
            </Form.Item>

            <Form.Item>
              <FormButtonGroup align="end">
                <ActionButton
                  type="default"
                  icon={<SaveOutlined />}
                  onClick={() => handleSave(false)}
                  loading={loading}
                >
                  Save as Draft
                </ActionButton>
                <ActionButton
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSave(true)}
                  loading={loading}
                >
                  Submit DAR
                </ActionButton>
                <ActionButton onClick={() => navigate('/dar/list')}>
                  Cancel
                </ActionButton>
              </FormButtonGroup>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DarForm
