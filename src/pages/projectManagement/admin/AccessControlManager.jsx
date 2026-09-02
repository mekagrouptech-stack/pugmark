import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Switch,
  Button,
  Space,
  Select,
  message,
  Row,
  Col,
  Tag,
  Typography,
  Divider,
  Statistic,
  List,
  Avatar,
  Badge,
} from 'antd'
import {
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchPermissions,
  updateRolePermission,
  resetRolePermissions,
  selectPermissions,
} from '../../../features/permissions/permissionSlice'
import { PERMISSION_KEYS, PERMISSION_LABELS } from '../../../features/permissions/permissionService'
import DashboardLayout from '../../../layouts/DashboardLayout'

const { Title, Text } = Typography

const AccessControlManager = () => {
  const dispatch = useDispatch()
  const permissions = useSelector(selectPermissions)
  const { loading } = useSelector((state) => state.permission)
  const [selectedRole, setSelectedRole] = useState('admin')
  const [localPermissions, setLocalPermissions] = useState({})

  useEffect(() => {
    dispatch(fetchPermissions())
  }, [dispatch])

  useEffect(() => {
    setLocalPermissions(permissions)
  }, [permissions])

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'head_hr', label: 'Head HR' },
    { value: 'hr', label: 'HR' },
    { value: 'hod', label: 'HOD' },
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
  ]

  const allPermissions = Object.values(PERMISSION_KEYS)

  const handleToggle = async (permission, enabled) => {
    try {
      await dispatch(
        updateRolePermission({
          role: selectedRole,
          permission,
          enabled,
        })
      ).unwrap()
      // Update local state immediately for better UX
      setLocalPermissions((prev) => ({
        ...prev,
        [selectedRole]: enabled
          ? [...(prev[selectedRole] || []), permission]
          : (prev[selectedRole] || []).filter((p) => p !== permission),
      }))
    } catch (error) {
      message.error('Failed to update permission')
    }
  }

  const handleReset = async () => {
    try {
      await dispatch(resetRolePermissions(selectedRole)).unwrap()
      dispatch(fetchPermissions())
    } catch (error) {
      message.error('Failed to reset permissions')
    }
  }

  const columns = [
    {
      title: 'Permission',
      dataIndex: 'permission',
      key: 'permission',
      render: (permission) => (
        <div>
          <Text strong>{PERMISSION_LABELS[permission] || permission}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {permission}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const hasAccess = (localPermissions[selectedRole] || []).includes(record.permission)
        return (
          <Tag color={hasAccess ? 'green' : 'default'}>
            {hasAccess ? 'Enabled' : 'Disabled'}
          </Tag>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const hasAccess = (localPermissions[selectedRole] || []).includes(record.permission)
        return (
          <Switch
            checked={hasAccess}
            onChange={(checked) => handleToggle(record.permission, checked)}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        )
      },
    },
  ]

  const rolePermissions = localPermissions[selectedRole] || []
  const enabledCount = rolePermissions.length
  const totalCount = allPermissions.length
  const disabledCount = totalCount - enabledCount

  // Calculate permission counts for each role
  const getRoleStats = (roleValue) => {
    const rolePerms = localPermissions[roleValue] || []
    return {
      enabled: rolePerms.length,
      total: allPermissions.length,
      percentage: Math.round((rolePerms.length / allPermissions.length) * 100),
    }
  }

  const selectedRoleInfo = roles.find((r) => r.value === selectedRole)
  const selectedRoleStats = getRoleStats(selectedRole)

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Title level={2} style={{ margin: 0 }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            Access Control Manager
          </Title>
          <Text type="secondary">
            Configure tab and menu visibility for each role
          </Text>
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {/* PART 1: LEFT PANEL - Role Selector */}
          <Col xs={24} lg={6}>
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  <Text strong>Select Role</Text>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <List
                dataSource={roles}
                renderItem={(role) => {
                  const stats = getRoleStats(role.value)
                  const isSelected = selectedRole === role.value
                  return (
                    <List.Item
                      style={{
                        cursor: 'pointer',
                        padding: '12px 16px',
                        borderRadius: 6,
                        marginBottom: 8,
                        backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        transition: 'all 0.3s',
                      }}
                      onClick={() => setSelectedRole(role.value)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: isSelected ? '#1890ff' : '#d9d9d9',
                            }}
                            icon={<UserOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text strong={isSelected}>{role.label}</Text>
                            {isSelected && <Badge status="processing" />}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {stats.enabled} / {stats.total} permissions
                            </Text>
                            <div style={{ width: '100%', marginTop: 4 }}>
                              <div
                                style={{
                                  height: 4,
                                  backgroundColor: '#f0f0f0',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${stats.percentage}%`,
                                    height: '100%',
                                    backgroundColor: isSelected ? '#1890ff' : '#52c41a',
                                    transition: 'width 0.3s',
                                  }}
                                />
                              </div>
                            </div>
                          </Space>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            </Card>
          </Col>

          {/* PART 2: MIDDLE PANEL - Permissions Table */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <Text strong>
                    Permissions for {selectedRoleInfo?.label}
                  </Text>
                  <Tag color="blue">
                    {enabledCount} / {totalCount} Enabled
                  </Tag>
                </Space>
              }
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  danger
                  size="small"
                >
                  Reset to Default
                </Button>
              }
              loading={loading}
              style={{ height: '100%' }}
            >
              <Table
                columns={columns}
                dataSource={allPermissions.map((p) => ({ permission: p, key: p }))}
                pagination={false}
                size="middle"
                rowKey="permission"
                scroll={{ y: 500 }}
              />
            </Card>
          </Col>

          {/* PART 3: RIGHT PANEL - Summary & Statistics */}
          <Col xs={24} lg={6}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Statistics Card */}
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined />
                    <Text strong>Statistics</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Statistic
                    title="Enabled Permissions"
                    value={enabledCount}
                    suffix={`/ ${totalCount}`}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <Statistic
                    title="Disabled Permissions"
                    value={disabledCount}
                    suffix={`/ ${totalCount}`}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CloseCircleOutlined />}
                  />
                  <Divider style={{ margin: '12px 0' }} />
                  <Statistic
                    title="Access Level"
                    value={selectedRoleStats.percentage}
                    suffix="%"
                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                  />
                </Space>
              </Card>

              {/* Quick Actions Card */}
              <Card
                title={
                  <Space>
                    <SettingOutlined />
                    <Text strong>Quick Actions</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Button
                    type="primary"
                    block
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                    danger
                  >
                    Reset {selectedRoleInfo?.label} Permissions
                  </Button>
                  <Button
                    block
                    onClick={() => {
                      const allEnabled = allPermissions.every((p) =>
                        rolePermissions.includes(p)
                      )
                      if (allEnabled) {
                        // Disable all
                        allPermissions.forEach((p) => {
                          if (rolePermissions.includes(p)) {
                            handleToggle(p, false)
                          }
                        })
                      } else {
                        // Enable all
                        allPermissions.forEach((p) => {
                          if (!rolePermissions.includes(p)) {
                            handleToggle(p, true)
                          }
                        })
                      }
                    }}
                  >
                    {enabledCount === totalCount ? 'Disable All' : 'Enable All'}
                  </Button>
                </Space>
              </Card>

              {/* Instructions Card */}
              <Card
                title={
                  <Space>
                    <Text strong>Instructions</Text>
                  </Space>
                }
                size="small"
                style={{ background: '#fafafa' }}
              >
                <List
                  size="small"
                  dataSource={[
                    'Toggle switches to enable/disable permissions',
                    'Changes save automatically',
                    'Use Reset to restore defaults',
                    'Admin always has access to this page',
                  ]}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0', border: 'none' }}>
                      <Text style={{ fontSize: '12px' }}>• {item}</Text>
                    </List.Item>
                  )}
                />
              </Card>

              {/* Enabled Permissions List */}
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text strong>Enabled ({enabledCount})</Text>
                  </Space>
                }
                size="small"
              >
                <List
                  size="small"
                  dataSource={rolePermissions.slice(0, 5)}
                  renderItem={(permission) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>
                        {PERMISSION_LABELS[permission] || permission}
                      </Tag>
                    </List.Item>
                  )}
                />
                {enabledCount > 5 && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    +{enabledCount - 5} more...
                  </Text>
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default AccessControlManager
