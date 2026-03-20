// src/services/eventService.js
import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const getEvents = async () => {
  const res = await get(ENDPOINTS.EVENTS);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[eventService] getEvents falló:', res.status, text);
    throw new Error(`Error ${res.status} al cargar eventos`);
  }
  return res.json();
};

export const getEventById = async (id) => {
  const res = await get(ENDPOINTS.EVENT_BY_ID(id));
  if (!res.ok) throw new Error('Evento no encontrado');
  return res.json();
};

export const createEvent = async (body) => {
  const res = await post(ENDPOINTS.EVENTS, body);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error('[eventService] createEvent falló:', res.status, data);
    throw new Error(data.error || `Error ${res.status} al crear el evento`);
  }
  return res.json();
};

// inscribir usa query param ?userId=..., no body
export const inscribirEvent = async (id, uid) => {
  const url = `${ENDPOINTS.EVENT_INSCRIBIR(id)}?userId=${encodeURIComponent(uid)}`;
  const res = await post(url);  // sin body
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al inscribirse');
  }
  return res.json();
};
