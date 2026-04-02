// src/components/ui/ContentCard.jsx
import React from 'react';

export function ContentCard({ title, icon, children, style }) {
  return (
    <div className="cc" style={style}>
      <div className="cc-head">
        <div className="cc-title">{title}</div>
        <div className="cc-ico">{icon}</div>
      </div>
      {children}
    </div>
  );
}
