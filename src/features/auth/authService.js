import api from '../../services/api'
import { STORAGE_KEYS } from '../../utils/constants'

const authService = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { token, user }
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { data } = response.data

      // Normalize user role to match frontend expectations
      const normalizedUser = {
        ...data.user,
        role: data.user.role.toUpperCase(), // Convert to uppercase for consistency
      }

      return {
        token: data.token,
        user: normalizedUser,
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed. Please try again.'
      throw new Error(errorMessage)
    }
  },

  /**
   * Ask the server to email a one-time login code.
   * @param {string} email
   * @returns {Promise<Object>} { emailFound, message, resendInSeconds, devOtp? }
   */
  requestOtp: async (email) => {
    try {
      const response = await api.post('/auth/request-otp', { email })
      return response.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Could not send the login code.'
      throw new Error(errorMessage)
    }
  },

  /**
   * Exchange a one-time code for a session.
   * @param {Object} payload - { email, otp }
   * @returns {Promise<Object>} { token, user }
   */
  verifyOtp: async ({ email, otp }) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp })
      const { data } = response.data

      const normalizedUser = {
        ...data.user,
        role: data.user.role.toUpperCase(),
      }

      return {
        token: data.token,
        user: normalizedUser,
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed. Please try again.'
      throw new Error(errorMessage)
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      const { data } = response.data

      // Normalize user role
      const normalizedUser = {
        ...data,
        role: data.role?.toUpperCase() || data.role,
      }

      return normalizedUser
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch user profile'
      throw new Error(errorMessage)
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    // Redirect handled by component
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN)
  },
}

export default authService
