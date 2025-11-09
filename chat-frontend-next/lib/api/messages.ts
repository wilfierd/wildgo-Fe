/**
 * Message API Service
 *
 * This module provides message-related API calls to the backend.
 * All endpoints are prefixed with /api/v1
 *
 * Available endpoints:
 * - GET /api/v1/rooms/:roomId/messages - Get messages for a room (with pagination)
 * - POST /api/v1/messages - Send new message
 * - PUT /api/v1/messages/:id - Update/edit message
 * - DELETE /api/v1/messages/:id - Delete message
 */

import api from '../api';
import { User } from '../types';

/**
 * Message Types
 */
export interface Message {
  id: number;
  content: string;
  user_id: number;
  user: User;
  room_id: number;
  parent_id?: number;
  parent_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: PaginationInfo;
}

export interface SendMessageRequest {
  room_id: number;
  content: string;
  parent_id?: number;
}

export interface UpdateMessageRequest {
  content: string;
}

/**
 * Get messages for a specific room with pagination
 *
 * @param roomId - Room ID
 * @param page - Page number (default: 1)
 * @param limit - Messages per page (default: 50, max: 100)
 * @returns Promise with messages and pagination info
 *
 * @example
 * ```ts
 * const { messages, pagination } = await getMessages(1, 1, 50);
 * console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
 * messages.forEach(msg => console.log(`${msg.user.username}: ${msg.content}`));
 * ```
 */
export async function getMessages(
  roomId: number,
  page: number = 1,
  limit: number = 50
): Promise<MessagesResponse> {
  const response = await api.get<MessagesResponse>(
    `/v1/rooms/${roomId}/messages?page=${page}&limit=${limit}`
  );
  return response.data;
}

/**
 * Send a new message to a room
 * Supports threaded replies via parent_id
 *
 * @param data - Message data (room_id, content, optional parent_id)
 * @returns Promise with created message
 *
 * @example
 * ```ts
 * // Send regular message
 * const message = await sendMessage({
 *   room_id: 1,
 *   content: 'Hello world!'
 * });
 *
 * // Send threaded reply
 * const reply = await sendMessage({
 *   room_id: 1,
 *   content: 'This is a reply',
 *   parent_id: 123
 * });
 * ```
 */
export async function sendMessage(data: SendMessageRequest): Promise<Message> {
  const response = await api.post<{ message: string; data: Message }>('/v1/messages', data);
  return response.data.data;
}

/**
 * Update/edit an existing message
 * Only the message author can edit their messages
 *
 * @param messageId - Message ID to update
 * @param content - New message content
 * @returns Promise with updated message
 *
 * @example
 * ```ts
 * const updated = await updateMessage(123, 'Updated content');
 * console.log(`Message updated at: ${updated.updated_at}`);
 * ```
 */
export async function updateMessage(messageId: number, content: string): Promise<Message> {
  const response = await api.put<{ message: string; data: Message }>(
    `/v1/messages/${messageId}`,
    { content }
  );
  return response.data.data;
}

/**
 * Delete a message (soft delete)
 * Only the message author can delete their messages
 *
 * @param messageId - Message ID to delete
 * @returns Promise that resolves when deleted
 *
 * @example
 * ```ts
 * await deleteMessage(123);
 * console.log('Message deleted successfully');
 * ```
 */
export async function deleteMessage(messageId: number): Promise<void> {
  await api.delete(`/v1/messages/${messageId}`);
}

/**
 * Helper function to load more messages (pagination)
 * Useful for implementing infinite scroll
 *
 * @param roomId - Room ID
 * @param currentPage - Current page number
 * @param limit - Messages per page
 * @returns Promise with next page of messages and pagination info
 *
 * @example
 * ```ts
 * const [messages, setMessages] = useState<Message[]>([]);
 * const [page, setPage] = useState(1);
 *
 * const loadMore = async () => {
 *   const { messages: newMessages, pagination } = await loadMoreMessages(roomId, page + 1);
 *   setMessages([...messages, ...newMessages]);
 *   setPage(pagination.page);
 * };
 * ```
 */
export async function loadMoreMessages(
  roomId: number,
  currentPage: number,
  limit: number = 50
): Promise<MessagesResponse> {
  return getMessages(roomId, currentPage, limit);
}

/**
 * Helper function to check if message belongs to current user
 * Useful for determining if edit/delete actions should be shown
 *
 * @param message - Message to check
 * @param currentUserId - Current user's ID
 * @returns Boolean indicating if user owns the message
 *
 * @example
 * ```ts
 * const canEdit = isMessageOwner(message, currentUser.id);
 * {canEdit && <button onClick={() => editMessage(message.id)}>Edit</button>}
 * ```
 */
export function isMessageOwner(message: Message, currentUserId: number): boolean {
  return message.user_id === currentUserId;
}

/**
 * Helper function to format message timestamp
 * Converts ISO timestamp to readable format
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string
 *
 * @example
 * ```ts
 * const time = formatMessageTime(message.created_at);
 * // Returns: "2:30 PM" or "Yesterday 3:45 PM"
 * ```
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Today - show time only
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (daysDiff === 1) {
    // Yesterday
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (daysDiff < 7) {
    // This week - show day and time
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    // Older - show full date
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

/**
 * Helper function to group messages by date
 * Useful for displaying date separators in chat UI
 *
 * @param messages - Array of messages
 * @returns Object with dates as keys and messages as values
 *
 * @example
 * ```ts
 * const grouped = groupMessagesByDate(messages);
 * Object.entries(grouped).map(([date, msgs]) => (
 *   <div key={date}>
 *     <DateSeparator date={date} />
 *     {msgs.map(msg => <MessageBubble message={msg} />)}
 *   </div>
 * ))
 * ```
 */
export function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {};

  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
  });

  return groups;
}
