import React from 'react'

/**
 * Standard pagination configuration for tables
 * Ensures consistency across all tables
 */
export const getTablePagination = (pagination, options = {}) => {
  const {
    current = 1,
    pageSize = 10,
    total = 0,
    showSizeChanger = true,
    showTotal = true,
    pageSizeOptions = ['10', '20', '50', '100'],
    ...customOptions
  } = pagination || {}

  return {
    current,
    pageSize,
    total,
    showSizeChanger,
    showQuickJumper: true,
    showTotal: showTotal
      ? (total, range) => `${range[0]}-${range[1]} of ${total} items`
      : false,
    pageSizeOptions,
    size: 'default',
    ...customOptions,
    ...options,
  }
}

export default getTablePagination
