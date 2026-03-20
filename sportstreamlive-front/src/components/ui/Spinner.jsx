// src/components/ui/Spinner.jsx
import React from 'react';

export function Spinner({ text = 'Cargando…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.85rem', padding: '20px 0' }}>
      <span className="spin-anim" style={{ fontSize: '1.1rem' }}>⟳</span>
      {text}
    </div>
  );
}
