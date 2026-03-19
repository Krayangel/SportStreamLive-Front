// src/utils/formatters.js

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export const formatNumber = (n) =>
  Number(n).toLocaleString('es-ES');