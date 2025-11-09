# WebSocket API Documentation

## Overview

This document describes the WebSocket integration for real-time communication in the WindGo Chat application. WebSocket enables instant message delivery, typing indicators, online status, and room notifications.

**WebSocket URL:** `ws://localhost:8080/ws` or `wss://localhost:8080/ws`

---

## Table of Contents

- [Connection](#connection)
- [Authentication](#authentication)
- [Message Types](#message-types)
  - [Message](#message-type-message)
  - [Typing](#typing-type-typing)
  - [Join](#join-type-join)
  - [Leave](#leave-type-leave)
- [Client Implementation](#client-implementation)
- [React Hooks](#react-hooks)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Connection

### Establishing Connection

WebSocket connection requires JWT token for authentication. The token is passed as a query parameter.

**Connection URL:**
```
ws://localhost:8080/ws?token=YOUR_JWT_TOKEN
```

**TypeScript Example:**
```typescript
import { WebSocketClient } from '@/lib/websocket';

const token = localStorage.getItem('token');
const ws = new WebSocketClient('http://localhost:8080', token!);

await ws.connect();
console.log('WebSocket connected');
```

---

## Authentication

Authentication is handled via JWT token in the connection URL. The token is validated by the server on connection.

**Authentication Flow:**
1. User logs in via REST API and receives JWT token
2. Token is stored in localStorage
3. WebSocket client connects with token in query parameter
4. Server validates token and associates connection with user

**Example:**
```typescript
// After login
const { token, user } = await login({ email, password });
localStorage.setItem('token', token);

// Connect to WebSocket
const ws = new WebSocketClient('http://localhost:8080', token);
await ws.connect();
```

---

## Message Types

All WebSocket messages follow this format:

```typescript
interface WSMessage {
  type: 'message' | 'typing' | 'join' | 'leave' | 'error';
  room_id: number;
  user_id: number;
  content: any;
  timestamp?: string;
}
```

### Message (type: 'message')

Broadcast when a user sends a message to a room.

**Incoming Message:**
```json
{
  "type": "message",
  "room_id": 1,
  "user_id": 5,
  "content": {
    "id": 123,
    "content": "Hello world!",
    "user_id": 5,
    "user": {
      "id": 5,
      "username": "alice",
      "email": "alice@example.com",
      "role": "user"
    },
    "room_id": 1,
    "parent_id": null,
    "parent_message": null,
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

**TypeScript Usage:**
```typescript
ws.on('message', (msg) => {
  const message = msg.content;
  console.log(`${message.user.username}: ${message.content}`);
  // Add message to UI
  addMessageToChat(message);
});
```

---

### Typing (type: 'typing')

Sent when a user starts or stops typing in a room.

**Outgoing (Send typing indicator):**
```json
{
  "type": "typing",
  "room_id": 1,
  "user_id": 0,
  "content": {
    "typing": true
  }
}
```

**Incoming (Receive typing indicator):**
```json
{
  "type": "typing",
  "room_id": 1,
  "user_id": 5,
  "content": {
    "typing": true
  }
}
```

**TypeScript Usage:**
```typescript
// Send typing indicator
ws.sendTyping(roomId, true);  // Started typing
setTimeout(() => ws.sendTyping(roomId, false), 1000); // Stopped typing

// Listen for typing indicators
ws.on('typing', (msg) => {
  if (msg.content.typing) {
    console.log(`User ${msg.user_id} is typing in room ${msg.room_id}`);
  }
});
```

---

### Join (type: 'join')

Sent/received when a user joins a room.

**Outgoing (Join a room):**
```json
{
  "type": "join",
  "room_id": 1,
  "user_id": 0,
  "content": {
    "room_id": 1
  }
}
```

**Incoming (User joined):**
```json
{
  "type": "join",
  "room_id": 1,
  "user_id": 5,
  "content": {
    "room_id": 1
  }
}
```

**TypeScript Usage:**
```typescript
// Join a room
ws.joinRoom(1);

// Listen for join events
ws.on('join', (msg) => {
  console.log(`User ${msg.user_id} joined room ${msg.room_id}`);
  showNotification(`User joined the room`);
});
```

---

### Leave (type: 'leave')

Sent/received when a user leaves a room.

**Outgoing (Leave a room):**
```json
{
  "type": "leave",
  "room_id": 1,
  "user_id": 0,
  "content": {
    "room_id": 1
  }
}
```

**Incoming (User left):**
```json
{
  "type": "leave",
  "room_id": 1,
  "user_id": 5,
  "content": {
    "room_id": 1
  }
}
```

**TypeScript Usage:**
```typescript
// Leave a room
ws.leaveRoom(1);

// Listen for leave events
ws.on('leave', (msg) => {
  console.log(`User ${msg.user_id} left room ${msg.room_id}`);
  showNotification(`User left the room`);
});
```

---

## Client Implementation

### WebSocketClient Class

The `WebSocketClient` class provides a robust WebSocket implementation with automatic reconnection and room management.

**Features:**
- Automatic reconnection with exponential backoff
- Room join/leave management
- Message type subscriptions
- Typing indicators
- Connection status tracking
- Error handling

**Basic Usage:**
```typescript
import { WebSocketClient } from '@/lib/websocket';

const token = localStorage.getItem('token')!;
const ws = new WebSocketClient('http://localhost:8080', token);

// Connect
await ws.connect();

// Join a room
ws.joinRoom(1);

// Listen for messages
ws.on('message', (msg) => {
  console.log('New message:', msg.content);
});

// Send typing indicator
ws.sendTyping(1, true);

// Leave room
ws.leaveRoom(1);

// Disconnect
ws.disconnect();
```

---

## React Hooks

### useWebSocket Hook

React hook for easy WebSocket integration in components.

**Features:**
- Automatic connection/disconnection on mount/unmount
- Room management
- Message collection
- Typing indicators
- Connection status

**Usage:**
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function ChatRoom({ roomId }: { roomId: number }) {
  const { messages, sendTyping, isConnected } = useWebSocket(roomId);

  return (
    <div>
      {isConnected ? (
        <div className="status-connected">Connected</div>
      ) : (
        <div className="status-disconnected">Disconnected</div>
      )}

      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      <input
        onChange={() => sendTyping(true)}
        onBlur={() => sendTyping(false)}
      />
    </div>
  );
}
```

### useTypingIndicator Hook

React hook for monitoring typing indicators in a room.

**Usage:**
```typescript
import { useTypingIndicator } from '@/hooks/useWebSocket';

function TypingIndicator({ roomId }: { roomId: number }) {
  const typingUsers = useTypingIndicator(roomId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator">
      {typingUsers.length} {typingUsers.length === 1 ? 'user' : 'users'} typing...
    </div>
  );
}
```

### useOnlineUsers Hook

React hook for monitoring online users.

**Usage:**
```typescript
import { useOnlineUsers } from '@/hooks/useWebSocket';

function OnlineUsersList() {
  const onlineUsers = useOnlineUsers();

  return (
    <div>
      <h3>Online Users ({onlineUsers.length})</h3>
      {/* Display online users */}
    </div>
  );
}
```

---

## Usage Examples

### Complete Chat Implementation

```typescript
import { useWebSocket, useTypingIndicator } from '@/hooks/useWebSocket';
import { sendMessage } from '@/lib/api/messages';
import { useState } from 'react';

function ChatRoom({ roomId }: { roomId: number }) {
  const [input, setInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    messages: wsMessages,
    sendTyping,
    isConnected,
    clearMessages
  } = useWebSocket(roomId);

  const typingUsers = useTypingIndicator(roomId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Send typing indicator
    sendTyping(true);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Stop typing after 1 second of no input
    const timeout = setTimeout(() => {
      sendTyping(false);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Send message via REST API (will be broadcast via WebSocket)
    await sendMessage({
      room_id: roomId,
      content: input
    });

    setInput('');
    sendTyping(false);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  };

  return (
    <div className="chat-room">
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div className="messages">
        {wsMessages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.user.username}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.length} user(s) typing...
        </div>
      )}

      <div className="input-area">
        <input
          value={input}
          onChange={handleInputChange}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

### Manual WebSocket Management

```typescript
import { WebSocketClient } from '@/lib/websocket';
import { useEffect, useState } from 'react';

function CustomWebSocketComponent() {
  const [ws, setWs] = useState<WebSocketClient | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new WebSocketClient('http://localhost:8080', token);

    // Setup event handlers
    client.onConnect(() => {
      console.log('Connected to WebSocket');
    });

    client.onDisconnect(() => {
      console.log('Disconnected from WebSocket');
    });

    client.onError((error) => {
      console.error('WebSocket error:', error);
    });

    // Listen for all messages
    client.on('all', (msg) => {
      console.log('Received:', msg);
      setMessages(prev => [...prev, msg]);
    });

    // Connect
    client.connect();
    setWs(client);

    return () => {
      client.disconnect();
    };
  }, []);

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{JSON.stringify(msg)}</div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### Connection Errors

```typescript
const ws = new WebSocketClient('http://localhost:8080', token);

ws.onError((error) => {
  console.error('WebSocket error:', error);
  // Show error notification to user
  showErrorNotification('Connection error. Reconnecting...');
});

ws.onDisconnect(() => {
  // Show disconnected status
  setConnectionStatus('disconnected');
});

ws.onConnect(() => {
  // Show connected status
  setConnectionStatus('connected');
});
```

### Automatic Reconnection

The WebSocket client automatically reconnects with exponential backoff:
- Initial delay: 5 seconds
- Max delay: 60 seconds
- Exponential backoff factor: 2

When reconnected, all previously joined rooms are automatically rejoined.

---

## Testing

### Testing WebSocket Connection

```typescript
// Test connection
const ws = new WebSocketClient('http://localhost:8080', token);

await ws.connect();
console.log('Connected:', ws.isConnected());

// Test join room
ws.joinRoom(1);

// Test message reception
ws.on('message', (msg) => {
  console.log('Received message:', msg);
});

// Test typing indicator
ws.sendTyping(1, true);
setTimeout(() => ws.sendTyping(1, false), 1000);

// Test leave room
ws.leaveRoom(1);

// Test disconnect
ws.disconnect();
```

### Testing with Browser DevTools

1. Open browser DevTools
2. Go to Network tab
3. Filter by WS (WebSocket)
4. Connect to WebSocket
5. View incoming/outgoing messages in frames tab

---

## Implementation Status

✅ **Fully Implemented:**
- WebSocket client with auto-reconnection
- Room join/leave
- Real-time message delivery
- Typing indicators
- Connection status tracking
- Error handling
- React hooks (useWebSocket, useTypingIndicator, useOnlineUsers)

✅ **Features:**
- Automatic reconnection with exponential backoff
- Room management
- Message type subscriptions
- Event handlers
- TypeScript support

---

## Notes

- WebSocket connection requires valid JWT token
- Token is passed as query parameter in connection URL
- Messages sent via REST API are automatically broadcast via WebSocket
- WebSocket client automatically rejoins rooms after reconnection
- Maximum reconnect delay is 60 seconds
- All rooms are left when disconnecting
- WebSocket connection is closed on logout

---

## Integration with REST API

WebSocket works alongside REST API:

**Sending Messages:**
- Use REST API `POST /api/v1/messages` to send messages
- Backend automatically broadcasts message via WebSocket to all room members
- No need to manually broadcast through WebSocket

**Receiving Messages:**
- Listen to WebSocket for real-time message delivery
- Messages include full user and parent message data

**Example Flow:**
```typescript
// Component 1: Send message via REST API
const message = await sendMessage({
  room_id: 1,
  content: 'Hello!'
});

// Component 2: Receive via WebSocket (automatic)
ws.on('message', (msg) => {
  // This will trigger for all users in the room
  addMessageToUI(msg.content);
});
```

---

## Best Practices

1. **Connection Management:**
   - Connect WebSocket after successful login
   - Disconnect on logout
   - Use React hooks for automatic lifecycle management

2. **Room Management:**
   - Join rooms when entering chat view
   - Leave rooms when exiting chat view
   - Track joined rooms to avoid duplicate joins

3. **Typing Indicators:**
   - Send `typing: true` when user starts typing
   - Send `typing: false` after 1 second of inactivity
   - Clear timeout on component unmount

4. **Error Handling:**
   - Always handle connection errors
   - Show connection status to users
   - Provide retry mechanism

5. **Performance:**
   - Limit typing indicator frequency
   - Batch message updates where possible
   - Use React.memo for message components
