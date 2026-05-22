// src/services/authService.js
import { ENDPOINTS, TOKEN_KEY, USER_KEY } from '../config';

function decodeJwtPayload(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

export async function login(email, password) {
  const res = await fetch(ENDPOINTS.LOGIN, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  const payload = decodeJwtPayload(data.token);
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: data.userId || payload.userId, username: data.username, email,
    roles: payload.roles || [],
  }));
  return data;
}

export async function register({ username, email, password, role }) {
  const res = await fetch(ENDPOINTS.REGISTER, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrarse');
  const payload = decodeJwtPayload(data.token);
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: data.userId || payload.userId, username: data.username, email,
    roles: payload.roles || [],
  }));
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
