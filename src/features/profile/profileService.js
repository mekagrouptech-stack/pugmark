import api from '../../services/api'
import { API_BASE_URL } from '../../utils/constants'

const profileService = {
  getProfile: async () => {
    try {
      const response = await api.get('/profile')
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile')
    }
  },

  updateField: async (group, field, value) => {
    try {
      const response = await api.patch('/profile/field', { group, field, value })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update field')
    }
  },

  updateGroup: async (group, data) => {
    try {
      const response = await api.put('/profile/group', { group, data })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update group')
    }
  },

  uploadDocument: async (field, file) => {
    try {
      // Real multipart upload to the backend, which stores the file under
      // /storage and returns its persistent URL. Avatars go to the dedicated
      // avatar endpoint (multer field 'avatar'); everything else to documents.
      const token = localStorage.getItem('hrms_token')
      const isAvatar = field === 'avatar'
      const endpoint = isAvatar ? '/profile/upload/avatar' : '/profile/upload/document'

      const formData = new FormData()
      formData.append(isAvatar ? 'avatar' : 'document', file)
      if (!isAvatar) formData.append('field', field)

      // Do NOT set Content-Type — the browser adds the multipart boundary.
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json().catch(() => ({}))

      if (data.success && data.data?.url) {
        return { field, url: data.data.url }
      }
      throw new Error(data.message || 'Failed to upload')
    } catch (error) {
      throw new Error(error.message || 'Failed to upload document')
    }
  },
}

export default profileService
