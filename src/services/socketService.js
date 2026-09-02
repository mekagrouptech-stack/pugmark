/**
 * Socket.IO Service
 * Manages real-time chat connections
 */
class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.currentRoom = null
    this.listeners = new Map()
    // In-flight connect(), so the concurrent callers (NotificationBell mounts
    // with the layout, Chat mounts with its route) share one socket instead of
    // racing through the dynamic import and opening two.
    this.connecting = null
    // Bumped by disconnect(). Loading socket.io on demand puts an await before
    // the socket exists, so a disconnect() in that window would find
    // `this.socket` still null and sail past — leaving the connection that
    // opened a moment later with nobody to close it.
    this.generation = 0
  }

  /**
   * Initialize Socket.IO connection
   * @param {string} token - JWT authentication token
   * @returns {Promise<void>}
   */
  connect(token) {
    if (this.socket?.connected) {
      return Promise.resolve()
    }
    if (this.connecting) {
      return this.connecting
    }
    this.connecting = this._openSocket(token).finally(() => {
      this.connecting = null
    })
    return this.connecting
  }

  async _openSocket(token) {
    const generation = this.generation

    // socket.io-client + engine.io-client are ~105kB of the bundle, and the
    // NotificationBell that calls this renders inside DashboardLayout — i.e.
    // on every signed-in screen. Imported statically it lands in the layout
    // chunk and delays the first paint after login for a connection nothing
    // is waiting on. Loading it here splits it into its own chunk that
    // downloads alongside, instead of ahead of, the page.
    const { io } = await import('socket.io-client')

    // Caller gave up (unmounted) while the chunk was downloading.
    if (generation !== this.generation) return

    return new Promise((resolve, reject) => {
      // Socket.IO connects to backend
      const serverUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://hrapi.meka.com'

      this.socket = io(serverUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 3,
      })

      this.socket.on('connect', () => {
        if (import.meta.env.DEV) console.log('✅ Socket.IO connected')
        this.isConnected = true
        resolve()
      })

      this.socket.on('disconnect', (reason) => {
        if (import.meta.env.DEV) console.log('❌ Socket.IO disconnected:', reason)
        this.isConnected = false
        this.currentRoom = null
      })

      let connectErrorLogged = false
      this.socket.on('connect_error', (error) => {
        if (!connectErrorLogged) {
          connectErrorLogged = true
          console.warn('Socket.IO: server unreachable (check backend at API_BASE_URL)')
        }
        reject(error)
      })

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error)
      })
    })
  }

  /**
   * Disconnect Socket.IO
   */
  disconnect() {
    this.generation += 1
    this.connecting = null
    if (this.socket) {
      if (this.currentRoom) {
        this.leaveRoom(this.currentRoom)
      }
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.currentRoom = null
      this.listeners.clear()
    }
  }

  /**
   * Join a chat room
   * @param {string} room - Room name (hr, admin, medical)
   * @returns {Promise<void>}
   */
  joinRoom(room) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'))
        return
      }

      // Leave current room if in one
      if (this.currentRoom && this.currentRoom !== room) {
        this.leaveRoom(this.currentRoom)
      }

      this.socket.emit('join_room', room, (response) => {
        if (response && response.error) {
          reject(new Error(response.error))
        } else {
          this.currentRoom = room
          resolve()
        }
      })

      // Listen for room_joined event
      const roomJoinedHandler = (data) => {
        if (data.room === room) {
          this.currentRoom = room
          resolve()
        }
      }

      this.socket.once('room_joined', roomJoinedHandler)
    })
  }

  /**
   * Leave a chat room
   * @param {string} room - Room name
   */
  leaveRoom(room) {
    if (this.socket && this.isConnected && this.currentRoom === room) {
      this.socket.leave(room)
      this.currentRoom = null
    }
  }

  /**
   * Send a message to the current room
   * @param {string} message - Message text
   * @returns {Promise<void>}
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'))
        return
      }

      if (!this.currentRoom) {
        reject(new Error('Not in a room'))
        return
      }

      this.socket.emit('send_message', { room: this.currentRoom, message }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Send typing indicator
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTyping(isTyping) {
    if (this.socket && this.isConnected && this.currentRoom) {
      this.socket.emit('typing', {
        room: this.currentRoom,
        isTyping,
      })
    }
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot register listener')
      return
    }

    this.socket.on(event, callback)

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event)
    }
    this.listeners.delete(event)
  }
}

// Export singleton instance
export default new SocketService()
