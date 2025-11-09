# Room API Documentation

## Overview

This document describes all room-related API endpoints available in the WindGo Chat application. Room endpoints handle chat rooms, direct messages, participants, and room management.

**Base URL:** `http://localhost:8080/api/v1`

---

## Table of Contents

- [Room Types](#room-types)
- [Room Endpoints](#room-endpoints)
  - [Get All Rooms](#get-all-rooms)
  - [Get Room by ID](#get-room-by-id)
  - [Create Room](#create-room-admin-only)
  - [Update Room](#update-room-admin-only)
  - [Delete Room](#delete-room-admin-only)
- [Direct Message Endpoints](#direct-message-endpoints)
  - [Get Direct Rooms](#get-direct-rooms)
  - [Create Direct Room](#create-direct-room)
- [Room Membership](#room-membership)
  - [Get Room Participants](#get-room-participants)
  - [Invite User to Room](#invite-user-to-room)
  - [Remove User from Room](#remove-user-from-room)
- [Room Actions](#room-actions)
  - [Mark Room as Read](#mark-room-as-read)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Room Types

The application supports two types of rooms:

- **Group Rooms** (`type: "group"`)
  - Public or private chat rooms
  - Can have multiple members
  - Requires admin role to create/edit/delete
  - Examples: "General", "Development", "Random"

- **Direct Message Rooms** (`type: "direct"`)
  - One-on-one conversations between two users
  - Automatically created when users start chatting
  - Cannot have more than 2 members
  - Named after usernames (e.g., "alice_bob")

---

## Room Endpoints

### Get All Rooms

Get all rooms that the authenticated user is a member of.

**Endpoint:** `GET /api/v1/rooms`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "General",
      "type": "group",
      "display_name": "General (#1)",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "alice_bob",
      "type": "direct",
      "display_name": "alice_bob (#2)",
      "created_at": "2024-01-15T11:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**TypeScript Usage:**
```typescript
import { getRooms } from '@/lib/api/rooms';

const rooms = await getRooms();
rooms.forEach(room => {
  console.log(`${room.name} (${room.type})`);
});
```

---

### Get Room by ID

Get details of a specific room.

**Endpoint:** `GET /api/v1/rooms/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Room retrieved successfully",
  "data": {
    "id": 1,
    "name": "General",
    "type": "group",
    "display_name": "General (#1)",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Room doesn't exist
- `401 Unauthorized` - Not authenticated

**TypeScript Usage:**
```typescript
import { getRoomById } from '@/lib/api/rooms';

const room = await getRoomById(1);
console.log(room.name);
```

---

### Create Room (Admin Only)

Create a new group chat room. Requires admin role.

**Endpoint:** `POST /api/v1/rooms`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Development Team"
}
```

**Response:** `201 Created`
```json
{
  "message": "Room created successfully",
  "data": {
    "id": 5,
    "name": "Development Team",
    "type": "group",
    "display_name": "Development Team (#5)",
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid room name
- `403 Forbidden` - Not an admin
- `401 Unauthorized` - Not authenticated

**TypeScript Usage:**
```typescript
import { createRoom } from '@/lib/api/rooms';

const room = await createRoom({ name: 'Development Team' });
console.log(`Created room: ${room.name}`);
```

---

### Update Room (Admin Only)

Update an existing room's name. Requires admin role.

**Endpoint:** `PUT /api/v1/rooms/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Dev Team - Updated"
}
```

**Response:** `200 OK`
```json
{
  "message": "Room updated successfully",
  "data": {
    "id": 5,
    "name": "Dev Team - Updated",
    "type": "group",
    "display_name": "Dev Team - Updated (#5)",
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T15:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid room name
- `403 Forbidden` - Not an admin
- `404 Not Found` - Room doesn't exist

**TypeScript Usage:**
```typescript
import { updateRoom } from '@/lib/api/rooms';

const updated = await updateRoom(5, { name: 'Dev Team - Updated' });
console.log(`Room renamed to: ${updated.name}`);
```

---

### Delete Room (Admin Only)

Soft delete a room. Requires admin role.

**Endpoint:** `DELETE /api/v1/rooms/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Room deleted successfully",
  "data": null
}
```

**Error Responses:**
- `403 Forbidden` - Not an admin
- `404 Not Found` - Room doesn't exist

**TypeScript Usage:**
```typescript
import { deleteRoom } from '@/lib/api/rooms';

await deleteRoom(5);
console.log('Room deleted successfully');
```

---

## Direct Message Endpoints

### Get Direct Rooms

Get all direct message rooms for the authenticated user, including unread counts and last message info.

**Endpoint:** `GET /api/v1/rooms/direct`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Direct rooms retrieved successfully",
  "data": [
    {
      "id": 10,
      "name": "alice_bob",
      "type": "direct",
      "display_name": "Bob",
      "other_user": {
        "id": 5,
        "username": "bob",
        "is_online": true,
        "last_active_at": "2024-01-15T16:00:00Z"
      },
      "last_message": {
        "content": "Hey, how are you?",
        "created_at": "2024-01-15T15:45:00Z"
      },
      "unread_count": 3,
      "created_at": "2024-01-14T10:00:00Z"
    }
  ]
}
```

**TypeScript Usage:**
```typescript
import { getDirectRooms } from '@/lib/api/rooms';

const dms = await getDirectRooms();
dms.forEach(dm => {
  console.log(`${dm.other_user.username}: ${dm.unread_count} unread`);
  if (dm.last_message) {
    console.log(`Last: ${dm.last_message.content}`);
  }
});
```

---

### Create Direct Room

Create a new direct message room with another user, or get existing room if it already exists.

**Endpoint:** `POST /api/v1/rooms/direct`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "target_user_id": 5
}
```

**Response:** `200 OK` (if exists) or `201 Created` (if new)
```json
{
  "message": "Direct room created" // or "Direct room already exists",
  "data": {
    "id": 10,
    "name": "alice_bob",
    "type": "direct",
    "display_name": "alice_bob (#10)",
    "members": [
      {
        "id": 2,
        "username": "alice",
        "email": "alice@example.com",
        "role": "user"
      },
      {
        "id": 5,
        "username": "bob",
        "email": "bob@example.com",
        "role": "user"
      }
    ],
    "created_at": "2024-01-15T16:00:00Z",
    "updated_at": "2024-01-15T16:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid user ID or trying to DM yourself
- `404 Not Found` - Target user doesn't exist
- `401 Unauthorized` - Not authenticated

**TypeScript Usage:**
```typescript
import { createDirectRoom } from '@/lib/api/rooms';

const dm = await createDirectRoom(5);
console.log(`DM room created: ${dm.name}`);
```

---

## Room Membership

### Get Room Participants

Get all participants/members of a room.

**Endpoint:** `GET /api/v1/rooms/:id/participants`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Participants retrieved successfully",
  "data": [
    {
      "id": 1,
      "username": "alice",
      "role": "owner",
      "is_online": true,
      "joined_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "username": "bob",
      "role": "member",
      "is_online": false,
      "joined_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**TypeScript Usage:**
```typescript
import { getRoomParticipants } from '@/lib/api/rooms';

const participants = await getRoomParticipants(1);
participants.forEach(p => {
  console.log(`${p.username} (${p.role}) - ${p.is_online ? 'online' : 'offline'}`);
});
```

---

### Invite User to Room

Invite a user to join a room. Requires admin or owner role.

**Endpoint:** `POST /api/v1/rooms/:id/members`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "user_id": 7,
  "role": "member" // Optional: "member", "admin", or "owner"
}
```

**Response:** `201 Created`
```json
{
  "message": "User invited to room successfully",
  "data": {
    "id": 15,
    "user_id": 7,
    "room_id": 1,
    "role": "member",
    "joined_at": "2024-01-15T16:30:00Z",
    "user": {
      "id": 7,
      "username": "charlie",
      "email": "charlie@example.com"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - User already in room or invalid role
- `403 Forbidden` - Not admin/owner
- `404 Not Found` - Room or user doesn't exist

**TypeScript Usage:**
```typescript
import { inviteUserToRoom } from '@/lib/api/rooms';

await inviteUserToRoom(1, { user_id: 7, role: 'member' });
console.log('User invited successfully');
```

---

### Remove User from Room

Remove a user from a room. Requires admin/owner role to remove others. Any user can leave (remove themselves).

**Endpoint:** `DELETE /api/v1/rooms/:id/members/:userId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "User removed from room successfully",
  "data": null
}
```

**Error Responses:**
- `403 Forbidden` - Not allowed to remove this user
- `404 Not Found` - User not in room
- `400 Bad Request` - Cannot remove only owner

**TypeScript Usage:**
```typescript
import { removeUserFromRoom } from '@/lib/api/rooms';

// Remove another user (requires admin/owner)
await removeUserFromRoom(1, 7);

// Leave room (remove yourself)
await removeUserFromRoom(1, currentUserId);
```

---

## Room Actions

### Mark Room as Read

Mark all messages in a room as read for the current user.

**Endpoint:** `POST /api/v1/rooms/:id/read`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Room marked as read successfully",
  "data": null
}
```

**TypeScript Usage:**
```typescript
import { markRoomAsRead } from '@/lib/api/rooms';

await markRoomAsRead(1);
console.log('Room marked as read');
```

---

## Data Models

### Room

```typescript
interface Room {
  id: number;
  name: string;
  type: 'group' | 'direct';
  display_name?: string;     // "Name (#ID)"
  messages?: Message[];       // Optional, included with ?include=messages
  members?: User[];           // Optional, included with ?include=members
  created_at: string;         // ISO 8601 datetime
  updated_at: string;         // ISO 8601 datetime
}
```

### DirectRoomResponse

```typescript
interface DirectRoomResponse {
  id: number;
  name: string;
  type: 'direct';
  display_name: string;
  other_user: OtherUserInfo;
  last_message?: LastMessageInfo;
  unread_count: number;
  created_at: string;
}

interface OtherUserInfo {
  id: number;
  username: string;
  is_online: boolean;
  last_active_at?: string;
}

interface LastMessageInfo {
  content: string;
  created_at: string;
}
```

### ParticipantResponse

```typescript
interface ParticipantResponse {
  id: number;
  username: string;
  role: string;              // "owner" | "admin" | "member"
  is_online: boolean;
  joined_at: string;         // ISO 8601 datetime
}
```

---

## Error Handling

### Common Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Usage Examples

### Fetch and Display All Rooms

```typescript
import { getRooms } from '@/lib/api/rooms';

async function loadRooms() {
  try {
    const rooms = await getRooms();

    const groupRooms = rooms.filter(r => r.type === 'group');
    const directRooms = rooms.filter(r => r.type === 'direct');

    console.log(`Group Rooms: ${groupRooms.length}`);
    console.log(`Direct Messages: ${directRooms.length}`);
  } catch (error) {
    console.error('Failed to load rooms:', error);
  }
}
```

### Create and Join a Direct Message

```typescript
import { createDirectRoom } from '@/lib/api/rooms';

async function startChat(targetUserId: number) {
  try {
    const dm = await createDirectRoom(targetUserId);
    console.log(`Chat room created: ${dm.name}`);
    router.push(`/chat/${dm.id}`);
  } catch (error: any) {
    if (error.response?.status === 400) {
      alert('Cannot start chat with this user');
    }
  }
}
```

### Display DMs with Unread Counts

```typescript
import { useState, useEffect } from 'react';
import { getDirectRooms, DirectRoomResponse } from '@/lib/api/rooms';

function DirectMessagesList() {
  const [dms, setDms] = useState<DirectRoomResponse[]>([]);

  useEffect(() => {
    const loadDMs = async () => {
      const data = await getDirectRooms();
      setDms(data);
    };
    loadDMs();
  }, []);

  return (
    <div>
      {dms.map(dm => (
        <div key={dm.id}>
          <span>{dm.other_user.username}</span>
          {dm.other_user.is_online && <span>🟢</span>}
          {dm.unread_count > 0 && (
            <span className="badge">{dm.unread_count}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Admin Room Management

```typescript
import { createRoom, updateRoom, deleteRoom } from '@/lib/api/rooms';

async function manageRoom() {
  // Create room (admin only)
  const room = await createRoom({ name: 'New Team Room' });
  console.log(`Created: ${room.id}`);

  // Update room name
  const updated = await updateRoom(room.id, { name: 'Updated Name' });
  console.log(`Updated: ${updated.name}`);

  // Delete room
  await deleteRoom(room.id);
  console.log('Room deleted');
}
```

### Mark Room as Read When Opened

```typescript
import { markRoomAsRead } from '@/lib/api/rooms';

function ChatRoomPage({ roomId }: { roomId: number }) {
  useEffect(() => {
    // Mark room as read when user opens it
    markRoomAsRead(roomId);
  }, [roomId]);

  // ... render chat
}
```

---

## Implementation Status

✅ **Fully Implemented:**
- Get All Rooms
- Get Room by ID
- Create Room (admin)
- Update Room (admin)
- Delete Room (admin)
- Get Direct Rooms
- Create Direct Room
- Get Room Participants
- Invite User to Room
- Remove User from Room
- Mark Room as Read

✅ **Frontend Integration:**
- Room API service layer (`lib/api/rooms.ts`)
- Complete TypeScript type definitions
- Comprehensive error handling
- Helper functions (isRoomMember)

---

## Testing

### Test with cURL

```bash
# Get all rooms
curl http://localhost:8080/api/v1/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create room (admin)
curl -X POST http://localhost:8080/api/v1/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room"}'

# Get direct messages
curl http://localhost:8080/api/v1/rooms/direct \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create DM
curl -X POST http://localhost:8080/api/v1/rooms/direct \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id":5}'

# Mark room as read
curl -X POST http://localhost:8080/api/v1/rooms/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- Room names can be duplicated (distinguished by ID)
- Direct message rooms are named after usernames (sorted alphabetically)
- Soft delete is used - deleted rooms remain in database but marked as deleted
- Unread counts are automatically calculated by the backend
- Admin role required for create/update/delete group rooms
- Any user can create direct message rooms
- Last message info is only available for direct rooms endpoint
