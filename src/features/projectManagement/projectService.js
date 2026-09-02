const projectService = {
  // Project management has no backend yet. Both reads resolve to nothing so the
  // dashboards render their empty states instead of a fictional project book.
  getProjects: async () => [],

  getProjectById: async (id) => {
    throw new Error('Project not found')
  },

  createProject: async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          ...data,
          createdAt: new Date().toISOString(),
        })
      }, 500)
    })
  },

  updateProject: async (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: parseInt(id),
          ...data,
          updatedAt: new Date().toISOString(),
        })
      }, 500)
    })
  },

  approveProject: async (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = {
          id: parseInt(id),
          ...data,
          updatedAt: new Date().toISOString(),
        }
        resolve(project)
      }, 500)
    })
  },
}

export default projectService
