// src/hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { getChatHistory }      from '../services/chatService';
import { WS_TOPICS, WS_APP }   from '../config';

export function useChat(roomId, user) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    getChatHistory(roomId)
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = wsSubscribe(WS_TOPICS.CHAT(roomId), (msg) => {
      setMessages(prev => {
        if (msg.id && prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsub;
  }, [roomId]);

  const sendMessage = useCallback((content) => {
    if (!content.trim() || !user) return;
    wsSend(WS_APP.CHAT(roomId), {
      sender:  user.username,
      content: content.trim(),
      roomId,
    });
  }, [roomId, user]);

  return { messages, loading, sendMessage };
}
