// src/services/dashboardService.js
import { ENDPOINTS } from '../config';
import { get, post, put, apiRequest } from './apiClient';

export const getDashboard = async (uid) => {
  const res = await get(ENDPOINTS.DASHBOARD(uid));
  if (!res.ok) return null;
  return res.json();
};

// Registrar actividad del día (actualiza racha)
export const registrarActividad = async (uid) => {
  const res = await post(`${ENDPOINTS.DASHBOARD(uid)}/actividad`);
  if (!res.ok) return null;
  return res.json();
};

// Sumar XP
export const sumarXp = async (uid, cantidad) => {
  const res = await post(`${ENDPOINTS.DASHBOARD(uid)}/xp`, { cantidad });
  if (!res.ok) return null;
  return res.json();
};

// Metas privadas — GET
export const getMetas = async (uid) => {
  const res = await get(`${ENDPOINTS.DASHBOARD(uid)}/metas`);
  if (!res.ok) return [];
  return res.json();
};

// Metas privadas — reemplazar lista completa
export const updateMetas = async (uid, metas) => {
  const res = await put(`${ENDPOINTS.DASHBOARD(uid)}/metas`, { metas });
  if (!res.ok) return null;
  return res.json();
};

// Agregar una meta
export const addMeta = async (uid, texto) => {
  const res = await post(`${ENDPOINTS.DASHBOARD(uid)}/metas`, { texto });
  if (!res.ok) throw new Error('Error al agregar meta');
  return res.json();
};

// Eliminar meta por índice
export const deleteMeta = async (uid, index) => {
  const res = await apiRequest(`${ENDPOINTS.DASHBOARD(uid)}/metas/${index}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar meta');
  return res.json();
};
