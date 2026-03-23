// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth }        from '../context/AuthContext';
import { getDashboard, registrarActividad, getMetas } from '../services/dashboardService';
import { getChallenges }  from '../services/challengeService';
import { getEvents }      from '../services/eventService';
import { getBadges }      from '../services/badgeService';
import { Spinner }        from '../components/ui/Spinner';

const DIF_STYLE = {
  FACIL:   { bg:'rgba(60,245,180,0.1)',  border:'rgba(60,245,180,0.3)',  color:'var(--teal)',   label:'Fácil'   },
  MEDIA:   { bg:'rgba(212,245,60,0.1)',  border:'rgba(212,245,60,0.3)',  color:'var(--accent)', label:'Media'   },
  DIFICIL: { bg:'rgba(255,77,106,0.1)',  border:'rgba(255,77,106,0.3)',  color:'var(--danger)', label:'Difícil' },
};
const BADGE_ICO = {
  PRIMER_LOGRO:'🌟', INSCRIPCION_EVENTO:'📅',
  UNIRSE_RETO:'⚔️', COMPLETAR_RETO:'🏆', ESPECTADOR_VIP:'🏅',
};

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [retos,   setRetos]   = useState([]);
  const [eventos, setEventos] = useState([]);
  const [badges,  setBadges]  = useState([]);
  const [metas,   setMetas]   = useState([]);
  const [loading, setLoading] = useState(true);

  const h = new Date().getHours();
  const greet   = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
  });

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [p, c, e, b, m] = await Promise.allSettled([
      getDashboard(user.id),
      getChallenges(),
      getEvents(),
      getBadges(user.id),
      getMetas(user.id),
    ]);
    if (p.status === 'fulfilled') setProfile(p.value);
    if (c.status === 'fulfilled') setRetos(c.value.filter(x => x.participantes?.includes(user.id)));
    if (e.status === 'fulfilled') setEventos(e.value.filter(x => x.asistentes?.includes(user.id) || x.creatorId === user.id));
    if (b.status === 'fulfilled') setBadges(b.value);
    if (m.status === 'fulfilled') setMetas(Array.isArray(m.value) ? m.value : []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
    if (user?.id) registrarActividad(user.id).catch(() => {});
  }, [load, user?.id]);

  if (loading) return <div className="page"><Spinner text="Cargando dashboard…" /></div>;

  const racha = profile?.rachaActual ?? profile?.racha ?? 0;
  const xp    = profile?.xpTotal ?? profile?.puntosTotales ?? 0;

  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="dash-hero-inner">
          <div className="dash-hero-greet">{greet},</div>
          <div className="dash-hero-name">{user?.username?.toUpperCase()}</div>
          <div className="dash-hero-date">{dateStr}</div>
          <div className="dash-hero-stats">
            {[
              ['🔥', racha,              'días de racha'],
              ['⚡', xp.toLocaleString(), 'XP total'],
              ['🏅', badges.length,       'logros'],
              ['⚔️', retos.length,        'retos activos'],
            ].map(([ico, val, lbl], i, arr) => (
              <React.Fragment key={lbl}>
                <div className="dash-hero-stat">
                  <div className="dash-hero-stat-val">{ico} {val}</div>
                  <div className="dash-hero-stat-lbl">{lbl}</div>
                </div>
                {i < arr.length - 1 && <div className="dash-hero-sep" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="dash-grid">

        {/* Mis Retos */}
        <div className="dash-card">
          <div className="dash-card-head">
            <span>⚔️</span>
            <span className="dash-card-title">Mis Retos</span>
            <span className="dash-card-badge">{retos.length}</span>
          </div>
          {retos.length === 0
            ? <p className="dash-empty">No estás en ningún reto aún.</p>
            : retos.slice(0, 4).map(c => {
                const diasComp = Object.keys(c.progresoDiario?.[user.id] ?? {}).length;
                const pct      = Math.min(100, Math.round((diasComp / Math.max(c.duracionDias,1)) * 100));
                const dif      = DIF_STYLE[c.dificultad] || DIF_STYLE.MEDIA;
                return (
                  <div key={c.id} className="dash-item">
                    <div className="dash-item-row">
                      <span className="dash-item-name">{c.nombre}</span>
                      <span className="dash-tag" style={{ background:dif.bg, borderColor:dif.border, color:dif.color }}>
                        {dif.label}
                      </span>
                    </div>
                    <div className="dash-item-sub">{diasComp}/{c.duracionDias} días · {c.xpRecompensa} XP</div>
                    <div className="pb" style={{ marginTop:5 }}>
                      <div className="pf" style={{ width:`${pct}%` }} />
                    </div>
                    <div style={{ fontSize:'0.67rem', color:'var(--muted)', marginTop:2,
                      fontFamily:'Space Mono,monospace' }}>{pct}%</div>
                  </div>
                );
              })
          }
        </div>

        {/* Mis Eventos */}
        <div className="dash-card">
          <div className="dash-card-head">
            <span>📅</span>
            <span className="dash-card-title">Mis Eventos</span>
            <span className="dash-card-badge">{eventos.length}</span>
          </div>
          {eventos.length === 0
            ? <p className="dash-empty">No estás inscrito en ningún evento.</p>
            : eventos.slice(0, 4).map(e => (
                <div key={e.id} className="dash-item">
                  <div className="dash-item-row">
                    <span className="dash-item-name">{e.titulo}</span>
                    <span className="dash-tag" style={{ background:'rgba(212,245,60,0.08)',
                      borderColor:'rgba(212,245,60,0.2)', color:'var(--accent)' }}>{e.tipo}</span>
                  </div>
                  <div className="dash-item-sub">
                    {e.creatorId === user.id ? '🎙️ Tu evento' : '✅ Inscrito'}
                  </div>
                </div>
              ))
          }
        </div>

        {/* Mis Metas privadas */}
        <div className="dash-card">
          <div className="dash-card-head">
            <span>🎯</span>
            <span className="dash-card-title">Mis Metas</span>
            <span style={{ marginLeft:'auto', fontSize:'0.62rem', color:'var(--muted)',
              fontFamily:'Space Mono,monospace', background:'var(--surface)',
              border:'1px solid var(--border)', borderRadius:4, padding:'2px 6px' }}>
              🔒 privadas
            </span>
          </div>
          {metas.length === 0
            ? <p className="dash-empty">Sin metas. Ve a "Mis Metas" para agregar.</p>
            : metas.slice(0, 5).map((m, i) => (
                <div key={i} className="dash-item" style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ color:'var(--accent)', fontSize:'0.75rem', marginTop:2, flexShrink:0 }}>◆</span>
                  <span style={{ fontSize:'0.84rem', lineHeight:1.4 }}>{m}</span>
                </div>
              ))
          }
          {metas.length > 5 && (
            <p style={{ fontSize:'0.73rem', color:'var(--muted)', marginTop:6 }}>
              +{metas.length - 5} más…
            </p>
          )}
        </div>

        {/* Últimos logros */}
        <div className="dash-card">
          <div className="dash-card-head">
            <span>🏅</span>
            <span className="dash-card-title">Últimos logros</span>
            <span className="dash-card-badge">{badges.length}</span>
          </div>
          {badges.length === 0
            ? <p className="dash-empty">Sin logros. ¡Únete a un reto o evento!</p>
            : [...badges].reverse().slice(0, 4).map(b => (
                <div key={b.id} className="dash-item" style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{BADGE_ICO[b.tipo] || '🥇'}</span>
                  <div>
                    <div style={{ fontSize:'0.82rem', fontWeight:700 }}>{b.nombre}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--muted)', fontFamily:'Space Mono,monospace' }}>
                      {new Date(b.fechaObtenida).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
              ))
          }
        </div>

      </div>
    </div>
  );
}
