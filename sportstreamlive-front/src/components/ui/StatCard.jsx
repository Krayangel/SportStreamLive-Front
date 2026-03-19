// src/components/ui/StatCard.jsx
import React from 'react';

export function StatCard({ icon, label, value, change }) {
  return (
    <div className="sc" data-ico={icon}>
      <div className="sl">{label}</div>
      <div className="sv a">{value}</div>
      <div className="schange">{change}</div>
    </div>
  );
}