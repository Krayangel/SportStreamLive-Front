// src/services/streamService.js
import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const startStream = async (sid, uid) => {
  const res = await post(`${ENDPOINTS.STREAM_START(sid)}?userId=${encodeURIComponent(uid)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // ALREADY_ACTIVE no es error — el stream ya corría
    if (data.status === 'ALREADY_ACTIVE') return data;
    throw new Error(data.message || 'Error al iniciar stream');
  }
  return res.json();
};

export const stopStream = async (sid, uid) => {
  const res = await post(`${ENDPOINTS.STREAM_STOP(sid)}?userId=${encodeURIComponent(uid)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error al detener stream');
  }
  return res.json();
};

export const isStreamActive = async (sid) => {
  const res = await get(ENDPOINTS.STREAM_ACTIVE(sid));
  if (!res.ok) return { active: false };
  return res.json();
};

export const getActiveStreams = async () => {
  const res = await get(ENDPOINTS.STREAMS_ALL);
  if (!res.ok) return { streams: [], count: 0 };
  return res.json();
};
