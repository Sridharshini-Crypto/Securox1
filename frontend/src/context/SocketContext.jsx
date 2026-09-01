import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const getWsUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
    return `ws://${host}:8000/api/security/ws`;
  }
  return 'ws://127.0.0.1:8000/api/security/ws';
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [lastEvent, setLastEvent] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('OFFLINE'); // 'CONNECTED', 'RECONNECTING', 'OFFLINE'

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectWebSocket = () => {
    if (!isAuthenticated) {
      setConnected(false);
      setConnectionState('OFFLINE');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnected(true);
        setConnectionState('CONNECTED');
        console.log(">>> WebSocket Connected to Securox SOC Stream");
      };

      ws.onmessage = (messageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(messageEvent.data);
          if (data.type !== 'HEARTBEAT_ACK') {
            setLastEvent(data);
            setRecentEvents((prev) => [data, ...prev.slice(0, 49)]);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setConnected(false);
        setConnectionState(isAuthenticated ? 'RECONNECTING' : 'OFFLINE');
        
        // Auto-reconnect after 3 seconds if user is still authenticated
        if (isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isAuthenticated) {
              connectWebSocket();
            }
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn("WebSocket stream notice:", err);
        setConnected(false);
        setConnectionState('RECONNECTING');
      };

    } catch (e) {
      console.warn("WebSocket init error:", e);
      setConnected(false);
      setConnectionState('OFFLINE');
    }
  };

  useEffect(() => {
    connectWebSocket();
    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'HEARTBEAT' }));
      }
    }, 15000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{
      connected,
      connectionState,
      lastEvent,
      recentEvents
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
