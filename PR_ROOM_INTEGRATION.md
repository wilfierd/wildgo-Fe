# PR #2: Room API Integration

## Overview

This PR implements **complete room API integration** between the Next.js frontend and the Go backend, enabling full room management, direct messaging, and participant features.

**Related Issue:** Frontend-Backend Integration Plan (Phase 1, Steps 1-2)
**Branch:** `claude/room-api-integration-011CUwcs1W9GDV8kiXTWgQkD`
**Base:** `claude/auth-api-integration-011CUwcs1W9GDV8kiXTWgQkD`
**Depends on:** PR #1 (Authentication API Integration)

---

## What's Changed

### 🎯 New Features

1. **Complete Room API Service Layer** (`lib/api/rooms.ts`)
   - ✅ Get All Rooms
   - ✅ Get Room by ID
   - ✅ Create Room (admin only)
   - ✅ Update Room (admin only)
   - ✅ Delete Room (admin only)
   - ✅ Get Direct Message Rooms
   - ✅ Create/Get Direct Room
   - ✅ Get Room Participants
   - ✅ Invite User to Room
   - ✅ Remove User from Room
   - ✅ Mark Room as Read
   - ✅ Helper: Check if user is room member

2. **Enhanced API Module Exports** (`lib/api/index.ts`)
   - ✅ Export room service alongside auth service
   - ✅ Convenient re-exports for all functions

3. **Comprehensive Room API Documentation** (`docs/API_ROOMS.md`)
   - ✅ All 11 endpoints documented
   - ✅ Request/response examples
   - ✅ TypeScript usage examples
   - ✅ Error handling guide
   - ✅ Testing instructions

---

## Files Changed

### New Files
- ✅ `chat-frontend-next/lib/api/rooms.ts` - Room API service (NEW)
- ✅ `docs/API_ROOMS.md` - Room API documentation (NEW)
- ✅ `PR_ROOM_INTEGRATION.md` - This PR description (NEW)

### Modified Files
- ✅ `chat-frontend-next/lib/api/index.ts` - Added room exports

---

## Implementation Details

### Architecture

```
Frontend (Next.js)
├── lib/api/
│   ├── auth.ts        # Auth service (from PR #1)
│   ├── rooms.ts       # Room service (NEW)
│   ├── index.ts       # API exports (UPDATED)
│   └── api.ts         # Axios config (existing)
```

### API Endpoints Implemented

All endpoints match the backend API structure:

| Endpoint | Method | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/v1/rooms` | GET | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id` | GET | ✅ | ✅ | Implemented |
| `/api/v1/rooms` | POST | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id` | PUT | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id` | DELETE | ✅ | ✅ | Implemented |
| `/api/v1/rooms/direct` | GET | ✅ | ✅ | Implemented |
| `/api/v1/rooms/direct` | POST | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id/participants` | GET | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id/members` | POST | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id/members/:userId` | DELETE | ✅ | ✅ | Implemented |
| `/api/v1/rooms/:id/read` | POST | ✅ | ✅ | Implemented |

---

## Code Examples

### Fetch All Rooms
```typescript
import { getRooms } from '@/lib/api/rooms';

const rooms = await getRooms();
console.log(`You have ${rooms.length} rooms`);
```

### Get Direct Messages with Unread Counts
```typescript
import { getDirectRooms } from '@/lib/api/rooms';

const dms = await getDirectRooms();
dms.forEach(dm => {
  console.log(`${dm.other_user.username}: ${dm.unread_count} unread`);
  if (dm.other_user.is_online) {
    console.log('  (online now)');
  }
});
```

### Create Direct Message
```typescript
import { createDirectRoom } from '@/lib/api/rooms';

// Creates new DM or returns existing
const dm = await createDirectRoom(targetUserId);
router.push(`/chat/${dm.id}`);
```

### Admin Room Management
```typescript
import { createRoom, updateRoom, deleteRoom } from '@/lib/api/rooms';

// Create room
const room = await createRoom({ name: 'Dev Team' });

// Update room
const updated = await updateRoom(room.id, { name: 'Development Team' });

// Delete room
await deleteRoom(room.id);
```

### Mark Room as Read
```typescript
import { markRoomAsRead } from '@/lib/api/rooms';

useEffect(() => {
  // Mark room as read when user opens it
  markRoomAsRead(roomId);
}, [roomId]);
```

---

## Type Definitions

### Room Types

```typescript
interface Room {
  id: number;
  name: string;
  type: 'group' | 'direct';
  display_name?: string;
  created_at: string;
  updated_at: string;
}

interface DirectRoomResponse {
  id: number;
  name: string;
  type: 'direct';
  display_name: string;
  other_user: {
    id: number;
    username: string;
    is_online: boolean;
    last_active_at?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
  created_at: string;
}

interface ParticipantResponse {
  id: number;
  username: string;
  role: string;  // "owner" | "admin" | "member"
  is_online: boolean;
  joined_at: string;
}
```

---

## Testing

### Manual Testing Steps

1. **Start Backend Server**
   ```bash
   cd /path/to/windgo-chat/chat-backend-go
   go run main.go
   ```

2. **Test Room Fetching**
   ```typescript
   import { getRooms } from '@/lib/api/rooms';
   const rooms = await getRooms();
   ```

3. **Test Direct Messages**
   ```typescript
   import { getDirectRooms, createDirectRoom } from '@/lib/api/rooms';

