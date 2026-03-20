// src/services/authService.js
// Conecta con AuthController.java  —  /api/auth/login  y  /api/auth/register

import { ENDPOINTS, TOKEN_KEY, USER_KEY } from '../config';

/**
 * POST /api/auth/login
 * Devuelve { token, userId, username } o lanza un Error con el mensaje del back.
 */
export async function login(email, password) {
  const res = await fetch(ENDPOINTS.LOGIN, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

  // Persistir token y datos básicos del usuario
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id:       data.userId,
    username: data.username,
    email,
  }));

  return data;
}

/**
 * POST /api/auth/register
 * El back espera { username, email, password }
 * Devuelve { token, userId, username } o lanza un Error.
 */
export async function register({ username, email, password }) {
  const res = await fetch(ENDPOINTS.REGISTER, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrarse');

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id:       data.userId,
    username: data.username,
    email,
  }));

  return data;
}

/** Cierra sesión limpiando localStorage */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Devuelve el usuario guardado en localStorage, o null */
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/** Devuelve el token guardado, o null */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
