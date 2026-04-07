// src/services/badgeService.js
import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const getBadges = (uid) =>
  get(ENDPOINTS.BADGES(uid)).then(r => r.json());

export const claimBadge = (badgeId, userId, tipo, nombre) =>
  post(ENDPOINTS.BADGE_CLAIM(badgeId), { userId, tipo, nombre }).then(r => r.json());

export const launchBadge = async (streamId, userId, tipo, nombre) => {
  const res = await post(ENDPOINTS.BADGE_LAUNCH(streamId), { userId, tipo, nombre });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const err = await res.json(); msg = err.message || err.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
};
