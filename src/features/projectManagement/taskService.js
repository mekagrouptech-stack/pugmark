const taskService = {
  // No task backend yet — resolve empty rather than seeding a sample board.
  getTasks: async () => [],

  getTaskById: async (id) => {
    throw new Error('Task not found')
  },

  createTask: async (data) => {
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

  updateTask: async (id, data) => {
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

  updateTaskStatus: async (id, data) => {
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
}

export default taskService
