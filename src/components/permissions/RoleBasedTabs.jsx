import React from 'react'
import { Tabs } from 'antd'
import { useSelector } from 'react-redux'
import { filterByPermission } from '../../utils/permissionUtils'

/**
 * Role-based Tabs component that filters tabs based on permissions
 */
const RoleBasedTabs = ({ 
  items = [], 
  permissionKey = 'permission',
  ...tabProps 
}) => {
  const { user } = useSelector((state) => state.auth)
  const permissions = useSelector((state) => state.permission.permissions)

  if (!user || !items.length) {
    return <Tabs items={items} {...tabProps} />
  }

  const filteredItems = filterByPermission(
    items,
    user.role,
    permissions,
    permissionKey
  )

  return <Tabs items={filteredItems} {...tabProps} />
}

export default RoleBasedTabs
