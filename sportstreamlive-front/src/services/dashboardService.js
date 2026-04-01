// src/services/dashboardService.js
import { ENDPOINTS } from '../config';
import { get, post, put, apiRequest } from './apiClient';

/** GET /api/dashboard/{userId} — perfil completo */
export const getDashboard = async (uid) => {
  const res = await get(ENDPOINTS.DASHBOARD(uid));
  if (!res.ok) return null;
  return res.json();
};

/** POST /api/dashboard/{userId}/actividad — actualiza racha del día */
export const registrarActividad = async (uid) => {
  const res = await post(`${ENDPOINTS.DASHBOARD(uid)}/actividad`);
  if (!res.ok) return null;
  return res.json();
};

/** POST /api/dashboard/{userId}/xp — suma XP */
export const sumarXp = async (uid, cantidad) => {
  const res = await post(`${ENDPOINTS.DASHBOARD(uid)}/xp`, { cantidad });
  if (!res.ok) return null;
  return res.json();
};

// ── Metas privadas ────────────────────────────────────────────
// IMPORTANTE: usa ENDPOINTS.DASHBOARD_METAS (que ya existe en config.js)
// y NO ENDPOINTS.DASHBOARD + '/metas' para evitar confusión.

/** GET /api/dashboard/{userId}/metas — lista de metas privadas */
export const getMetas = async (uid) => {
  const res = await get(ENDPOINTS.DASHBOARD_METAS(uid));
  if (!res.ok) {
    console.error('[dashboardService] getMetas falló:', res.status);
    return [];
  }
  const data = await res.json();
  // Garantizar que siempre devolvemos un array
  return Array.isArray(data) ? data : [];
};

/** POST /api/dashboard/{userId}/metas — agrega una meta */
export const addMeta = async (uid, texto) => {
  const res = await post(ENDPOINTS.DASHBOARD_METAS(uid), { texto });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status} al agregar meta`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

/** PUT /api/dashboard/{userId}/metas — reemplaza lista completa */
export const updateMetas = async (uid, metas) => {
  const res = await put(ENDPOINTS.DASHBOARD_METAS(uid), { metas });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al actualizar metas`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

/** DELETE /api/dashboard/{userId}/metas/{index} — elimina por índice */
export const deleteMeta = async (uid, index) => {
  const res = await apiRequest(
    `${ENDPOINTS.DASHBOARD_METAS(uid)}/${index}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    throw new Error(`Error ${res.status} al eliminar meta`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};
