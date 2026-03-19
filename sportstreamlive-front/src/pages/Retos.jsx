// src/pages/Retos.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }        from '../context/AuthContext';
import { getChallenges, createChallenge, unirseChallenge } from '../services/challengeService';
import { ContentCard }    from '../components/ui/ContentCard';
import { Badge }          from '../components/ui/Badge';
import { Spinner }        from '../components/ui/Spinner';

export function Retos({ setThread }) {
  const { user }  = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', duracionDias: 30 });

  const load = () => {
    setThread?.('sync', 'running');
    getChallenges()
      .then(setChallenges)
      .catch(() => {})
      .finally(() => { setLoading(false); setThread?.('sync', 'idle'); });
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line

  const handleUnirse = async (id) => {
    if (!user?.id) return;
    try {
      await unirseChallenge(id, user.id);
      setMsg('✅ ¡Te uniste al reto! Medalla otorgada.');
      load();
    } catch {
      setMsg('❌ Error al unirse.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await createChallenge({ ...form, creatorId: user.id });
      setMsg('✅ Reto creado.');
      setShowForm(false);
      setForm({ nombre: '', descripcion: '', duracionDias: 30 });
      load();
    } catch {
      setMsg('❌ Error al crear el reto.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const unidos    = challenges.filter(c => c.participantes?.includes(user?.id));
  const disponibles = challenges.filter(c => !c.participantes?.includes(user?.id));

  if (loading) return <div className="page"><Spinner text="Cargando retos…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Retos</div>
          <div className="ps">Actualizaciones en tiempo real</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge>⚔️ {unidos.length} ACTIVOS</Badge>
          <button
            className="btn-main"
            style={{ padding: '8px 16px', fontSize: '0.82rem', width: 'auto' }}
            onClick={() => setShowForm(s => !s)}
          >
            {showForm ? '✕ Cancelar' : '+ Crear reto'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert-box ${msg.startsWith('✅') ? 'alert-ok' : 'alert-err'}`}
          style={{ marginBottom: 14 }}>
          {msg}
        </div>
      )}

      {/* Formulario crear reto */}
      {showForm && (
        <ContentCard title="Nuevo reto" icon="➕" style={{ marginBottom: 14 }}>
          <form onSubmit={handleCreate}>
            <div className="fg">
              <label>Nombre del reto <span className="req">*</span></label>
              <input type="text" placeholder="30 días corriendo"
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="fg">
              <label>Descripción</label>
              <input type="text" placeholder="Descripción del reto"
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="fg">
              <label>Duración (días)</label>
              <input type="number" min="1" max="365"
                value={form.duracionDias}
                onChange={e => setForm(p => ({ ...p, duracionDias: +e.target.value }))} />
            </div>
            <button className="btn-main" type="submit" style={{ maxWidth: 180 }}>
              Crear reto
            </button>
          </form>
        </ContentCard>
      )}

      {/* Retos activos */}
      {unidos.length > 0 && (
        <ContentCard title="Retos en los que participo" icon="🔥" style={{ marginBottom: 14 }}>
          {unidos.map(c => (
            <div className="ch" key={c.id}>
              <div className="ch-ico">⚔️</div>
              <div className="ch-inf">
                <div className="ch-name">{c.nombre}</div>
                <div className="ch-meta">
                  {c.participantes?.length} participantes · {c.duracionDias} días
                </div>
                <div className="ch-meta">{c.descripcion}</div>
              </div>
              <div className="ch-xp" style={{ background: 'rgba(60,245,180,0.09)',
                borderColor: 'rgba(60,245,180,0.2)', color: 'var(--teal)' }}>
                UNIDO
              </div>
            </div>
          ))}
        </ContentCard>
      )}

      {/* Retos disponibles */}
      <ContentCard title="Disponibles" icon="🎮">
        {disponibles.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            No hay retos disponibles. ¡Crea el primero!
          </p>
        )}
        {disponibles.map(c => (
          <div className="ch" key={c.id}>
            <div className="ch-ico">🏆</div>
            <div className="ch-inf">
              <div className="ch-name">{c.nombre}</div>
              <div className="ch-meta">
                {c.participantes?.length} participantes · {c.duracionDias} días
              </div>
              <div className="ch-meta">{c.descripcion}</div>
            </div>
            <button
              className="ch-xp"
              style={{ cursor: 'pointer', border: '1px solid var(--accent)' }}
              onClick={() => handleUnirse(c.id)}
            >
              UNIRSE
            </button>
          </div>
        ))}
      </ContentCard>
    </div>
  );
}