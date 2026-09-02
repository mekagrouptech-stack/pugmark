import api from '../../services/api'

const attendanceService = {
  /**
   * Get attendance records
   * @param {Object} params - { startDate, endDate, officeId }
   * @returns {Promise<Array>} Attendance records
   */
  getAttendance: async (params = {}) => {
    try {
      const response = await api.get('/attendance/records', { params })
      return response.data.data || []
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch attendance records'
      throw new Error(errorMessage)
    }
  },

  /**
   * Punch In with location
   * @param {Object} punchData - { officeId, latitude, longitude, remark?, accuracy?, targetUserId? }
   * @returns {Promise<Object>} Punch result
   */
  punchIn: async (punchData) => {
    try {
      const payload = {
        latitude: punchData.latitude,
        longitude: punchData.longitude,
        punchType: 'IN',
        remark: punchData.remark || null,
        accuracy: punchData.accuracy || null,
      }
      if (punchData.officeId) payload.officeId = punchData.officeId
      if (punchData.targetUserId) payload.targetUserId = punchData.targetUserId
      const response = await api.post('/attendance/punch', payload)

      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to punch in'
      throw new Error(errorMessage)
    }
  },

  /**
   * Punch Out with location
   * @param {Object} punchData - { officeId, latitude, longitude, remark?, accuracy?, targetUserId? }
   * @returns {Promise<Object>} Punch result
   */
  punchOut: async (punchData) => {
    try {
      const payload = {
        latitude: punchData.latitude,
        longitude: punchData.longitude,
        punchType: 'OUT',
        remark: punchData.remark || null,
        accuracy: punchData.accuracy || null,
      }
      if (punchData.officeId) payload.officeId = punchData.officeId
      if (punchData.targetUserId) payload.targetUserId = punchData.targetUserId
      const response = await api.post('/attendance/punch', payload)

      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to punch out'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get attendance record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object>} Attendance record
   */
  getAttendanceRecordById: async (id) => {
    try {
      const response = await api.get(`/attendance/records/${id}`)
      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch attendance record'
      throw new Error(errorMessage)
    }
  },
}

export default attendanceService
