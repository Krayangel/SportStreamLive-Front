// src/services/chatService.js
// Historial de chat vía REST  —  ChatController.java GET /api/chat/{roomId}/history
// El envío de mensajes en vivo se hace por WebSocket en useChat.js

import { ENDPOINTS } from '../config';
import { get } from './apiClient';

export const getChatHistory = (roomId) =>
  get(ENDPOINTS.CHAT_HISTORY(roomId)).then(r => r.json());