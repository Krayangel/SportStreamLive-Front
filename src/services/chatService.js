// src/services/chatService.js
import { ENDPOINTS } from '../config';
import { get } from './apiClient';

export const getChatHistory = (roomId) =>
  get(ENDPOINTS.CHAT_HISTORY(roomId)).then(r => r.json());
