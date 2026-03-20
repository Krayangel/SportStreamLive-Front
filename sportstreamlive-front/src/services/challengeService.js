// src/services/challengeService.js
import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const getChallenges = async () => {
  const res = await get(ENDPOINTS.CHALLENGES);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[challengeService] getChallenges falló:', res.status, text);
    throw new Error(`Error ${res.status} al cargar retos`);
  }
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
    console.error('[challengeService] createChallenge falló:', res.status, data);
    throw new Error(data.error || `Error ${res.status} al crear el reto`);
  }
  return res.json();
};

// unirse usa query param ?userId=..., no body
export const unirseChallenge = async (id, uid) => {
  const url = `${ENDPOINTS.CHALLENGE_UNIRSE(id)}?userId=${encodeURIComponent(uid)}`;
  const res = await post(url);  // sin body
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al unirse al reto');
  }
  return res.json();
};