   // Get all DMs
   const dms = await getDirectRooms();

   // Create new DM
   const dm = await createDirectRoom(2); // DM with user ID 2
   ```

4. **Test Admin Functions** (requires admin account)
   ```typescript
   import { createRoom, updateRoom, deleteRoom } from '@/lib/api/rooms';

   const room = await createRoom({ name: 'Test Room' });
   const updated = await updateRoom(room.id, { name: 'Updated' });
   await deleteRoom(room.id);
   ```

### API Testing (curl)

```bash
# Get all rooms
curl http://localhost:8080/api/v1/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get direct messages
curl http://localhost:8080/api/v1/rooms/direct \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create DM
curl -X POST http://localhost:8080/api/v1/rooms/direct \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id":2}'

# Get room participants
curl http://localhost:8080/api/v1/rooms/1/participants \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark room as read
curl -X POST http://localhost:8080/api/v1/rooms/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Benefits

### 1. **Complete Room Management**
- Full CRUD operations for rooms
- Admin-only restrictions properly enforced
- Soft delete support

### 2. **Direct Messaging Support**
- List all DMs with unread counts
- Automatic DM creation or retrieval
- Online status indicators
- Last message preview

### 3. **Room Membership**
- View all participants
- Invite users to rooms
- Remove users or leave rooms
- Role-based permissions

### 4. **Real-time Ready**
- Mark as read functionality
- Unread count tracking
- Prepared for WebSocket integration

### 5. **Type Safety**
- Full TypeScript support
- Proper interfaces for all data types
- Auto-completion in IDEs

---

## Integration with UI (Next Steps)

This PR provides the API layer. Future PRs will update UI components:

### Chat Page Updates (Upcoming)
```typescript
// Before: Mock data
const mockChats = [/* hardcoded */];

// After: Real API calls
const rooms = await getRooms();
const dms = await getDirectRooms();
```

### Direct Message List
```typescript
function DirectMessagesList() {
  const [dms, setDms] = useState<DirectRoomResponse[]>([]);

  useEffect(() => {
    getDirectRooms().then(setDms);
  }, []);

  return (
    <>
      {dms.map(dm => (
        <DMCard
          key={dm.id}
          user={dm.other_user}
          unreadCount={dm.unread_count}
          lastMessage={dm.last_message}
        />
      ))}
    </>
  );
}
```

---

## What's Next (PR #3)

The next PR will implement **Message Endpoints**:
- ✅ GET `/api/v1/rooms/:roomId/messages` - Fetch messages
- ✅ POST `/api/v1/messages` - Send message
- ✅ PUT `/api/v1/messages/:id` - Edit message
- ✅ DELETE `/api/v1/messages/:id` - Delete message
- ✅ Support for pagination
- ✅ Support for threaded messages (parent_id)

---

## Checklist

- ✅ Code follows project conventions
- ✅ All functions have JSDoc comments
- ✅ TypeScript types are properly defined
- ✅ Error handling is implemented
- ✅ API documentation is complete
- ✅ Matches backend API implementation
- ✅ No breaking changes
- ✅ Clean git history
- ✅ PR description is comprehensive

---

## Breaking Changes

**None.** This PR is fully backward compatible and additive only.

---

## Notes

- Backend must be running on `http://localhost:8080` for API calls to work
- Room names can be duplicated (distinguished by ID)
- Direct message rooms are automatically named after sorted usernames
- Soft delete is used for room deletion
- Unread counts are calculated by the backend
- Admin role required for create/update/delete group rooms

---

## Comparison with CLI

This implementation matches the CLI's room functionality:

| Feature | CLI | Frontend (This PR) |
|---------|-----|-------------------|
| List rooms | ✅ | ✅ |
| Get room details | ✅ | ✅ |
| Create room (admin) | ✅ | ✅ |
| Update room (admin) | ✅ | ✅ |
| Delete room (admin) | ✅ | ✅ |
| List DMs | ✅ | ✅ |
| Create DM | ✅ | ✅ |
| View participants | ✅ | ✅ |
| Invite user | ✅ | ✅ |
| Remove user | ✅ | ✅ |
| Mark as read | ✅ | ✅ |
| Unread counts | ✅ | ✅ |
| Online status | ✅ | ✅ |

---

## Related PRs

- **PR #1:** Authentication API Integration ✅ (merged/completed)
- **PR #3:** Message Endpoints Integration (upcoming)
- **PR #4:** WebSocket Integration (upcoming)

---

## Author

Claude (AI Assistant)

## Review Checklist for Maintainers

- [ ] Code quality is acceptable
- [ ] Documentation is clear and complete
- [ ] API endpoints match backend implementation
- [ ] Error handling is robust
- [ ] TypeScript types are correct
- [ ] No security issues
- [ ] Follows project conventions
