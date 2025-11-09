# Message API Documentation

## Overview

This document describes all message-related API endpoints available in the WindGo Chat application. Message endpoints handle sending, retrieving, editing, and deleting chat messages with support for pagination and threaded replies.

**Base URL:** `http://localhost:8080/api/v1`

---

## Table of Contents

- [Message Endpoints](#message-endpoints)
  - [Get Messages](#get-messages)
  - [Send Message](#send-message)
  - [Update Message](#update-message)
  - [Delete Message](#delete-message)
- [Features](#features)
  - [Pagination](#pagination)
  - [Threaded Replies](#threaded-replies)
  - [Message Ownership](#message-ownership)
- [Data Models](#data-models)
- [Helper Functions](#helper-functions)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

---

## Message Endpoints

### Get Messages

Get all messages for a specific room with pagination support.

**Endpoint:** `GET /api/v1/rooms/:roomId/messages`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50, max: 100) - Messages per page

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hello world!",
      "user_id": 1,
      "user": {
        "id": 1,
        "username": "alice",
        "email": "alice@example.com",
        "role": "user",
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      },
      "room_id": 1,
      "parent_id": null,
      "parent_message": null,
      "created_at": "2024-01-15T14:30:00Z",
      "updated_at": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a member of the room
- `404 Not Found` - Room doesn't exist

**TypeScript Usage:**
```typescript
import { getMessages } from '@/lib/api/messages';

const { messages, pagination } = await getMessages(1, 1, 50);
console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
messages.forEach(msg => {
  console.log(`${msg.user.username}: ${msg.content}`);
});
```

---

### Send Message

Send a new message to a room. Supports threaded replies.

**Endpoint:** `POST /api/v1/messages`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "room_id": 1,
  "content": "Hello world!",
  "parent_id": null
}
```

**Response:** `201 Created`
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 123,
    "content": "Hello world!",
    "user_id": 1,
    "user": {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "role": "user",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    },
    "room_id": 1,
    "parent_id": null,
    "parent_message": null,
    "created_at": "2024-01-15T14:35:00Z",
    "updated_at": "2024-01-15T14:35:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data or parent message
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a member of the room
- `404 Not Found` - Room or parent message doesn't exist

**TypeScript Usage:**
```typescript
import { sendMessage } from '@/lib/api/messages';

// Send regular message
const message = await sendMessage({
  room_id: 1,
  content: 'Hello world!'
});

// Send threaded reply
const reply = await sendMessage({
  room_id: 1,
  content: 'This is a reply',
  parent_id: 123
});
```

---

### Update Message

Update/edit an existing message. Only the message author can edit their messages.

**Endpoint:** `PUT /api/v1/messages/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:** `200 OK`
```json
{
  "message": "Message updated successfully",
  "data": {
    "id": 123,
    "content": "Updated message content",
    "user_id": 1,
    "user": {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "role": "user",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    },
    "room_id": 1,
    "parent_id": null,
    "parent_message": null,
    "created_at": "2024-01-15T14:35:00Z",
    "updated_at": "2024-01-15T14:40:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the message author
- `404 Not Found` - Message doesn't exist

**TypeScript Usage:**
```typescript
import { updateMessage } from '@/lib/api/messages';

const updated = await updateMessage(123, 'Updated content');
console.log(`Message updated at: ${updated.updated_at}`);
```

---

### Delete Message

Soft delete a message. Only the message author can delete their messages.

**Endpoint:** `DELETE /api/v1/messages/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Message deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the message author
- `404 Not Found` - Message doesn't exist

**TypeScript Usage:**
```typescript
import { deleteMessage } from '@/lib/api/messages';

await deleteMessage(123);
console.log('Message deleted successfully');
```

---

## Features

### Pagination

Messages are returned in descending order by creation time (newest first). Use pagination to load historical messages.

**Parameters:**
- `page` - Page number (starts at 1)
- `limit` - Messages per page (max 100, default 50)

**Example:**
```typescript
// Load first page
const page1 = await getMessages(roomId, 1, 50);

// Load second page
const page2 = await getMessages(roomId, 2, 50);

// Infinite scroll implementation
const loadMore = async () => {
  const { messages: newMessages, pagination } = await getMessages(
    roomId,
    currentPage + 1,
    50
  );
  setMessages([...messages, ...newMessages]);
  setCurrentPage(pagination.page);
};
```

---

### Threaded Replies

Messages can be replied to by setting `parent_id` when sending a message. The parent message and its author are included in the response.

**Example:**
```typescript
// Original message
const original = await sendMessage({
  room_id: 1,
  content: 'What do you think about this?'
});

// Reply to the message
const reply = await sendMessage({
  room_id: 1,
  content: 'I think it\'s great!',
  parent_id: original.id
});

console.log(reply.parent_message.content); // "What do you think about this?"
console.log(reply.parent_message.user.username); // Original author
```

---

### Message Ownership

Only the message author can edit or delete their messages. Use the `isMessageOwner` helper to check ownership:

```typescript
import { isMessageOwner } from '@/lib/api/messages';

const canEdit = isMessageOwner(message, currentUser.id);

{canEdit && (
  <div>
    <button onClick={() => editMessage(message.id)}>Edit</button>
    <button onClick={() => deleteMessage(message.id)}>Delete</button>
  </div>
)}
```

---

## Data Models

### Message

```typescript
interface Message {
  id: number;
  content: string;
  user_id: number;
  user: User;
  room_id: number;
  parent_id?: number;           // ID of parent message (for threads)
  parent_message?: Message;      // Full parent message object
  created_at: string;            // ISO 8601 datetime
  updated_at: string;            // ISO 8601 datetime
}
```

### MessagesResponse

```typescript
interface MessagesResponse {
  messages: Message[];
  pagination: PaginationInfo;
}

interface PaginationInfo {
  page: number;                  // Current page
  limit: number;                 // Items per page
  total: number;                 // Total message count
  totalPages: number;            // Total pages
}
```

### SendMessageRequest

```typescript
interface SendMessageRequest {
  room_id: number;
  content: string;
  parent_id?: number;            // Optional, for threaded replies
}
```

---

## Helper Functions

### formatMessageTime

Formats message timestamps into readable format:

```typescript
import { formatMessageTime } from '@/lib/api/messages';

const time = formatMessageTime(message.created_at);
// Today: "2:30 PM"
// Yesterday: "Yesterday 3:45 PM"
// This week: "Mon 10:15 AM"
// Older: "Jan 15 2:30 PM"
```

### groupMessagesByDate

Groups messages by date for displaying date separators:

```typescript
import { groupMessagesByDate } from '@/lib/api/messages';

const grouped = groupMessagesByDate(messages);

Object.entries(grouped).map(([date, msgs]) => (
  <div key={date}>
    <DateSeparator date={date} />
    {msgs.map(msg => <MessageBubble message={msg} />)}
  </div>
));
```

### isMessageOwner

Checks if current user owns a message:

```typescript
import { isMessageOwner } from '@/lib/api/messages';

const canEdit = isMessageOwner(message, currentUser.id);
```

---

## Usage Examples

### Complete Chat Implementation

```typescript
import { getMessages, sendMessage } from '@/lib/api/messages';
import { useState, useEffect } from 'react';

function ChatRoom({ roomId }: { roomId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [roomId]);

  const loadMessages = async () => {
    const { messages: msgs, pagination } = await getMessages(roomId, 1, 50);
    setMessages(msgs.reverse()); // Reverse to show oldest first
    setHasMore(pagination.page < pagination.totalPages);
  };

  // Load more messages (scroll to top)
  const loadMore = async () => {
    const nextPage = page + 1;
    const { messages: msgs, pagination } = await getMessages(roomId, nextPage, 50);
    setMessages([...msgs.reverse(), ...messages]);
    setPage(nextPage);
    setHasMore(pagination.page < pagination.totalPages);
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const message = await sendMessage({
      room_id: roomId,
      content: newMessage
    });

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div>
      {hasMore && <button onClick={loadMore}>Load More</button>}

      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      <input
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Threaded Replies UI

```typescript
function ThreadedMessage({ message }: { message: Message }) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleReply = async () => {
    const reply = await sendMessage({
      room_id: message.room_id,
      content: replyText,
      parent_id: message.id
    });

    setReplyText('');
    setShowReply(false);
  };

  return (
    <div>
      {message.parent_message && (
        <div className="reply-to">
          <small>Replying to {message.parent_message.user.username}</small>
          <p>{message.parent_message.content}</p>
        </div>
      )}

      <div className="message">
        <strong>{message.user.username}</strong>
        <p>{message.content}</p>
        <button onClick={() => setShowReply(!showReply)}>Reply</button>
      </div>

      {showReply && (
        <div className="reply-input">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Type your reply..."
          />
          <button onClick={handleReply}>Send Reply</button>
        </div>
      )}
    </div>
  );
}
```

### Edit/Delete Messages

```typescript
function MessageActions({ message, currentUserId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const canModify = isMessageOwner(message, currentUserId);

  const handleEdit = async () => {
    const updated = await updateMessage(message.id, editContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this message?')) {
      await deleteMessage(message.id);
    }
  };

  if (!canModify) return null;

  return (
    <div>
      {isEditing ? (
        <div>
          <input
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
          />
          <button onClick={handleEdit}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### Common Error Scenarios

```typescript
import { sendMessage } from '@/lib/api/messages';

try {
  const message = await sendMessage({
    room_id: roomId,
    content: messageText
  });
} catch (error: any) {
  if (error.response?.status === 403) {
    alert('You are not a member of this room');
  } else if (error.response?.status === 404) {
    alert('Room not found');
  } else if (error.response?.status === 400) {
    alert('Invalid message data');
  } else if (error.code === 'ERR_NETWORK') {
    alert('Cannot connect to server');
  } else {
    alert('Failed to send message');
  }
}
```

---

## Implementation Status

✅ **Fully Implemented:**
- Get Messages (with pagination)
- Send Message
- Update/Edit Message
- Delete Message
- Threaded Replies
- Message Ownership Validation

✅ **Helper Functions:**
- formatMessageTime
- groupMessagesByDate
- isMessageOwner
- loadMoreMessages

---

## Notes

- Messages are soft-deleted (marked as deleted but not removed from database)
- Messages are returned in descending order (newest first)
- Maximum 100 messages per page
- Threaded replies support infinite nesting
- Only message author can edit/delete
- Real-time updates require WebSocket integration (see PR #4)

---

## Testing

### Test with cURL

```bash
# Get messages
curl "http://localhost:8080/api/v1/rooms/1/messages?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message
curl -X POST http://localhost:8080/api/v1/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id":1,"content":"Hello world!"}'

# Send threaded reply
curl -X POST http://localhost:8080/api/v1/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id":1,"content":"Reply","parent_id":123}'

# Update message
curl -X PUT http://localhost:8080/api/v1/messages/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated content"}'

# Delete message
curl -X DELETE http://localhost:8080/api/v1/messages/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration with WebSocket

Messages sent via the API are automatically broadcast to all room members via WebSocket. See `docs/API_WEBSOCKET.md` for real-time message handling.

```typescript
// Send message via API
const message = await sendMessage({ room_id: 1, content: 'Hello' });

// Other users receive via WebSocket
wsClient.on('message', (msg) => {
  if (msg.type === 'message') {
    // Add to UI
    addMessageToChat(msg.content);
  }
});
```
