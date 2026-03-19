// src/services/eventService.js
// Conecta con EventController.java

import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const getEvents      = ()         => get(ENDPOINTS.EVENTS).then(r => r.json());
export const getEventById   = (id)       => get(ENDPOINTS.EVENT_BY_ID(id)).then(r => r.json());
export const createEvent    = (body)     => post(ENDPOINTS.EVENTS, body).then(r => r.json());
export const inscribirEvent = (id, uid)  =>
  post(`${ENDPOINTS.EVENT_INSCRIBIR(id)}?userId=${uid}`).then(r => r.json());