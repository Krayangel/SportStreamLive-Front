// src/services/dashboardService.js
// Conecta con DashboardController.java

import { ENDPOINTS } from '../config';
import { get, put } from './apiClient';

export const getDashboard  = (uid)        => get(ENDPOINTS.DASHBOARD(uid)).then(r => r.json());
export const updateMetas   = (uid, metas) => put(ENDPOINTS.DASHBOARD_METAS(uid), { metas }).then(r => r.json());
