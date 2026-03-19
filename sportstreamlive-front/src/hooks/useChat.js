// src/hooks/useChat.js
// Gestiona el chat en vivo de una sala vía STOMP.
// Carga historial REST al montar y escucha mensajes nuevos en tiempo real.

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { getChatHistory } from '../services/chatService';
import { WS_TOPICS, WS_APP } from '../config';

export function useChat(roomId, user) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { subscribe, send } = useWebSocket();

  // 1. Cargar historial al entrar a la sala
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    getChatHistory(roomId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [roomId]);

  // 2. Suscribirse a mensajes nuevos en tiempo real
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribe(WS_TOPICS.CHAT(roomId), (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return unsub;
  }, [roomId, subscribe]);

  // 3. Enviar un mensaje
  const sendMessage = useCallback((content) => {
    if (!content.trim() || !user) return;
    send(WS_APP.CHAT(roomId), {
      sender:  user.username,
      content,
      roomId,
    });
  }, [roomId, user, send]);

  return { messages, loading, sendMessage };
}