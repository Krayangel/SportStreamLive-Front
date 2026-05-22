// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getMetrics } from '../services/metricsService';
import { Spinner }    from '../components/ui/Spinner';

function MetricNum({ label, value, unit = '', color }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase',
        color: 'var(--muted)', fontFamily: 'Space Mono,monospace',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.7rem', fontWeight: 700,
        color: color || 'var(--text)',
        fontFamily: 'Bebas Neue,sans-serif', letterSpacing: 1,
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: '0.85rem', marginLeft: 4, color: 'var(--muted)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function MemoryBar({ used, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const barColor = pct > 85 ? 'var(--danger)' : pct > 60 ? 'var(--accent)' : 'var(--teal)';
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '16px 20px',
    }}>
      <div style={{
        fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase',
        color: 'var(--muted)', fontFamily: 'Space Mono,monospace', marginBottom: 10,
      }}>
        Memoria JVM
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.7rem', color: 'var(--muted)',
        fontFamily: 'Space Mono,monospace', marginBottom: 6,
      }}>
        <span>{used} MB</span><span>{max} MB</span>
      </div>
      <div style={{
        height: 6, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: barColor, borderRadius: 999, transition: 'width 0.5s',
        }} />
      </div>
      <div style={{
        fontSize: '0.62rem', color: 'var(--muted)',
        fontFamily: 'Space Mono,monospace', marginTop: 4,
      }}>
        {pct}% usado
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      const metrics = await getMetrics();
      setData(metrics);
      setLastUpdate(new Date());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <div className="page"><Spinner text="Cargando métricas…" /></div>;

  const b      = data?.business  || {};
  const t      = data?.technical || {};
  const health = data?.health    || 'UNKNOWN';
  const isUp   = health === 'UP';

  return (
    <div className="page">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <h1 style={{
          fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem',
          letterSpacing: 2, color: 'var(--accent)',
        }}>
          Métricas del Sistema
        </h1>
        <span style={{
          padding: '3px 12px', borderRadius: 999,
          fontSize: '0.7rem', fontFamily: 'Space Mono,monospace', fontWeight: 700, letterSpacing: 1,
          background: isUp ? 'rgba(60,245,180,0.12)' : 'rgba(255,77,106,0.12)',
          border: `1px solid ${isUp ? 'rgba(60,245,180,0.3)' : 'rgba(255,77,106,0.3)'}`,
          color: isUp ? 'var(--teal)' : 'var(--danger)',
        }}>
          {isUp ? '● UP' : '● DOWN'}
        </span>
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>
        )}
        {lastUpdate && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.65rem',
            color: 'var(--muted)', fontFamily: 'Space Mono,monospace',
          }}>
            Actualizado: {lastUpdate.toLocaleTimeString('es-ES')} · cada 30 s
          </span>
        )}
      </div>

      {/* ── Negocio ── */}
      <div className="dash-card-head" style={{ marginBottom: 12 }}>
        <span>📊</span>
        <span className="dash-card-title">Negocio</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 10, marginBottom: 28,
      }}>
        <MetricNum label="Registrados"     value={b.usersRegistered  ?? 0} color="var(--accent)" />
        <MetricNum label="Sesiones"        value={b.logins           ?? 0} />
        <MetricNum label="Streams Activos" value={b.activeStreams     ?? 0}
          color={(b.activeStreams ?? 0) > 0 ? 'var(--teal)' : 'var(--text)'} />
        <MetricNum label="Streams Totales" value={b.streamsStarted   ?? 0} />
        <MetricNum label="Mensajes"        value={b.messagesSent     ?? 0} />
        <MetricNum label="Medallas"        value={b.badgesClaimed    ?? 0} />
        <MetricNum label="Eventos"         value={b.eventsCreated    ?? 0} />
        <MetricNum label="Retos Unidos"    value={b.challengesJoined ?? 0} />
      </div>

      {/* ── Técnico ── */}
      <div className="dash-card-head" style={{ marginBottom: 12 }}>
        <span>⚙️</span>
        <span className="dash-card-title">Técnico</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 10,
      }}>
        <MetricNum
          label="Latencia Avg"
          value={t.avgResponseMs ?? 0}
          unit="ms"
          color={(t.avgResponseMs ?? 0) > 500 ? 'var(--danger)' : 'var(--teal)'}
        />
        <MetricNum
          label="Errores 4xx"
          value={t.errorRate4xx ?? 0}
          color={(t.errorRate4xx ?? 0) > 0 ? 'var(--accent)' : 'var(--text)'}
        />
        <MetricNum
          label="Errores 5xx"
          value={t.errorRate5xx ?? 0}
          color={(t.errorRate5xx ?? 0) > 0 ? 'var(--danger)' : 'var(--text)'}
        />
        <MetricNum
          label="CPU"
          value={t.cpuUsage ?? 0}
          unit="%"
          color={(t.cpuUsage ?? 0) > 80 ? 'var(--danger)' : 'var(--text)'}
        />
        <MemoryBar used={t.memoryUsedMb ?? 0} max={t.memoryMaxMb ?? 512} />
      </div>

    </div>
  );
}
