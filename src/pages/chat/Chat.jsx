import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, Space, Typography, Avatar, Badge, App } from 'antd'
import {
  MessageOutlined,
  UserOutlined,
  SendOutlined,
  CustomerServiceOutlined,
  SafetyOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import socketService from '../../services/socketService'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text, Title } = Typography
const { TextArea } = Input

const Chat = () => {
  const { message } = App.useApp()
  const { user } = useSelector((state) => state.auth)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  // Initialize socket connection
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      message.error('Please login to use chat')
      return
    }

    socketService
      .connect(token)
      .then(() => {
        setIsConnected(true)
        message.success('Connected to chat server')
      })
      .catch((error) => {
        console.error('Failed to connect to chat:', error)
        message.error('Failed to connect to chat server')
      })

    // Cleanup on unmount
    return () => {
      socketService.disconnect()
    }
  }, [])

  // Set up message listeners
  useEffect(() => {
    if (!socketService.socket) return

    const handleReceiveMessage = (messageData) => {
      setMessages((prev) => [...prev, messageData])
      scrollToBottom()
    }

    const handleRoomJoined = (data) => {
      message.success(data.message || `Joined ${data.room} chat`)
      setMessages([]) // Clear messages when joining new room
    }

    const handleUserTyping = (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Set([...prev, data.userName]))
      } else {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.userName)
          return newSet
        })
      }
    }

    const handleError = (error) => {
      message.error(error.message || 'An error occurred')
    }

    socketService.on('receive_message', handleReceiveMessage)
    socketService.on('room_joined', handleRoomJoined)
    socketService.on('user_typing', handleUserTyping)
    socketService.on('error', handleError)

    return () => {
      socketService.off('receive_message', handleReceiveMessage)
      socketService.off('room_joined', handleRoomJoined)
      socketService.off('user_typing', handleUserTyping)
      socketService.off('error', handleError)
    }
  }, [])

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle room selection
  const handleJoinRoom = async (room) => {
    if (!isConnected) {
      message.warning('Please wait for connection...')
      return
    }

    try {
      await socketService.joinRoom(room)
      setCurrentRoom(room)
      setMessages([])
    } catch (error) {
      message.error(error.message || 'Failed to join room')
    }
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      return
    }

    if (!currentRoom) {
      message.warning('Please select a chat room first')
      return
    }

    try {
      await socketService.sendMessage(inputMessage.trim())
      setInputMessage('')
      setIsTyping(false)
      socketService.sendTyping(false)

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    } catch (error) {
      message.error(error.message || 'Failed to send message')
    }
  }

  // Handle typing indicator
  const handleInputChange = (e) => {
    const value = e.target.value
    setInputMessage(value)

    if (!isTyping && value.length > 0) {
      setIsTyping(true)
      socketService.sendTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socketService.sendTyping(false)
    }, 1000)
  }

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getRoomDisplayName = (room) => {
    const roomNames = {
      hr: 'HR',
      admin: 'Admin',
      medical: 'Medical Desk',
    }
    return roomNames[room] || room
  }

  const getRoomIcon = (room) => {
    const icons = {
      hr: <CustomerServiceOutlined />,
      admin: <SafetyOutlined />,
      medical: <MedicineBoxOutlined />,
    }
    return icons[room] || <MessageOutlined />
  }

  return (
    <DashboardLayout>
      <div className="page-container" style={{ padding: '24px' }}>
        <Card>
          <Title level={2} style={{ marginBottom: 24 }}>
            Real-Time Chat
          </Title>

          {/* Connection Status */}
          <Space style={{ marginBottom: 24 }}>
            <Badge
              status={isConnected ? 'success' : 'error'}
              text={isConnected ? 'Connected' : 'Disconnected'}
            />
            {currentRoom && (
              <Text type="secondary">Active Room: {getRoomDisplayName(currentRoom)}</Text>
            )}
          </Space>

          {/* Room Selection Buttons */}
          <Space size="large" style={{ marginBottom: 24, width: '100%' }}>
            <Button
              type={currentRoom === 'hr' ? 'primary' : 'default'}
              size="large"
              icon={<CustomerServiceOutlined />}
              onClick={() => handleJoinRoom('hr')}
              disabled={!isConnected}
            >
              Talk to HR
            </Button>
            <Button
              type={currentRoom === 'admin' ? 'primary' : 'default'}
              size="large"
              icon={<SafetyOutlined />}
              onClick={() => handleJoinRoom('admin')}
              disabled={!isConnected}
            >
              Talk to Admin
            </Button>
            <Button
              type={currentRoom === 'medical' ? 'primary' : 'default'}
              size="large"
              icon={<MedicineBoxOutlined />}
              onClick={() => handleJoinRoom('medical')}
              disabled={!isConnected}
            >
              Talk to Medical Desk
            </Button>
          </Space>

          {/* Chat Messages Area */}
          {currentRoom ? (
            <Card
              style={{
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: 16,
              }}
              bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {/* Messages List */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  backgroundColor: '#f5f5f5',
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#999',
                      marginTop: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <MessageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <Text type="secondary">No messages yet. Start the conversation!</Text>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwnMessage = msg.sender?.id === user?.id
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                            gap: 8,
                          }}
                        >
                          <Avatar
                            icon={<UserOutlined />}
                            style={{
                              backgroundColor: isOwnMessage ? '#1890ff' : '#52c41a',
                            }}
                          />
                          <div
                            style={{
                              backgroundColor: isOwnMessage ? '#1890ff' : '#fff',
                              color: isOwnMessage ? '#fff' : '#000',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                          >
                            {!isOwnMessage && (
                              <div style={{ marginBottom: 4 }}>
                                <Text
                                  strong
                                  style={{
                                    color: isOwnMessage ? '#fff' : '#1890ff',
                                    fontSize: 12,
                                  }}
                                >
                                  {msg.sender?.name || 'Unknown'}
                                </Text>
                                {msg.sender?.role && (
                                  <Text
                                    type="secondary"
                                    style={{
                                      color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999',
                                      fontSize: 11,
                                      marginLeft: 8,
                                    }}
                                  >
                                    ({msg.sender.role})
                                  </Text>
                                )}
                              </div>
                            )}
                            <div style={{ marginBottom: 4 }}>{msg.message}</div>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999',
                              }}
                            >
                              {dayjs(msg.timestamp).format('HH:mm')}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div style={{ padding: '8px 16px', color: '#999', fontStyle: 'italic' }}>
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1 }}
                    disabled={!isConnected}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !isConnected}
                    style={{ height: 'auto' }}
                  >
                    Send
                  </Button>
                </Space.Compact>
              </div>
            </Card>
          ) : (
            <Card
              style={{
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <MessageOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                <Title level={4} type="secondary">
                  Select a chat room to start messaging
                </Title>
                <Text type="secondary">
                  Choose from HR, Admin, or Medical Desk to begin your conversation
                </Text>
              </div>
            </Card>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Chat
