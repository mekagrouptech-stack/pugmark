const { Server } = require('socket.io')
const logger = require('../utils/logger')
const { authenticateSocket } = require('../middleware/socketAuth')

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket)
      if (user) {
        socket.user = user
        next()
      } else {
        next(new Error('Authentication failed'))
      }
    } catch (error) {
      logger.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  // Handle connections
  io.on('connection', (socket) => {
    const userId = socket.user?.id
    const userName = socket.user?.name || 'Unknown User'
    const userRole = socket.user?.role || 'EMPLOYEE'

    logger.info(`User connected: ${userName} (ID: ${userId}, Role: ${userRole})`)

    // Store user info in socket
    socket.userId = userId
    socket.userName = userName
    socket.userRole = userRole

    // Every user joins their own room for personal notifications (leave approved/rejected, etc.)
    try {
      const userRoom = 'user_' + userId
      socket.join(userRoom)
      logger.info(`User ${userName} joined room ${userRoom} for personal notifications`)
    } catch (e) {
      logger.error('Error joining user room:', e)
    }

    // Automatically join admin notification room for admins/HR (leave applied, etc.)
    try {
      const normalizedRole = String(userRole || '').toUpperCase()
      if (['ADMIN', 'HEAD_HR', 'HR', 'SYSTEM ADMIN', 'SYSTEM ADMINISTRATOR'].includes(normalizedRole)) {
        socket.join('admin_notifications')
        logger.info(`User ${userName} joined admin_notifications room for alerts`)
      }
    } catch (e) {
      logger.error('Error joining admin_notifications room:', e)
    }

    // Handle join room event
    socket.on('join_room', (room) => {
      // Validate room name (only allow hr, admin, medical)
      const allowedRooms = ['hr', 'admin', 'medical']
      if (!allowedRooms.includes(room)) {
        socket.emit('error', { message: 'Invalid room name' })
        return
      }

      // Leave previous room if in one
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom)
        logger.info(`User ${userName} left room: ${socket.currentRoom}`)
      }

      // Join new room
      socket.join(room)
      socket.currentRoom = room

      logger.info(`User ${userName} joined room: ${room}`)

      // Notify user they joined
      socket.emit('room_joined', {
        room,
        message: `You joined ${room} chat room`,
      })

      // Notify others in room (optional - for online status)
      socket.to(room).emit('user_joined', {
        userId,
        userName,
        room,
      })
    })

    // Handle send message event
    socket.on('send_message', (data) => {
      try {
        const { room, message } = data

        // Validate room
        const allowedRooms = ['hr', 'admin', 'medical']
        if (!allowedRooms.includes(room)) {
          socket.emit('error', { message: 'Invalid room name' })
          return
        }

        // Validate message
        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' })
          return
        }

        if (message.length > 1000) {
          socket.emit('error', { message: 'Message too long (max 1000 characters)' })
          return
        }

        // Check if user is in the room
        if (socket.currentRoom !== room) {
          socket.emit('error', { message: 'You must join the room first' })
          return
        }

        // Create message payload
        const messagePayload = {
          room,
          sender: {
            id: userId,
            name: userName,
            role: userRole,
          },
          message: message.trim(),
          timestamp: new Date().toISOString(),
        }

        // Broadcast to all users in the room (including sender)
        io.to(room).emit('receive_message', messagePayload)

        logger.info(`Message sent in room ${room} by ${userName}: ${message.substring(0, 50)}...`)

        // Save message to database (optional - async, don't block)
        saveMessageToDatabase(messagePayload).catch((err) => {
          logger.error('Error saving message to database:', err)
        })
      } catch (error) {
        logger.error('Error handling send_message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { room, isTyping } = data
      if (socket.currentRoom === room) {
        socket.to(room).emit('user_typing', {
          userId,
          userName,
          isTyping,
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user_left', {
          userId,
          userName,
          room: socket.currentRoom,
        })
        logger.info(`User ${userName} left room: ${socket.currentRoom}`)
      }
      logger.info(`User disconnected: ${userName} (Reason: ${reason})`)
    })

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userName}:`, error)
    })
  })

  return io
}

/**
 * Save message to database (optional enhancement)
 * @param {Object} messagePayload - Message data
 */
async function saveMessageToDatabase(messagePayload) {
  try {
    // Import Chat model (will be created)
    const { ChatMessage } = require('../models')
    
    if (ChatMessage) {
      await ChatMessage.create({
        room: messagePayload.room,
        userId: messagePayload.sender.id,
        userName: messagePayload.sender.name,
        userRole: messagePayload.sender.role,
        message: messagePayload.message,
        timestamp: new Date(messagePayload.timestamp),
      })
    }
  } catch (error) {
    // Silently fail - don't block message sending
    logger.error('Failed to save message to database:', error)
  }
}

module.exports = { initializeSocketServer }
