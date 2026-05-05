/**
 * useWebSocket Hook
 * =================
 * React hook for managing WebSocket connections with automatic reconnection.
 * Provides real-time updates from ESP32 devices.
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'sensor_update' | 'alert' | 'status_change' | 'device_blocked' | 'connection_established' | 'ping';
  device_id?: string;
  organization_id?: string;
  data?: any;
  alert?: any;
  info?: any;
  message?: string;
  timestamp: string;
}

export interface UseWebSocketOptions {
  deviceId?: string;
  organizationId?: string;
  token?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: string) => void;
  reconnect: () => void;
  disconnect: () => void;
  connectionAttempts: number;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    deviceId,
    organizationId,
    token,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  // Build WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    let url = '';
    if (deviceId) {
      url = `${protocol}//${host}/ws/devices/${deviceId}`;
    } else if (organizationId) {
      url = `${protocol}//${host}/ws/organizations/${organizationId}`;
    } else {
      throw new Error('Either deviceId or organizationId must be provided');
    }

    // Add token if provided
    if (token) {
      url += `?token=${token}`;
    }

    return url;
  }, [deviceId, organizationId, token]);

  // Send ping to keep connection alive
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 25000); // Send ping every 25 seconds
  }, []);

  // Stop ping interval
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const url = getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', url);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionAttempts(0);
        startPingInterval();
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle pong response
          if (message.type === 'ping') {
            // Just keep connection alive, no action needed
            return;
          }

          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        stopPingInterval();
        onDisconnect?.();

        // Attempt reconnection
        if (shouldReconnectRef.current && autoReconnect) {
          if (connectionAttempts < maxReconnectAttempts) {
            const delay = Math.min(
              reconnectInterval * Math.pow(1.5, connectionAttempts),
              30000
            ); // Exponential backoff, max 30 seconds

            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              setConnectionAttempts((prev) => prev + 1);
              connect();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached');
          }
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [
    getWebSocketUrl,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    connectionAttempts,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    startPingInterval,
    stopPingInterval,
  ]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionAttempts(0);
    connect();
  }, [connect]);

  // Disconnect
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    stopPingInterval();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [stopPingInterval]);

  // Connect on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect,
    disconnect,
    connectionAttempts,
  };
}
