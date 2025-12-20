/**
 * React Hook for WebSocket Integration
 *
 * This hook provides easy WebSocket integration in React components with:
 * - Automatic connection/disconnection on mount/unmount
 * - Room management
 * - Message subscriptions
 * - Typing indicators
 * - Connection status
 *
 * @example
 * ```tsx
 * import { useWebSocket } from '@/hooks/useWebSocket';
 *
 * function ChatRoom({ roomId }: { roomId: number }) {
 *   const { messages, sendTyping, isConnected } = useWebSocket(roomId);
 *
 *   return (
 *     <div>
 *       {isConnected ? 'Connected' : 'Disconnected'}
 *       {messages.map(msg => <Message key={msg.id} data={msg} />)}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketClient, WSMessage } from '../lib/websocket';
import { Message } from '../lib/api/messages';
import { useWebSocketContext } from '../context/WebSocketContext';

/**
 * WebSocket hook options
 */
export interface UseWebSocketOptions {
  /**
   * Base URL of the backend server
   * @default 'http://localhost:8080'
   */
  baseURL?: string;

  /**
   * Enable automatic reconnection
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Callback when connection is established
   */
  onConnect?: () => void;

  /**
   * Callback when connection is lost
   */
  onDisconnect?: () => void;

  /**
   * Callback for errors
   */
  onError?: (error: Error) => void;
}

/**
 * Hook return type
 */
export interface UseWebSocketReturn {
  /** Array of messages received via WebSocket */
  messages: Message[];

  /** Whether WebSocket is currently connected */
  isConnected: boolean;

  /** Whether WebSocket is attempting to reconnect */
  isReconnecting: boolean;

  /** Send typing indicator to current room */
  sendTyping: (isTyping: boolean) => void;

  /** Manually trigger reconnection */
  reconnect: () => void;

  /** Clear all received messages */
  clearMessages: () => void;

  /** WebSocket client instance (advanced usage) */
  client: WebSocketClient | null;
}

/**
 * React Hook for WebSocket Integration
 *
 * Manages WebSocket connection, room subscriptions, and message handling
 *
 * @param roomId - Room ID to join (optional, can be null if not in a room)
 * @param options - WebSocket options
 * @returns WebSocket state and methods
 *
 * @example
 * ```tsx
 * function ChatRoom({ roomId }: { roomId: number }) {
 *   const { messages, sendTyping, isConnected } = useWebSocket(roomId);
 *
 *   const handleTyping = () => {
 *     sendTyping(true);
 *     setTimeout(() => sendTyping(false), 1000);
 *   };
 *
 *   return (
 *     <div>
 *       <ConnectionStatus connected={isConnected} />
 *       {messages.map(msg => (
 *         <MessageBubble key={msg.id} message={msg} />
 *       ))}
 *       <input onChange={handleTyping} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useWebSocket(
  roomId: number | null = null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onConnect,
    onDisconnect,
    onError
  } = options;

  const { client, isConnected: contextIsConnected } = useWebSocketContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(contextIsConnected);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const previousRoomRef = useRef<number | null>(null);

  /**
   * Initialize WebSocket client
   */
  useEffect(() => {
    if (!client) {
      setIsConnected(false);
      return;
    }

    setIsConnected(client.isConnected());

    // Setup event handlers
    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      onConnect?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      onDisconnect?.();
    };

    const handleError = (error: Error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    const handleMessage = (msg: WSMessage) => {
      if (msg.content && typeof msg.content === 'object') {
        const message = msg.content as Message;
        setMessages(prev => [...prev, message]);
      }
    };

    client.onConnect(handleConnect);
    client.onDisconnect(handleDisconnect);
    client.onError(handleError);
    client.on('message', handleMessage);

    // If already connected, trigger connect handler
    if (client.isConnected()) {
      handleConnect();
    }

    return () => {
      client.off('message', handleMessage);
      client.offConnect(handleConnect);
      client.offDisconnect(handleDisconnect);
      client.offError(handleError);
    };
  }, [client, onConnect, onDisconnect, onError]);

  /**
   * Join/leave rooms when roomId changes
   */
  useEffect(() => {
    if (!client) return;

    // Leave previous room if any
    if (previousRoomRef.current !== null) {
      client.leaveRoom(previousRoomRef.current);
    }

    // Join new room if specified
    if (roomId !== null) {
      client.joinRoom(roomId);
      previousRoomRef.current = roomId;
    }

    return () => {
      if (roomId !== null && client) {
        client.leaveRoom(roomId);
      }
    };
  }, [roomId, client]);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((isTyping: boolean) => {
    if (client && roomId !== null) {
      client.sendTyping(roomId, isTyping);
    }
  }, [roomId, client]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (client) {
      setIsReconnecting(true);
      client.disconnect();
      client.connect().catch(console.error);
    }
  }, [client]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isConnected,
    isReconnecting,
    sendTyping,
    reconnect,
    clearMessages,
    client
  };
}

/**
 * Hook for listening to typing indicators in a room
 *
 * @param roomId - Room ID to monitor
 * @param currentUserId - Current user ID to filter self-typing
 * @returns Array of user IDs currently typing
 *
 * @example
 * ```tsx
 * function TypingIndicator({ roomId, currentUserId }: { roomId: number, currentUserId: number }) {
 *   const typingUsers = useTypingIndicator(roomId, currentUserId);
 *
 *   if (typingUsers.length === 0) return null;
 *
 *   return <div>{typingUsers.length} users typing...</div>;
 * }
 * ```
 */
export function useTypingIndicator(roomId: number | null, currentUserId?: number): number[] {
  const { client } = useWebSocketContext();
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!client || roomId === null) return;

    // Join the room to listen for events
    client.joinRoom(roomId);

    const handleTyping = (msg: WSMessage) => {
      if (msg.room_id !== roomId) return;

      const userId = msg.user_id;

      // Filter out self-typing if currentUserId is provided
      if (currentUserId && userId === currentUserId) return;

      const isTyping = msg.content?.typing === true;

      if (isTyping) {
        // Add user to typing list
        setTypingUsers(prev => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });

        // Clear existing timeout
        const existingTimeout = timeoutsRef.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set timeout to remove user after 3 seconds of no activity
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== userId));
          timeoutsRef.current.delete(userId);
        }, 3000);

        timeoutsRef.current.set(userId, timeout);
      } else {
        // User stopped typing
        setTypingUsers(prev => prev.filter(id => id !== userId));

        const timeout = timeoutsRef.current.get(userId);
        if (timeout) {
          clearTimeout(timeout);
          timeoutsRef.current.delete(userId);
        }
      }
    };

    client.on('typing', handleTyping);

    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();

      client.off('typing', handleTyping);
      client.leaveRoom(roomId);
    };
  }, [roomId, client, currentUserId]);

  return typingUsers;
}

/**
 * Hook for monitoring online users
 *
 * @returns Array of online user IDs
 *
 * @example
 * ```tsx
 * function OnlineUsersList() {
 *   const onlineUsers = useOnlineUsers();
 *
 *   return (
 *     <div>
 *       {onlineUsers.length} users online
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineUsers(): number[] {
  const { client } = useWebSocketContext();
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  useEffect(() => {
    if (!client) return;

    const handleJoin = (msg: WSMessage) => {
      const userId = msg.user_id;
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    };

    const handleLeave = (msg: WSMessage) => {
      const userId = msg.user_id;
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    };

    client.on('join', handleJoin);
    client.on('leave', handleLeave);

    return () => {
      client.off('join', handleJoin);
      client.off('leave', handleLeave);
    };
  }, [client]);

  return onlineUsers;
}
