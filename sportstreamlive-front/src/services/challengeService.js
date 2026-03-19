// src/services/challengeService.js
// Conecta con ChallengeController.java

import { ENDPOINTS } from '../config';
import { get, post } from './apiClient';

export const getChallenges     = ()        => get(ENDPOINTS.CHALLENGES).then(r => r.json());
export const getChallengeById  = (id)      => get(ENDPOINTS.CHALLENGE_BY_ID(id)).then(r => r.json());
export const createChallenge   = (body)    => post(ENDPOINTS.CHALLENGES, body).then(r => r.json());
export const unirseChallenge   = (id, uid) =>
  post(`${ENDPOINTS.CHALLENGE_UNIRSE(id)}?userId=${uid}`).then(r => r.json());