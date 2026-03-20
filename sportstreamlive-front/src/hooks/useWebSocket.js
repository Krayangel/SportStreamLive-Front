// src/hooks/useWebSocket.js
import { useCallback } from 'react';
import { wsSubscribe, wsSend } from '../services/wsClient';

export function useWebSocket() {
  const subscribe = useCallback((topic, callback) => {
    return wsSubscribe(topic, callback);
  }, []);

  const send = useCallback((destination, body) => {
    wsSend(destination, body);
  }, []);

  return { subscribe, send };
}
