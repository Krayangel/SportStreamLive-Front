// src/services/streamService.js
// Conecta con StreamingController.java (endpoints REST auxiliares)

import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const startStream     = (sid, uid) =>
  post(`${ENDPOINTS.STREAM_START(sid)}?userId=${uid}`).then(r => r.json());

export const stopStream      = (sid, uid) =>
  post(`${ENDPOINTS.STREAM_STOP(sid)}?userId=${uid}`).then(r => r.json());

export const isStreamActive  = (sid)      =>
  get(ENDPOINTS.STREAM_ACTIVE(sid)).then(r => r.json());

export const getActiveStreams = ()         =>
  get(ENDPOINTS.STREAMS_ALL).then(r => r.json());