// src/services/dashboardService.js
import { ENDPOINTS } from '../config';
import { get, post, put, apiRequest } from './apiClient';

/** GET /api/dashboard/{userId} */
export const getDashboard = async (uid) => {
  const res = await get(ENDPOINTS.DASHBOARD(uid));
  if (!res.ok) return null;
  return res.json();
};

/** POST /api/dashboard/{userId}/actividad */
export const registrarActividad = async (uid) => {
  const res = await post(ENDPOINTS.DASHBOARD_ACT(uid));
  if (!res.ok) return null;
  return res.json();
};

/** POST /api/dashboard/{userId}/xp */
export const sumarXp = async (uid, cantidad) => {
  const res = await post(ENDPOINTS.DASHBOARD_XP(uid), { cantidad });
  if (!res.ok) return null;
  return res.json();
};

// ── Metas privadas ────────────────────────────────────────────

/** GET /api/dashboard/{userId}/metas → devuelve array de strings */
export const getMetas = async (uid) => {
  const res = await get(ENDPOINTS.DASHBOARD_METAS(uid));
  if (!res.ok) {
    console.error('[dashboardService] getMetas falló:', res.status);
    return [];
  }
  const data = await res.json();
  // El back devuelve directamente List<String>
  return Array.isArray(data) ? data : (data?.metas ?? []);
};

/**
 * POST /api/dashboard/{userId}/metas
 * El back devuelve UserProfile completo → extraemos .metas
 */
export const addMeta = async (uid, texto) => {
  const res = await post(ENDPOINTS.DASHBOARD_METAS(uid), { texto });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status} al agregar meta`);
  }
  const data = await res.json();
  // El back devuelve UserProfile; el endpoint GET devuelve List<String>
  // Normalizar ambos casos
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.metas)) return data.metas;
  // Si no trae metas, recargar
  return getMetas(uid);
};

/**
 * PUT /api/dashboard/{userId}/metas
 * El back devuelve UserProfile completo
 */
export const updateMetas = async (uid, metas) => {
  const res = await put(ENDPOINTS.DASHBOARD_METAS(uid), { metas });
  if (!res.ok) throw new Error(`Error ${res.status} al actualizar metas`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.metas)) return data.metas;
  return getMetas(uid);
};

/**
 * DELETE /api/dashboard/{userId}/metas/{index}
 * El back devuelve UserProfile completo
 */
export const deleteMeta = async (uid, index) => {
  const res = await apiRequest(
    `${ENDPOINTS.DASHBOARD_METAS(uid)}/${index}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error(`Error ${res.status} al eliminar meta`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.metas)) return data.metas;
  return getMetas(uid);
};
