# Real-Time Chat System Architecture

## 🏗️ System Overview

A production-ready real-time chat system built with Socket.IO, supporting three separate chat rooms:
- **HR Room** (`hr`) - Talk to HR
- **Admin Room** (`admin`) - Talk to Admin  
- **Medical Room** (`medical`) - Talk to Medical Desk

## 📋 Architecture Components

### Backend Components

#### 1. **Socket.IO Server** (`backend/socket/socketServer.js`)
- **Purpose**: Manages real-time WebSocket connections
- **Features**:
  - User authentication via JWT tokens
  - Room-based message broadcasting
  - Connection/disconnection handling
  - Typing indicators
  - Message persistence (optional)

#### 2. **Socket Authentication** (`backend/middleware/socketAuth.js`)
- **Purpose**: Authenticates Socket.IO connections
- **Process**:
  1. Extracts JWT token from handshake
  2. Verifies token validity
  3. Fetches user from database
  4. Attaches user info to socket

#### 3. **Chat Message Model** (`backend/models/ChatMessage.js`)
- **Purpose**: Database schema for message persistence
- **Fields**:
  - `room`: Chat room name (hr/admin/medical)
  - `userId`: Sender user ID
  - `userName`: Sender name (historical)
  - `userRole`: Sender role (historical)
  - `message`: Message content
  - `timestamp`: Message timestamp

#### 4. **Server Integration** (`backend/server.js`)
- **Changes**:
  - Creates HTTP server for Socket.IO
  - Initializes Socket.IO server
  - Enables CORS for WebSocket connections

### Frontend Components

#### 1. **Socket Service** (`src/services/socketService.js`)
- **Purpose**: Singleton service managing Socket.IO client
- **Features**:
  - Connection management
  - Room joining/leaving
  - Message sending
  - Event listener management
  - Typing indicators

#### 2. **Chat Component** (`src/pages/chat/Chat.jsx`)
- **Purpose**: Main chat UI component
- **Features**:
  - Three room selection buttons
  - Real-time message display
  - Message input with Enter key support
  - Typing indicators
  - Connection status
  - User avatars and timestamps

## 🔄 Data Flow

### Message Sending Flow:
```
User Types Message
    ↓
Frontend: socketService.sendMessage()
    ↓
Socket.IO Client: emit('send_message')
    ↓
Backend: socketServer.js receives event
    ↓
Validation (room, message length)
    ↓
Broadcast to room: io.to(room).emit('receive_message')
    ↓
All clients in room receive message
    ↓
Frontend: Updates message list
    ↓
Optional: Save to database (async)
```

### Room Joining Flow:
```
User Clicks Room Button
    ↓
Frontend: socketService.joinRoom(room)
    ↓
Socket.IO Client: emit('join_room', room)
    ↓
Backend: Validates room name
    ↓
Socket joins room: socket.join(room)
    ↓
Backend: emit('room_joined')
    ↓
Frontend: Updates UI, clears messages
```

## 🔐 Security Features

1. **JWT Authentication**: All Socket.IO connections require valid JWT token
2. **Room Validation**: Only allows predefined rooms (hr, admin, medical)
3. **Message Validation**: 
   - Non-empty messages
   - Max 1000 characters
   - Room membership check
4. **User Verification**: Database lookup on connection

## 📊 Database Schema

```sql
CREATE TABLE chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room ENUM('hr', 'admin', 'medical') NOT NULL,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_room_timestamp (room, timestamp),
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install socket.io

# Frontend
npm install socket.io-client
```

### 2. Run Database Migration
```bash
cd backend
npm run db:migrate
```

### 3. Start Backend Server
```bash
cd backend
npm run dev
```

### 4. Start Frontend
```bash
npm run dev
```

### 5. Access Chat
Navigate to: `http://localhost:3000/chat`

## 🎯 Key Features

### ✅ Implemented
- Real-time messaging with Socket.IO
- Three separate chat rooms
- JWT authentication
- Room-based message broadcasting
- Typing indicators
- Message persistence (database)
- User avatars and timestamps
- Connection status display
- Error handling

### 🔮 Optional Enhancements (Future)
- Role-based access control
- Online/offline status
- File attachments
- Message history loading
- Read receipts
- Message search
- Emoji support
- Message reactions

## 📝 Event Names

### Client → Server
- `join_room` - Join a chat room
- `send_message` - Send a message
- `typing` - Typing indicator

### Server → Client
- `room_joined` - Confirmation of room join
- `receive_message` - New message received
- `user_typing` - User typing indicator
- `user_joined` - User joined room (optional)
- `user_left` - User left room (optional)
- `error` - Error message

## 🔧 Configuration

### Environment Variables
```env
# Backend .env
PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key

# Frontend .env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🐛 Troubleshooting

### Connection Issues
1. Check JWT token is valid
2. Verify backend server is running on port 3001
3. Check CORS configuration
4. Verify Socket.IO server initialized

### Message Not Sending
1. Check user is in a room
2. Verify message validation (non-empty, < 1000 chars)
3. Check browser console for errors
4. Verify Socket.IO connection status

### Messages Not Receiving
1. Verify both users are in same room
2. Check Socket.IO connection
3. Verify room name matches exactly

## 📚 Code Structure

```
backend/
├── socket/
│   └── socketServer.js       # Socket.IO server logic
├── middleware/
│   └── socketAuth.js         # Socket authentication
├── models/
│   └── ChatMessage.js        # Chat message model
└── migrations/
    └── 20260122000001-create-chat-messages.js

src/
├── services/
│   └── socketService.js      # Socket.IO client service
└── pages/
    └── chat/
        └── Chat.jsx          # Main chat component
```

## 🎨 UI Features

- **Room Selection**: Three prominent buttons for room selection
- **Message Display**: 
  - Different styling for own vs others' messages
  - User avatars
  - Timestamps
  - Role badges
- **Input Area**: 
  - Multi-line text area
  - Enter to send (Shift+Enter for new line)
  - Send button
- **Status Indicators**:
  - Connection status badge
  - Active room display
  - Typing indicators

## 🔒 Security Best Practices

1. **Authentication**: All connections require valid JWT
2. **Authorization**: Room access can be restricted by role (future)
3. **Input Validation**: Message length and content validation
4. **Rate Limiting**: Can be added to prevent spam
5. **XSS Protection**: Message content should be sanitized (frontend)

## 📈 Performance Considerations

1. **Message Persistence**: Async database writes don't block messaging
2. **Room Isolation**: Messages only broadcast to relevant room
3. **Connection Pooling**: Socket.IO handles connection management
4. **Indexes**: Database indexes on room, timestamp, user_id

## 🧪 Testing

### Manual Testing Checklist
- [ ] Connect to chat server
- [ ] Join HR room
- [ ] Send message
- [ ] Receive message in same room
- [ ] Switch to Admin room
- [ ] Verify messages are room-specific
- [ ] Test typing indicator
- [ ] Test disconnection/reconnection
- [ ] Verify message persistence

---

**Built with**: Node.js, Express, Socket.IO, React, Ant Design
**Architecture**: Real-time WebSocket communication with room-based messaging
