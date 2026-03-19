// src/hooks/useWebSocket.js
// Hook que gestiona la conexión STOMP sobre SockJS.
// Se conecta UNA sola vez y expone subscribe/send.

import { useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../config';
import { getToken } from '../services/authService';

export function useWebSocket() {
  const clientRef = useRef(null);
  const subsRef   = useRef({});

  useEffect(() => {
    const token = getToken();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      onConnect: () => {
        // Re-suscribir los topics pendientes si hubo reconexión
        Object.entries(subsRef.current).forEach(([topic, cb]) => {
          client.subscribe(topic, (msg) => cb(JSON.parse(msg.body)));
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, []);

  /** Suscribirse a un topic STOMP */
  const subscribe = useCallback((topic, callback) => {
    subsRef.current[topic] = callback;
    const client = clientRef.current;
    if (client?.connected) {
      const sub = client.subscribe(topic, (msg) => callback(JSON.parse(msg.body)));
      return () => {
        sub.unsubscribe();
        delete subsRef.current[topic];
      };
    }
    // Si aún no conectó, se registra en subsRef y se activa en onConnect
    return () => { delete subsRef.current[topic]; };
  }, []);

  /** Enviar un mensaje a un destino /app/... */
  const send = useCallback((destination, body) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    });
  }, []);

  return { subscribe, send };
}