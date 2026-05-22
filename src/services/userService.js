// src/services/userService.js
import { API_URL, TOKEN_KEY, USER_KEY } from '../config';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  };
}

export async function getEligibility() {
  const res = await fetch(`${API_URL}/api/users/me/eligibility`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener elegibilidad');
  return res.json();
}

export async function changeRole(role) {
  const res = await fetch(`${API_URL}/api/users/me/role`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar el rol');

  // Actualizar token y roles en localStorage
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
    const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    stored.roles = data.roles || [];
    localStorage.setItem(USER_KEY, JSON.stringify(stored));
  }
  return data;
}
