// src/services/apiClient.js
import { TOKEN_KEY } from '../config';

export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(
      'No se pudo conectar con el servidor. ' +
      'Verifica que el back esté disponible.'
    );
  }

  if (res.status === 401) {
    localStorage.clear();
    window.location.reload();
  }

  return res;
}

export const get  = (url)       => apiRequest(url, { method: 'GET' });
export const post = (url, body) => apiRequest(url, {
  method: 'POST',
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
export const put  = (url, body) => apiRequest(url, {
  method: 'PUT',
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
export const del  = (url)       => apiRequest(url, { method: 'DELETE' });
