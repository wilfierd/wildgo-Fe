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
    baseURL = 'http://localhost:8080',
    autoReconnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const clientRef = useRef<WebSocketClient | null>(null);
  const previousRoomRef = useRef<number | null>(null);

  /**
   * Initialize WebSocket client
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, WebSocket not initialized');
      return;
    }

    // Create WebSocket client
    const client = new WebSocketClient(baseURL, token);
    clientRef.current = client;

    // Setup event handlers
    client.onConnect(() => {
      setIsConnected(true);
      setIsReconnecting(false);
      onConnect?.();
    });

    client.onDisconnect(() => {
      setIsConnected(false);
      onDisconnect?.();
    });

    client.onError((error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    });

    // Handle incoming messages
    client.on('message', (msg: WSMessage) => {
      if (msg.content && typeof msg.content === 'object') {
        const message = msg.content as Message;
        setMessages(prev => [...prev, message]);
      }
    });

    // Connect to WebSocket
    client.connect().catch(error => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Cleanup on unmount
    return () => {
      if (previousRoomRef.current !== null) {
        client.leaveRoom(previousRoomRef.current);
      }
      client.disconnect();
    };
  }, [baseURL, onConnect, onDisconnect, onError]);

  /**
   * Join/leave rooms when roomId changes
   */
  useEffect(() => {
    if (!clientRef.current) return;

    // Leave previous room if any
    if (previousRoomRef.current !== null) {
      clientRef.current.leaveRoom(previousRoomRef.current);
    }

    // Join new room if specified
    if (roomId !== null) {
      clientRef.current.joinRoom(roomId);
      previousRoomRef.current = roomId;
    }

    return () => {
      if (roomId !== null && clientRef.current) {
        clientRef.current.leaveRoom(roomId);
      }
    };
  }, [roomId]);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((isTyping: boolean) => {
    if (clientRef.current && roomId !== null) {
      clientRef.current.sendTyping(roomId, isTyping);
    }
  }, [roomId]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (clientRef.current) {
      setIsReconnecting(true);
      clientRef.current.disconnect();

      const token = localStorage.getItem('token');
      if (token) {
        const client = new WebSocketClient(baseURL, token);
        clientRef.current = client;

        client.connect().then(() => {
          setIsConnected(true);
          setIsReconnecting(false);

          if (roomId !== null) {
            client.joinRoom(roomId);
          }
        });
      }
    }
  }, [baseURL, roomId]);

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
    client: clientRef.current
  };
}

/**
 * Hook for listening to typing indicators in a room
 *
 * @param roomId - Room ID to monitor
 * @returns Array of user IDs currently typing
 *
 * @example
 * ```tsx
 * function TypingIndicator({ roomId }: { roomId: number }) {
 *   const typingUsers = useTypingIndicator(roomId);
 *
 *   if (typingUsers.length === 0) return null;
 *
 *   return <div>{typingUsers.length} users typing...</div>;
 * }
 * ```
 */
export function useTypingIndicator(roomId: number | null): number[] {
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || roomId === null) return;

    const client = new WebSocketClient('http://localhost:8080', token);

    client.on('typing', (msg: WSMessage) => {
      if (msg.room_id !== roomId) return;

      const userId = msg.user_id;
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
    });

    client.connect().then(() => {
      client.joinRoom(roomId);
    });

    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();

      client.leaveRoom(roomId);
      client.disconnect();
    };
  }, [roomId]);

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
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new WebSocketClient('http://localhost:8080', token);

    client.on('join', (msg: WSMessage) => {
      const userId = msg.user_id;
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    client.on('leave', (msg: WSMessage) => {
      const userId = msg.user_id;
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  return onlineUsers;
}
