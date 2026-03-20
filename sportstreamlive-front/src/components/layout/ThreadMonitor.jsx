// src/components/layout/ThreadMonitor.jsx
import React from 'react';

export function ThreadMonitor({ threads }) {
  const cls = (s) => (s === 'idle' || !s) ? 'i' : 'a';

  const list = [
    ['ws-stomp',    threads.ws],
    ['stream',      threads.stream],
    ['chat',        threads.chat],
    ['sync',        threads.sync],
  ];

  return (
    <div className="tm">
      <div className="tm-title">// HILOS ACTIVOS</div>
      {list.map(([name, status]) => (
        <div className="tl" key={name}>
          <div className={`td ${cls(status)}`} />
          <span>{name} · {status || 'idle'}</span>
        </div>
      ))}
    </div>
  );
}
