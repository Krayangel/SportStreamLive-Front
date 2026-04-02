// src/components/ui/ProgressBar.jsx
import React from 'react';

export function ProgressBar({ progress }) {
  return (
    <div className="pb">
      <div className="pf" style={{ width: `${Math.min(progress, 100)}%` }} />
    </div>
  );
}
