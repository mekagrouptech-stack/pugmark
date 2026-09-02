import React, { useState } from 'react'
import { Form, Input, Select, DatePicker, InputNumber, Space, Button } from 'antd'
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const EditableField = ({
  label,
  value,
  fieldType = 'text',
  fieldName,
  groupName,
  onSave,
  options = [],
  placeholder = '',
  disabled = false,
  rows = 4,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [form] = Form.useForm()
  const [tempValue, setTempValue] = useState(value)

  const handleEdit = () => {
    if (disabled) return
    setTempValue(value)
    setIsEditing(true)
    form.setFieldsValue({
      [fieldName]:
        fieldType === 'date' && value
          ? dayjs(value)
          : fieldType === 'year' && value
            ? dayjs(String(value), 'YYYY')
            : value,
    })
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const fieldValue = values[fieldName]
      const finalValue =
        fieldType === 'date'
          ? fieldValue
            ? fieldValue.format('YYYY-MM-DD')
            : null
          : fieldType === 'year'
            ? fieldValue
              ? fieldValue.format('YYYY')
              : null
            : fieldValue
      await onSave(groupName, fieldName, finalValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setIsEditing(false)
    setTempValue(value)
  }

  const getDisplayValue = () => {
    if (!value) return 'NA'
    if (fieldType === 'select' && options?.length) {
      const opt = options.find((o) => o.value === value)
      return opt ? opt.label : value
    }
    return value
  }

  const renderField = () => {
    if (!isEditing) {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <span style={{ color: value ? '#000' : '#8c8c8c', flex: 1 }}>
            {getDisplayValue()}
          </span>
          {!disabled && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </div>
      )
    }

    return (
      <Form form={form} layout="vertical" style={{ width: '100%' }}>
        <Form.Item
          name={fieldName}
          rules={fieldType === 'email' ? [{ type: 'email', message: 'Please enter a valid email!' }] : []}
          style={{ marginBottom: 0 }}
        >
          {fieldType === 'text' && (
            <Input
              placeholder={placeholder}
              autoFocus
              onPressEnter={handleSave}
            />
          )}
          {fieldType === 'textarea' && (
            <TextArea
              rows={rows}
              placeholder={placeholder}
              autoFocus
            />
          )}
          {fieldType === 'number' && (
            <InputNumber
              placeholder={placeholder}
              style={{ width: '100%' }}
              autoFocus
            />
          )}
          {fieldType === 'email' && (
            <Input
              type="email"
              placeholder={placeholder}
              autoFocus
            />
          )}
          {fieldType === 'select' && (
            <Select placeholder={placeholder} autoFocus>
              {options.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          )}
          {fieldType === 'date' && (
            <DatePicker
              style={{ width: '100%' }}
              placeholder={placeholder}
              format="DD/MM/YYYY"
            />
          )}
          {fieldType === 'year' && (
            <DatePicker
              picker="year"
              style={{ width: '100%' }}
              placeholder={placeholder}
              format="YYYY"
            />
          )}
        </Form.Item>
        <Space style={{ marginTop: 8 }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleSave}
            size="small"
          >
            Save
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancel}
            size="small"
          >
            Cancel
          </Button>
        </Space>
      </Form>
    )
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 4, fontWeight: 500, color: '#595959' }}>
        {label}
      </div>
      {renderField()}
    </div>
  )
}

export default EditableField
