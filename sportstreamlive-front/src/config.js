// src/config.js
// ─────────────────────────────────────────────────────────────
//  DONDE CAMBIAR LA URL DEL BACK:
//    Local:      edita .env
//    Produccion: edita .env.production
//
//  Back en Render: https://sportstreamlive-back-1.onrender.com
// ─────────────────────────────────────────────────────────────

export const API_URL = process.env.REACT_APP_API_URL || 'https://sportstreamlive-back-1.onrender.com';
export const WS_URL  = process.env.REACT_APP_WS_URL  || 'https://sportstreamlive-back-1.onrender.com/ws';

export const WS_TOPICS = {
  CHAT:   (roomId)   => `/topic/chat/${roomId}`,
  STREAM: (streamId) => `/topic/stream/${streamId}`,
  WEBRTC: (streamId) => `/topic/webrtc/${streamId}`,
};

export const WS_APP = {
  CHAT:         (roomId)   => `/app/chat/${roomId}`,
  STREAM_START: (streamId) => `/app/stream/${streamId}/start`,
  STREAM_DATA:  (streamId) => `/app/stream/${streamId}/data`,
  STREAM_STOP:  (streamId) => `/app/stream/${streamId}/stop`,
  WEBRTC:       (streamId) => `/app/webrtc/${streamId}/signal`,
};

export const ENDPOINTS = {
  LOGIN:    `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,

  DASHBOARD:       (uid) => `${API_URL}/api/dashboard/${uid}`,
  DASHBOARD_METAS: (uid) => `${API_URL}/api/dashboard/${uid}/metas`,
  DASHBOARD_XP:    (uid) => `${API_URL}/api/dashboard/${uid}/xp`,
  DASHBOARD_ACT:   (uid) => `${API_URL}/api/dashboard/${uid}/actividad`,

  EVENTS:          `${API_URL}/api/events`,
  EVENT_BY_ID:     (id)  => `${API_URL}/api/events/${id}`,
  EVENT_INSCRIBIR: (id)  => `${API_URL}/api/events/${id}/inscribir`,

  CHALLENGES:       `${API_URL}/api/challenges`,
  CHALLENGE_BY_ID:  (id) => `${API_URL}/api/challenges/${id}`,
  CHALLENGE_UNIRSE: (id) => `${API_URL}/api/challenges/${id}/unirse`,
  CHALLENGE_SALIR:  (id) => `${API_URL}/api/challenges/${id}/salir`,

  BADGES:      (uid)     => `${API_URL}/api/badges/${uid}`,
  BADGE_CLAIM: (badgeId) => `${API_URL}/api/badges/${badgeId}/claim`,

  STREAM_START:  (sid) => `${API_URL}/api/streaming/${sid}/start`,
  STREAM_STOP:   (sid) => `${API_URL}/api/streaming/${sid}/stop`,
  STREAM_ACTIVE: (sid) => `${API_URL}/api/streaming/${sid}/active`,
  STREAMS_ALL:   `${API_URL}/api/streaming/active`,

  CHAT_HISTORY: (roomId) => `${API_URL}/api/chat/${roomId}/history`,
};

export const TOKEN_KEY = 'ssl_token';
export const USER_KEY  = 'ssl_user';