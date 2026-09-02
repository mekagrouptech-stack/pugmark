import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Typography,
  Select,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'
import AttendanceMap from '../../components/map/AttendanceMap'
import { fetchOffices, createOffice, updateOffice, deleteOffice } from '../../features/office/officeSlice'
import { formatDistance } from '../../utils/locationUtils'

const { Title, Text } = Typography
const { TextArea } = Input

const OfficeManagement = () => {
  const dispatch = useDispatch()
  const { offices, loading } = useSelector((state) => state.office)
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingOffice, setEditingOffice] = useState(null)
  const [mapLocation, setMapLocation] = useState(null)
  const [selectedOfficeForMap, setSelectedOfficeForMap] = useState(null)

  useEffect(() => {
    dispatch(fetchOffices())
  }, [dispatch])

  const handleAdd = () => {
    setEditingOffice(null)
    form.resetFields()
    setMapLocation(null)
    setModalVisible(true)
  }

  const handleEdit = (office) => {
    setEditingOffice(office)
    form.setFieldsValue({
      name: office.name,
      country: office.country,
      address: office.address,
      latitude: office.latitude,
      longitude: office.longitude,
      radius: office.radius,
      isActive: office.isActive,
      strictGeofencing: office.strictGeofencing,
    })
    setMapLocation({ latitude: office.latitude, longitude: office.longitude })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteOffice(id)).unwrap()
      message.success('Office deleted successfully')
    } catch (error) {
      message.error('Failed to delete office')
    }
  }

  const handleSubmit = async (values) => {
    try {
      const officeData = {
        ...values,
        latitude: mapLocation?.latitude || values.latitude,
        longitude: mapLocation?.longitude || values.longitude,
      }

      if (editingOffice) {
        await dispatch(updateOffice({ id: editingOffice.id, officeData })).unwrap()
        message.success('Office updated successfully')
      } else {
        await dispatch(createOffice(officeData)).unwrap()
        message.success('Office created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      setMapLocation(null)
      setEditingOffice(null)
    } catch (error) {
      message.error('Failed to save office')
    }
  }

  const handleMapClick = (e) => {
    if (e.latlng) {
      setMapLocation({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      })
      form.setFieldsValue({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      })
    }
  }

  const columns = [
    {
      title: 'Office Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.country}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
        </Text>
      ),
    },
    {
      title: 'Radius',
      dataIndex: 'radius',
      key: 'radius',
      render: (radius) => <Tag color="blue">{formatDistance(radius)}</Tag>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
          <Tag color={record.strictGeofencing ? 'red' : 'green'}>
            {record.strictGeofencing ? 'Strict' : 'Flexible'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => setSelectedOfficeForMap(record)}
            size="small"
          >
            View Map
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this office?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <Title level={2}>Office Management</Title>
          <Text type="secondary">Manage office locations and geofencing settings</Text>
        </div>

        <Card
          className="card-container"
          title={
            <Space>
              <EnvironmentOutlined />
              <span>Offices</span>
            </Space>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Office
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={offices}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <div style={{ color: '#8c8c8c' }}>No offices found</div>
                </div>
              ),
            }}
          />
        </Card>

        {/* Office Form Modal */}
        <Modal
          title={editingOffice ? 'Edit Office' : 'Add New Office'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
            setMapLocation(null)
            setEditingOffice(null)
          }}
          footer={null}
          width={900}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Office Name"
                  rules={[{ required: true, message: 'Please enter office name' }]}
                >
                  <Input placeholder="e.g., Mumbai Office" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="country"
                  label="Country"
                  rules={[{ required: true, message: 'Please select country' }]}
                >
                  <Select placeholder="Select country">
                    <Select.Option value="India">India</Select.Option>
                    <Select.Option value="UAE">UAE</Select.Option>
                    <Select.Option value="USA">USA</Select.Option>
                    <Select.Option value="UK">UK</Select.Option>
                    <Select.Option value="Singapore">Singapore</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: 'Please enter address' }]}
            >
              <TextArea rows={2} placeholder="Enter full address" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="latitude"
                  label="Latitude"
                  rules={[
                    { required: true, message: 'Please enter latitude' },
                    { type: 'number', min: -90, max: 90, message: 'Latitude must be between -90 and 90' },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="e.g., 19.1136"
                    step={0.000001}
                    precision={6}
                    onChange={(value) => {
                      if (value) {
                        setMapLocation((prev) => ({ ...prev, latitude: value }))
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="longitude"
                  label="Longitude"
                  rules={[
                    { required: true, message: 'Please enter longitude' },
                    { type: 'number', min: -180, max: 180, message: 'Longitude must be between -180 and 180' },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="e.g., 72.8697"
                    step={0.000001}
                    precision={6}
                    onChange={(value) => {
                      if (value) {
                        setMapLocation((prev) => ({ ...prev, longitude: value }))
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="radius"
              label="Allowed Radius (meters)"
              rules={[{ required: true, message: 'Please enter radius' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="e.g., 100"
                min={10}
                max={10000}
                addonAfter="meters"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="isActive" valuePropName="checked" initialValue={true}>
                  <Space>
                    <Switch />
                    <Text>Active</Text>
                  </Space>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="strictGeofencing" valuePropName="checked" initialValue={true}>
                  <Space>
                    <Switch />
                    <Text>Strict Geofencing</Text>
                  </Space>
                </Form.Item>
              </Col>
            </Row>

            {/* Map for selecting location */}
            <Form.Item label="Select Location on Map">
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Click on the map to set the office location, or enter coordinates manually above
                </Text>
              </div>
              <AttendanceMap
                userLocation={mapLocation}
                officeLocation={mapLocation ? { ...mapLocation, name: form.getFieldValue('name') || 'Office' } : null}
                radius={form.getFieldValue('radius') || 100}
                height={300}
                showGeofence={true}
                showDistance={false}
                onLocationChange={handleMapClick}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingOffice ? 'Update' : 'Create'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Office Map Modal */}
        <Modal
          title={`${selectedOfficeForMap?.name} - Location Map`}
          open={!!selectedOfficeForMap}
          onCancel={() => setSelectedOfficeForMap(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedOfficeForMap(null)}>
              Close
            </Button>,
          ]}
          width={800}
        >
          {selectedOfficeForMap && (
            <AttendanceMap
              officeLocation={selectedOfficeForMap}
              radius={selectedOfficeForMap.radius}
              height={400}
              showGeofence={true}
              showDistance={false}
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default OfficeManagement
