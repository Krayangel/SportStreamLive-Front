// ─────────────────────────────────────────────────────────────
//  src/config.js  —  Centro de configuración del frontend
// ─────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined';
const defaultOrigin = isBrowser
  ? window.location.origin
  : 'http://localhost:8080';

// El WS se construye desde API_URL por seguridad y coherencia entre entornos.
const apiBase = process.env.REACT_APP_API_URL || defaultOrigin;
const wsDefault = process.env.REACT_APP_WS_URL || `${new URL('/ws', apiBase).toString()}`;

export const API_URL = apiBase;
export const WS_URL = wsDefault;

/** Destinos STOMP para SUSCRIBIRSE (escuchar) */
export const WS_TOPICS = {
  CHAT:   (roomId)   => `/topic/chat/${roomId}`,
  STREAM: (streamId) => `/topic/stream/${streamId}`,
  WEBRTC: (streamId) => `/topic/webrtc/${streamId}`,
};

/** Destinos STOMP para ENVIAR al servidor */
export const WS_APP = {
  CHAT:         (roomId)   => `/app/chat/${roomId}`,
  STREAM_START: (streamId) => `/app/stream/${streamId}/start`,
  STREAM_DATA:  (streamId) => `/app/stream/${streamId}/data`,
  STREAM_STOP:  (streamId) => `/app/stream/${streamId}/stop`,
  WEBRTC:       (streamId) => `/app/webrtc/${streamId}/signal`,
};

/** Rutas REST — coinciden exactamente con @RequestMapping del back */
export const ENDPOINTS = {
  LOGIN:    `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,

  DASHBOARD:       (uid) => `${API_URL}/api/dashboard/${uid}`,
  DASHBOARD_METAS: (uid) => `${API_URL}/api/dashboard/${uid}/metas`,

  EVENTS:          `${API_URL}/api/events`,
  EVENT_BY_ID:     (id)  => `${API_URL}/api/events/${id}`,
  EVENT_INSCRIBIR: (id)  => `${API_URL}/api/events/${id}/inscribir`,

  CHALLENGES:       `${API_URL}/api/challenges`,
  CHALLENGE_BY_ID:  (id) => `${API_URL}/api/challenges/${id}`,
  CHALLENGE_UNIRSE: (id) => `${API_URL}/api/challenges/${id}/unirse`,

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
