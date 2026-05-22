// src/services/metricsService.js
import { API_URL } from '../config';
import { get } from './apiClient';

export const getMetrics = async () => {
  const res = await get(`${API_URL}/api/admin/metrics`);
  if (!res.ok) throw new Error(`Error ${res.status} al obtener métricas`);
  return res.json();
};
