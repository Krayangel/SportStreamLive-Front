// src/services/apiClient.js
// Wrapper de fetch que inyecta automáticamente el JWT en cada petición.
// Todos los servicios usan este cliente, nunca fetch directo.

import { TOKEN_KEY } from '../config';

export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  // 401 → token expirado o inválido → limpiar sesión
  if (res.status === 401) {
    localStorage.clear();
    window.location.reload();
  }

  return res;
}

export const get  = (url)         => apiRequest(url, { method: 'GET' });
export const post = (url, body)    => apiRequest(url, { method: 'POST',   body: JSON.stringify(body) });
export const put  = (url, body)    => apiRequest(url, { method: 'PUT',    body: JSON.stringify(body) });
export const del  = (url)         => apiRequest(url, { method: 'DELETE' });