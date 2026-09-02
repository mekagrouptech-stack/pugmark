import api from '../../services/api'

const biometricService = {
  /**
   * Get biometric (eSSL device) punch logs for a day
   * @param {Object} params - { date: 'YYYY-MM-DD', pin?: string }
   * @returns {Promise<Array>} Punch logs joined to employees
   */
  getDeviceLogs: async (params = {}) => {
    try {
      const response = await api.get('/attendance', { params })
      return response.data.data || []
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch biometric attendance logs'
      throw new Error(errorMessage)
    }
  },
}

export default biometricService
