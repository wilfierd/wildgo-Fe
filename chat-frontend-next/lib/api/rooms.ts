/**
 * Room API Service
 *
 * This module provides room-related API calls to the backend.
 * All endpoints are prefixed with /api/v1
 *
 * Available endpoints:
 * - GET /api/v1/rooms - Get all rooms for authenticated user
 * - GET /api/v1/rooms/:id - Get room by ID
 * - POST /api/v1/rooms - Create new room (admin only)
 * - PUT /api/v1/rooms/:id - Update room (admin only)
 * - DELETE /api/v1/rooms/:id - Delete room (admin only)
 * - GET /api/v1/rooms/direct - Get all direct message rooms
 * - POST /api/v1/rooms/direct - Create or get direct message room
 * - GET /api/v1/rooms/:id/participants - Get room participants
 * - POST /api/v1/rooms/:id/members - Invite user to room
 * - DELETE /api/v1/rooms/:id/members/:userId - Remove user from room
 * - POST /api/v1/rooms/:id/read - Mark room as read
 */

import api from '../api';

/**
 * Room Types
 */
export interface Room {
  id: number;
  name: string;
  type: 'group' | 'direct';
  display_name?: string;
  messages?: any[];
  members?: any[];
  created_at: string;
  updated_at: string;
}

export interface DirectRoomResponse {
  id: number;
  name: string;
  type: 'direct';
  display_name: string;
  other_user: OtherUserInfo;
  last_message?: LastMessageInfo;
  unread_count: number;
  created_at: string;
}

export interface OtherUserInfo {
  id: number;
  username: string;
  is_online: boolean;
  last_active_at?: string;
}

export interface LastMessageInfo {
  content: string;
  created_at: string;
}

export interface ParticipantResponse {
  id: number;
  username: string;
  role: string;
  is_online: boolean;
  joined_at: string;
}

export interface CreateRoomRequest {
  name: string;
}

export interface UpdateRoomRequest {
  name: string;
}

export interface CreateDirectRoomRequest {
  target_user_id: number;
}

export interface InviteUserRequest {
  user_id: number;
  role?: 'member' | 'admin' | 'owner';
}

/**
 * Get all rooms for the authenticated user
 * Returns both group rooms and direct message rooms
 *
 * @returns Promise with array of rooms
 *
 * @example
 * ```ts
 * const rooms = await getRooms();
 * console.log(`You have ${rooms.length} rooms`);
 * ```
 */
export async function getRooms(): Promise<Room[]> {
  const response = await api.get<{ data: Room[], message: string }>('/v1/rooms');
  return response.data.data;
}

/**
 * Get a specific room by ID
 *
 * @param roomId - Room ID
 * @returns Promise with room data
 *
 * @example
 * ```ts
 * const room = await getRoomById(1);
 * console.log(room.name);
 * ```
 */
export async function getRoomById(roomId: number): Promise<Room> {
  const response = await api.get<{ data: Room, message: string }>(`/v1/rooms/${roomId}`);
  return response.data.data;
}

/**
 * Create a new group room (admin only)
 *
 * @param data - Room creation data
 * @returns Promise with created room
 *
 * @example
 * ```ts
 * const room = await createRoom({ name: 'General Discussion' });
 * ```
 */
export async function createRoom(data: CreateRoomRequest): Promise<Room> {
  const response = await api.post<{ data: Room, message: string }>('/v1/rooms', data);
  return response.data.data;
}

/**
 * Update an existing room (admin only)
 *
 * @param roomId - Room ID to update
 * @param data - Updated room data
 * @returns Promise with updated room
 *
 * @example
 * ```ts
 * const room = await updateRoom(1, { name: 'New Room Name' });
 * ```
 */
export async function updateRoom(roomId: number, data: UpdateRoomRequest): Promise<Room> {
  const response = await api.put<{ data: Room, message: string }>(`/v1/rooms/${roomId}`, data);
  return response.data.data;
}

/**
 * Delete a room (admin only)
 * This is a soft delete - room is marked as deleted but not removed from database
 *
 * @param roomId - Room ID to delete
 * @returns Promise with success message
 *
 * @example
 * ```ts
 * await deleteRoom(1);
 * console.log('Room deleted successfully');
 * ```
 */
