import React, { useState } from 'react'
import { Card, Button, Row, Col, Space, Modal, Form, message, Input, Select, DatePicker, InputNumber, Tag, Tooltip } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { updateGroup } from '../../features/profile/profileSlice'
import { completionColor } from '../../utils/profileCompletion'
import EditableField from './EditableField'
import DocumentUploader from './DocumentUploader'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const ProfileGroupCard = ({
  title,
  groupName,
  fields,
  profileData,
  onFieldUpdate,
  fieldConfigs,
  canEdit = true,
  completion,
}) => {
  const dispatch = useDispatch()
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [form] = Form.useForm()

  const handleGroupEdit = () => {
    setIsEditingGroup(true)
    const groupData = profileData[groupName] || {}
    const formattedData = {}
    Object.keys(groupData).forEach((key) => {
      const config = fieldConfigs[key]
      if (config) {
        if (config.type === 'date' && groupData[key]) {
          formattedData[key] = dayjs(groupData[key])
        } else if (config.type === 'year' && groupData[key]) {
          formattedData[key] = dayjs(String(groupData[key]), 'YYYY')
        } else if (key === 'companyId') {
          // Use companyId for the form value
          formattedData[key] = groupData.companyId || null
        } else {
          formattedData[key] = groupData[key]
        }
      } else {
        formattedData[key] = groupData[key]
      }
    })
    form.setFieldsValue(formattedData)
  }

  const handleGroupSave = async () => {
    try {
      const values = await form.validateFields()
      const formattedValues = {}
      Object.keys(values).forEach((key) => {
        const config = fieldConfigs[key]
        if (config) {
          if (config.type === 'date' && values[key]) {
            formattedValues[key] = values[key].format('YYYY-MM-DD')
          } else if (config.type === 'year' && values[key]) {
            formattedValues[key] = values[key].format('YYYY')
          } else {
            formattedValues[key] = values[key]
          }
        } else {
          formattedValues[key] = values[key]
        }
      })
      await dispatch(updateGroup({ group: groupName, data: formattedValues })).unwrap()
      message.success('Group updated successfully!')
      setIsEditingGroup(false)
    } catch (error) {
      message.error('Failed to update group')
    }
  }

  const handleGroupCancel = () => {
    setIsEditingGroup(false)
    form.resetFields()
  }

  const renderField = (fieldKey, fieldConfig) => {
    const value = profileData[groupName]?.[fieldKey]
    const config = fieldConfigs[fieldKey] || fieldConfig

    if (config.type === 'document' || config.type === 'documentMultiple') {
      return (
        <DocumentUploader
          key={fieldKey}
          label={config.label}
          fieldName={fieldKey}
          groupName={groupName}
          value={value}
          multiple={config.type === 'documentMultiple'}
          accept={config.accept}
        />
      )
    }

    // For companyId field, display company name if available, otherwise use companyId
    let displayValue = value
    if (fieldKey === 'companyId') {
      displayValue = profileData?.employmentInformation?.company || value || null
    }

    return (
      <EditableField
        key={fieldKey}
        label={config.label}
        value={displayValue}
        fieldType={config.type}
        fieldName={fieldKey}
        groupName={groupName}
        onSave={onFieldUpdate}
        options={config.options}
        placeholder={config.placeholder}
        disabled={config.disabled}
        rows={config.rows}
      />
    )
  }

  return (
    <Card
      title={
        completion ? (
          <Space size={8}>
            <span>{title}</span>
            <Tooltip
              title={`${completion.filled} of ${completion.total} details added in this section`}
            >
              <Tag
                color={completionColor(completion.percent)}
                style={{ marginInlineEnd: 0, borderRadius: 10, fontWeight: 600 }}
              >
                {completion.percent}%
              </Tag>
            </Tooltip>
          </Space>
        ) : (
          title
        )
      }
      extra={
        canEdit ? (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleGroupEdit}
              size="small"
            >
              Edit Group
            </Button>
          </Space>
        ) : null
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[24, 0]}>
        {fields.map((fieldKey) => {
          const fieldConfig = fieldConfigs[fieldKey]
          if (!fieldConfig) return null

          const colSpan = fieldConfig.colSpan || 12
          return (
            <Col xs={24} sm={24} md={colSpan} key={fieldKey}>
              {renderField(fieldKey, fieldConfig)}
            </Col>
          )
        })}
      </Row>

      <Modal
        title={`Edit ${title}`}
        open={isEditingGroup}
        onOk={handleGroupSave}
        onCancel={handleGroupCancel}
        width={800}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          {fields.map((fieldKey) => {
            const config = fieldConfigs[fieldKey]
            if (!config || config.type === 'document' || config.type === 'documentMultiple') {
              return null
            }

            return (
              <Form.Item
                key={fieldKey}
                name={fieldKey}
                label={config.label}
                rules={config.rules || []}
              >
                {config.type === 'text' && (
                  <Input placeholder={config.placeholder} disabled={config.disabled} />
                )}
                {config.type === 'textarea' && (
                  <TextArea
                    rows={config.rows || 4}
                    placeholder={config.placeholder}
                    disabled={config.disabled}
                  />
                )}
                {config.type === 'number' && (
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={config.placeholder}
                    disabled={config.disabled}
                  />
                )}
                {config.type === 'email' && (
                  <Input type="email" placeholder={config.placeholder} disabled={config.disabled} />
                )}
                {config.type === 'select' && (
                  <Select placeholder={config.placeholder} disabled={config.disabled}>
                    {config.options?.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                )}
                {config.type === 'date' && (
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    disabled={config.disabled}
                  />
                )}
                {config.type === 'year' && (
                  <DatePicker
                    picker="year"
                    style={{ width: '100%' }}
                    format="YYYY"
                    disabled={config.disabled}
                  />
                )}
              </Form.Item>
            )
          })}
        </Form>
      </Modal>
    </Card>
  )
}

export default ProfileGroupCard
