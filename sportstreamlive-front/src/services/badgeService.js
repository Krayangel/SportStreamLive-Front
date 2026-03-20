// src/services/badgeService.js
// Conecta con BadgeController.java

import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const getBadges  = (uid)                        => get(ENDPOINTS.BADGES(uid)).then(r => r.json());
export const claimBadge = (badgeId, userId, tipo, nombre) =>
  post(ENDPOINTS.BADGE_CLAIM(badgeId), { userId, tipo, nombre }).then(r => r.json());