export async function deleteRoom(roomId: number): Promise<void> {
  await api.delete(`/v1/rooms/${roomId}`);
}

/**
 * Get all direct message rooms for the authenticated user
 * Includes unread counts and last message info
 *
 * @returns Promise with array of direct message rooms
 *
 * @example
 * ```ts
 * const dms = await getDirectRooms();
 * dms.forEach(dm => {
 *   console.log(`${dm.other_user.username}: ${dm.unread_count} unread`);
 * });
 * ```
 */
export async function getDirectRooms(): Promise<DirectRoomResponse[]> {
  const response = await api.get<{ data: DirectRoomResponse[], message: string }>('/v1/rooms/direct');
  return response.data.data;
}

/**
 * Create a new direct message room or get existing one
 * If a DM already exists between the two users, returns the existing room
 *
 * @param targetUserId - ID of user to create DM with
 * @returns Promise with direct message room
 *
 * @example
 * ```ts
 * const dm = await createDirectRoom(5);
 * console.log(`DM room: ${dm.name}`);
 * ```
 */
export async function createDirectRoom(targetUserId: number): Promise<Room> {
  const response = await api.post<{ data: Room, message: string }>('/v1/rooms/direct', {
    target_user_id: targetUserId
  });
  return response.data.data;
}

/**
 * Get all participants in a room
 *
 * @param roomId - Room ID
 * @returns Promise with array of participants
 *
 * @example
 * ```ts
 * const participants = await getRoomParticipants(1);
 * participants.forEach(p => {
 *   console.log(`${p.username} (${p.role}) - ${p.is_online ? 'online' : 'offline'}`);
 * });
 * ```
 */
export async function getRoomParticipants(roomId: number): Promise<ParticipantResponse[]> {
  const response = await api.get<{ data: ParticipantResponse[], message: string }>(`/v1/rooms/${roomId}/participants`);
  return response.data.data;
}

/**
 * Invite a user to join a room
 * Requires admin or owner role
 *
 * @param roomId - Room ID
 * @param data - Invite data (user_id and optional role)
 * @returns Promise with created membership
 *
 * @example
 * ```ts
 * await inviteUserToRoom(1, { user_id: 5, role: 'member' });
 * console.log('User invited successfully');
 * ```
 */
export async function inviteUserToRoom(roomId: number, data: InviteUserRequest): Promise<any> {
  const response = await api.post<{ data: any, message: string }>(`/v1/rooms/${roomId}/members`, data);
  return response.data.data;
}

/**
 * Remove a user from a room
 * Requires admin/owner role to remove others
 * Any user can leave a room (remove themselves)
 *
 * @param roomId - Room ID
 * @param userId - User ID to remove
 * @returns Promise with success message
 *
 * @example
 * ```ts
 * await removeUserFromRoom(1, 5);
 * console.log('User removed from room');
 * ```
 */
export async function removeUserFromRoom(roomId: number, userId: number): Promise<void> {
  await api.delete(`/v1/rooms/${roomId}/members/${userId}`);
}

/**
 * Mark a room as read for the current user
 * Updates the last_read timestamp to mark all messages as read
 *
 * @param roomId - Room ID to mark as read
 * @returns Promise with success message
 *
 * @example
 * ```ts
 * await markRoomAsRead(1);
 * console.log('Room marked as read');
 * ```
 */
export async function markRoomAsRead(roomId: number): Promise<void> {
  await api.post(`/v1/rooms/${roomId}/read`);
}

/**
 * Helper function to check if user is a room member
 * Useful before attempting to access room-specific features
 *
 * @param roomId - Room ID to check
 * @returns Promise with boolean indicating membership
 *
 * @example
 * ```ts
 * const isMember = await isRoomMember(1);
 * if (!isMember) {
 *   console.log('You are not a member of this room');
 * }
 * ```
 */
export async function isRoomMember(roomId: number): Promise<boolean> {
  try {
    const participants = await getRoomParticipants(roomId);
    return participants.length > 0;
  } catch (error: any) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}
