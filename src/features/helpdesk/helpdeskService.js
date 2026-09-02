import api from '../../services/api'

const helpdeskService = {
  // Helpdesk tickets are not persisted anywhere yet, so both lists resolve
  // empty instead of showing sample tickets.
  getTickets: async () => [],

  getClosedTickets: async () => [],

  createTicket: async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          ticketNo: `HD-${String(Date.now()).slice(-6)}`,
          ...data,
          status: 'Open',
          createdDate: new Date().toISOString().split('T')[0],
        })
      }, 500)
    })
  },

  updateTicket: async (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Ticket updated successfully' })
      }, 300)
    })
  },
}

export default helpdeskService
