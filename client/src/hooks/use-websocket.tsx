import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

export type WebSocketMessage = {
  type: string;
  order?: any;
  booking?: any;
  message?: string;
};

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!user?.isKitchen) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("🔗 WebSocket connected");
        setIsConnected(true);
        
        // Identify as kitchen user
        ws.current?.send(JSON.stringify({
          type: 'KITCHEN_USER_CONNECT',
          userId: user.id
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("📨 Received WebSocket message:", message);
          setLastMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (user?.isKitchen) {
          reconnectTimeout.current = setTimeout(() => {
            console.log("🔄 Attempting to reconnect WebSocket...");
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
  };

  useEffect(() => {
    if (user?.isKitchen) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user?.isKitchen, user?.id]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect
  };
}