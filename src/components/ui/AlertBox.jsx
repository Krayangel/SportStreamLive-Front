// src/components/ui/AlertBox.jsx
import React from 'react';

export function AlertBox({ type, message }) {
  return (
    <div className={`alert-box ${type === 'error' ? 'alert-err' : 'alert-ok'}`}>
      {message}
    </div>
  );
}
