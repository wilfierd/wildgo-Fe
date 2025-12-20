"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketClient } from '../lib/websocket';
import { useAuth } from '../hooks/useAuth';

interface WebSocketContextType {
  client: WebSocketClient | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  client: null,
  isConnected: false,
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8080';

  useEffect(() => {
    let wsClient: WebSocketClient | null = null;

    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token) {
        wsClient = new WebSocketClient(baseURL, token);
        setClient(wsClient);

        // Listen to connection status changes
        wsClient.onConnect(() => setIsConnected(true));
        wsClient.onDisconnect(() => setIsConnected(false));

        wsClient.connect().catch(console.error);
      }
    } else {
      setClient(null);
      setIsConnected(false);
    }

    return () => {
      if (wsClient) {
        wsClient.disconnect();
      }
    };
  }, [isAuthenticated, user, baseURL]);

  return (
    <WebSocketContext.Provider value={{ client, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocketContext = () => useContext(WebSocketContext);
