import api from '../../services/api'

const officeService = {
  /**
   * Get all offices
   * @returns {Promise<Array>} List of offices
   */
  getOffices: async () => {
    try {
      const response = await api.get('/offices')
      return response.data.data || []
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch offices'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get office by ID
   * @param {number} id - Office ID
   * @returns {Promise<Object>} Office details
   */
  getOfficeById: async (id) => {
    try {
      const response = await api.get(`/offices/${id}/location`)
      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch office'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get office location for map (optimized)
   * @param {number} id - Office ID
   * @returns {Promise<Object>} Office location data
   */
  getOfficeLocationForMap: async (id) => {
    try {
      const response = await api.get(`/offices/${id}/location`)
      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch office location'
      throw new Error(errorMessage)
    }
  },

  /**
   * Create office (Admin only)
   * @param {Object} officeData - Office data
   * @returns {Promise<Object>} Created office
   */
  createOffice: async (officeData) => {
    try {
      // Note: This endpoint needs to be added to backend
      // For now, using a placeholder
      const response = await api.post('/offices', officeData)
      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to create office'
      throw new Error(errorMessage)
    }
  },

  /**
   * Update office (Admin only)
   * @param {number} id - Office ID
   * @param {Object} officeData - Office data
   * @returns {Promise<Object>} Updated office
   */
  updateOffice: async (id, officeData) => {
    try {
      // Note: This endpoint needs to be added to backend
      const response = await api.put(`/offices/${id}`, officeData)
      return response.data.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to update office'
      throw new Error(errorMessage)
    }
  },

  /**
   * Delete office (Admin only)
   * @param {number} id - Office ID
   * @returns {Promise<Object>} Success status
   */
  deleteOffice: async (id) => {
    try {
      // Note: This endpoint needs to be added to backend
      const response = await api.delete(`/offices/${id}`)
      return response.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to delete office'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get user's assigned offices
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of office IDs
   */
  getUserOffices: async (userId) => {
    try {
      const response = await api.get(`/offices/user/${userId}`)
      return response.data.data || []
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch user offices'
      throw new Error(errorMessage)
    }
  },

  /**
   * Check if user has access to office
   * @param {number} officeId - Office ID
   * @returns {Promise<boolean>} True if user has access
   */
  checkOfficeAccess: async (officeId) => {
    try {
      const response = await api.get(`/offices/${officeId}/access`)
      return response.data.data?.hasAccess || false
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to check office access'
      throw new Error(errorMessage)
    }
  },
}

export default officeService
