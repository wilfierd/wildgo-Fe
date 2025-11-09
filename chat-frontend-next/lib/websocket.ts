/**
 * WebSocket Client for Real-Time Communication
 *
 * This module provides a WebSocket client for real-time chat features including:
 * - Real-time message delivery
 * - Typing indicators
 * - Online status updates
 * - Room join/leave notifications
 * - Automatic reconnection with exponential backoff
 *
 * @example
 * ```ts
 * import { WebSocketClient } from '@/lib/websocket';
 *
 * const ws = new WebSocketClient('http://localhost:8080', token);
 * ws.connect();
 *
 * ws.on('message', (msg) => {
 *   console.log('New message:', msg);
 * });
 *
 * ws.joinRoom(roomId);
 * ```
 */

export interface WSMessage {
  type: 'message' | 'typing' | 'join' | 'leave' | 'error';
  room_id: number;
  user_id: number;
  content: any;
  timestamp?: string;
}

export type WSMessageHandler = (message: WSMessage) => void;
export type WSErrorHandler = (error: Error) => void;
export type WSConnectionHandler = () => void;

/**
 * WebSocket Client Class
 *
 * Manages WebSocket connection with automatic reconnection,
 * message handling, and room management.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private baseURL: string;
  private token: string;
  private connected: boolean = false;
  private reconnecting: boolean = false;
  private manualDisconnect: boolean = false;
  private reconnectDelay: number = 5000; // Start with 5 seconds
  private maxReconnectDelay: number = 60000; // Max 60 seconds
  private currentRooms: Set<number> = new Set();
  private reconnectAttempts: number = 0;

  // Event handlers
  private messageHandlers: Map<string, Set<WSMessageHandler>> = new Map();
  private errorHandlers: Set<WSErrorHandler> = new Set();
  private connectHandlers: Set<WSConnectionHandler> = new Set();
  private disconnectHandlers: Set<WSConnectionHandler> = new Set();

  /**
   * Create a new WebSocket client
   *
   * @param baseURL - Base URL of the backend (e.g., 'http://localhost:8080')
   * @param token - JWT authentication token
   *
   * @example
   * ```ts
   * const ws = new WebSocketClient('http://localhost:8080', userToken);
   * ```
   */
  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  /**
   * Connect to WebSocket server
   *
   * @returns Promise that resolves when connected
   *
   * @example
   * ```ts
   * await ws.connect();
   * console.log('Connected to WebSocket');
   * ```
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      // Convert http/https to ws/wss
      const wsURL = this.baseURL
        .replace('http://', 'ws://')
        .replace('https://', 'wss://');

      const url = `${wsURL}/ws?token=${encodeURIComponent(this.token)}`;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 5000; // Reset delay on successful connection
          console.log('WebSocket connected');

          // Rejoin all previously joined rooms
          this.currentRooms.forEach(roomId => {
            this.joinRoom(roomId);
          });

          // Notify connect handlers
          this.connectHandlers.forEach(handler => handler());

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          const error = new Error('WebSocket connection error');
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.connected = false;

          // Notify disconnect handlers
          this.disconnectHandlers.forEach(handler => handler());

          // Attempt to reconnect if not manual disconnect
          if (!this.manualDisconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   *
   * @example
   * ```ts
   * ws.disconnect();
   * ```
   */
  public disconnect(): void {
    this.manualDisconnect = true;
    this.connected = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is currently connected
   *
   * @returns Boolean indicating connection status
   *
   * @example
   * ```ts
   * if (ws.isConnected()) {
   *   console.log('Connected');
   * }
   * ```
   */
  public isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Join a chat room
   *
   * @param roomId - Room ID to join
   *
   * @example
   * ```ts
   * ws.joinRoom(1);
   * ```
   */
  public joinRoom(roomId: number): void {
    this.currentRooms.add(roomId);

    if (this.isConnected()) {
      this.send({
        type: 'join',
        room_id: roomId,
        user_id: 0, // Will be set by server
        content: { room_id: roomId }
      });
    }
  }

  /**
   * Leave a chat room
   *
   * @param roomId - Room ID to leave
   *
   * @example
   * ```ts
   * ws.leaveRoom(1);
   * ```
   */
  public leaveRoom(roomId: number): void {
    this.currentRooms.delete(roomId);

    if (this.isConnected()) {
      this.send({
        type: 'leave',
        room_id: roomId,
        user_id: 0, // Will be set by server
        content: { room_id: roomId }
      });
    }
  }

  /**
   * Send typing indicator to a room
   *
   * @param roomId - Room ID
   * @param isTyping - Whether user is typing
   *
   * @example
   * ```ts
   * // User started typing
   * ws.sendTyping(1, true);
   *
   * // User stopped typing
   * ws.sendTyping(1, false);
   * ```
   */
  public sendTyping(roomId: number, isTyping: boolean): void {
    if (this.isConnected()) {
      this.send({
        type: 'typing',
        room_id: roomId,
        user_id: 0, // Will be set by server
        content: { typing: isTyping }
      });
    }
  }

  /**
   * Register handler for specific message type
   *
   * @param type - Message type to listen for
   * @param handler - Handler function
   *
   * @example
   * ```ts
   * ws.on('message', (msg) => {
   *   console.log('New message:', msg.content);
   * });
   *
   * ws.on('typing', (msg) => {
   *   console.log(`User ${msg.user_id} is typing`);
   * });
   * ```
   */
  public on(type: string, handler: WSMessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  /**
   * Remove handler for specific message type
   *
   * @param type - Message type
   * @param handler - Handler function to remove
   *
   * @example
   * ```ts
   * const handler = (msg) => console.log(msg);
   * ws.on('message', handler);
   * ws.off('message', handler);
   * ```
   */
  public off(type: string, handler: WSMessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Register error handler
   *
   * @param handler - Error handler function
   *
   * @example
   * ```ts
   * ws.onError((error) => {
   *   console.error('WebSocket error:', error);
   * });
   * ```
   */
  public onError(handler: WSErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Register connection handler
   *
   * @param handler - Connection handler function
   *
   * @example
   * ```ts
   * ws.onConnect(() => {
   *   console.log('WebSocket connected!');
   * });
   * ```
   */
  public onConnect(handler: WSConnectionHandler): void {
    this.connectHandlers.add(handler);
  }

  /**
   * Register disconnection handler
   *
   * @param handler - Disconnection handler function
   *
   * @example
   * ```ts
   * ws.onDisconnect(() => {
   *   console.log('WebSocket disconnected!');
   * });
   * ```
   */
  public onDisconnect(handler: WSConnectionHandler): void {
    this.disconnectHandlers.add(handler);
  }

  /**
   * Send message through WebSocket
   *
   * @param message - Message to send
   */
  private send(message: WSMessage): void {
    if (this.ws && this.isConnected()) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Handle incoming WebSocket message
   *
   * @param message - Received message
   */
  private handleMessage(message: WSMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Also call handlers for 'all' type
    const allHandlers = this.messageHandlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnecting || this.manualDisconnect) {
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts++;

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      if (!this.manualDisconnect) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          this.reconnecting = false;
          // Will retry on next onclose event
        });
      }
    }, delay);
  }
}

/**
 * Create and export a singleton WebSocket client instance
 *
 * Note: You need to initialize this with token after login
 *
 * @example
 * ```ts
 * import { createWebSocketClient } from '@/lib/websocket';
 *
 * // After login
 * const token = localStorage.getItem('token');
 * const wsClient = createWebSocketClient('http://localhost:8080', token!);
 * await wsClient.connect();
 * ```
 */
export function createWebSocketClient(baseURL: string, token: string): WebSocketClient {
  return new WebSocketClient(baseURL, token);
}
