// src/services/challengeService.js
import { ENDPOINTS } from '../config';
import { get, post, apiRequest } from './apiClient';

export const getChallenges = async () => {
  const res = await get(ENDPOINTS.CHALLENGES);
  if (!res.ok) throw new Error(`Error ${res.status} al cargar retos`);
  return res.json();
};

export const getChallengeById = async (id) => {
  const res = await get(ENDPOINTS.CHALLENGE_BY_ID(id));
  if (!res.ok) throw new Error('Reto no encontrado');
  return res.json();
};

export const createChallenge = async (body) => {
  const res = await post(ENDPOINTS.CHALLENGES, body);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al crear el reto');
  }
  return res.json();
};

export const unirseChallenge = async (id, uid) => {
  const res = await post(`${ENDPOINTS.CHALLENGE_UNIRSE(id)}?userId=${encodeURIComponent(uid)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al unirse al reto');
  }
  return res.json();
};

export const salirChallenge = async (id, uid) => {
  const res = await apiRequest(
    `${ENDPOINTS.CHALLENGE_BY_ID(id)}/salir?userId=${encodeURIComponent(uid)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al salir del reto');
  }
  return res.json();
};

// Registrar progreso del día (1 por día, editable)
export const registrarProgreso = async (id, uid, texto) => {
  const res = await post(
    `${ENDPOINTS.CHALLENGE_BY_ID(id)}/progreso?userId=${encodeURIComponent(uid)}`,
    { texto }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al registrar progreso');
  }
  return res.json();
};

// Obtener progreso diario: Map<fecha, texto>
export const getProgreso = async (id, uid) => {
  const res = await get(
    `${ENDPOINTS.CHALLENGE_BY_ID(id)}/progreso/${encodeURIComponent(uid)}`
  );
  if (!res.ok) return {};
  return res.json();
};

export const addEvidencia = async (id, uid, texto) => {
  const res = await post(
    `${ENDPOINTS.CHALLENGE_BY_ID(id)}/evidencia?userId=${encodeURIComponent(uid)}`,
    { texto }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al guardar evidencia');
  }
  return res.json();
};

export const getEvidencias = async (id, uid) => {
  const res = await get(
    `${ENDPOINTS.CHALLENGE_BY_ID(id)}/evidencia/${encodeURIComponent(uid)}`
  );
  if (!res.ok) return [];
  return res.json();
};
