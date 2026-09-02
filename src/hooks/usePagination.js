import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for managing pagination state
 * Handles page, pageSize, and resets on filter/search changes
 */
const usePagination = (initialPage = 1, initialPageSize = 10, resetDeps = []) => {
  const [pagination, setPagination] = useState({
    current: initialPage,
    pageSize: initialPageSize,
    total: 0,
  })

  // Reset to page 1 when dependencies change (filters, search, etc.)
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }))
  }, resetDeps)

  const handleTableChange = useCallback((paginationConfig) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: paginationConfig.total || pagination.total,
    })
  }, [pagination.total])

  const setTotal = useCallback((total) => {
    setPagination((prev) => ({
      ...prev,
      total,
    }))
  }, [])

  const reset = useCallback(() => {
    setPagination({
      current: 1,
      pageSize: initialPageSize,
      total: 0,
    })
  }, [initialPageSize])

  return {
    pagination,
    handleTableChange,
    setTotal,
    reset,
  }
}

export default usePagination
