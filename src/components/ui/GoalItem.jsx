// src/components/ui/GoalItem.jsx
import React from 'react';

export function GoalItem({ name, percent, subtitle }) {
  return (
    <div className="gi">
      <div className="gi-top">
        <span className="gi-name">{name}</span>
        <span className="gi-pct">{percent}%</span>
      </div>
      <div className="pb">
        <div className="pf" style={{ width: `${percent}%` }} />
      </div>
      <div className="gi-sub">{subtitle}</div>
    </div>
  );
}
