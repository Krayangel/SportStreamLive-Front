// src/pages/Retos.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getChallenges, createChallenge, unirseChallenge } from '../services/challengeService';
import { updateMetas, getDashboard } from '../services/dashboardService';
import { ContentCard } from '../components/ui/ContentCard';
import { Badge }       from '../components/ui/Badge';
import { Spinner }     from '../components/ui/Spinner';
import { AlertBox }    from '../components/ui/AlertBox';

const EMPTY_FORM = { nombre: '', descripcion: '', duracionDias: 30 };

export function Retos() {
  const { user } = useAuth();

  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState('success');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [creating,   setCreating]   = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [joining,    setJoining]    = useState(null);
  // Evidencia: { [challengeId]: texto }
  const [evidencias, setEvidencias] = useState({});
  const [savingEv,   setSavingEv]   = useState(null);
  const [openEv,     setOpenEv]     = useState(null); // id del reto con panel abierto

  const showMsg = (text, type = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const loadChallenges = useCallback(async () => {
    try {
      const data = await getChallenges();
      setChallenges(data);
    } catch (err) {
      console.error('[Retos]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  // ── Crear reto ───────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.nombre.trim()) { setFormErr('El nombre es obligatorio.'); return; }
    setCreating(true);
    try {
      await createChallenge({ ...form, creatorId: user.id });
      showMsg('✅ Reto creado.');
      setShowForm(false); setForm(EMPTY_FORM);
      await loadChallenges();
    } catch (err) {
      setFormErr(err.message || 'Error al crear.');
    } finally {
      setCreating(false);
    }
  };

  // ── Unirse ───────────────────────────────────────────────
  const handleUnirse = async (id) => {
    if (!user?.id || joining) return;
    setJoining(id);
    try {
      await unirseChallenge(id, user.id);
      showMsg('✅ ¡Te uniste! Medalla otorgada.');
      await loadChallenges();
    } catch (err) {
      showMsg(err.message || 'Error al unirse.', 'error');
    } finally {
      setJoining(null);
    }
  };

  // ── Guardar evidencia ────────────────────────────────────
  // Guardamos la evidencia en el campo "metas" del perfil del usuario
  // concatenando el nombre del reto + la evidencia escrita.
  const handleSaveEvidencia = async (challenge) => {
    const texto = evidencias[challenge.id]?.trim();
    if (!texto) { showMsg('Escribe tu evidencia antes de guardar.', 'error'); return; }
    setSavingEv(challenge.id);
    try {
      // Obtener metas actuales y agregar la evidencia
      const profile = await getDashboard(user.id).catch(() => ({ metas: '' }));
      const entrada = `[${new Date().toLocaleDateString('es-ES')}] Reto "${challenge.nombre}": ${texto}`;
      const metasActuales = profile?.metas || '';
      const nuevasMetas = metasActuales
        ? `${metasActuales}\n${entrada}`
        : entrada;
      await updateMetas(user.id, nuevasMetas);
      showMsg('✅ Evidencia guardada en tu perfil.');
      setEvidencias(p => ({ ...p, [challenge.id]: '' }));
      setOpenEv(null);
    } catch (err) {
      showMsg('Error al guardar evidencia.', 'error');
    } finally {
      setSavingEv(null);
    }
  };

  const unidos     = challenges.filter(c => c.participantes?.includes(user?.id));
  const disponibles = challenges.filter(c => !c.participantes?.includes(user?.id));

  if (loading) return <div className="page"><Spinner text="Cargando retos…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Retos</div>
          <div className="ps">Retos deportivos en SportStreamLive</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <Badge>⚔️ {unidos.length} ACTIVOS</Badge>
          <button className="btn-main"
            style={{ width:'auto', padding:'8px 14px', fontSize:'0.82rem',
              background:'var(--surface)', color:'var(--muted)', border:'1px solid var(--border)' }}
            onClick={loadChallenges}>↻ Actualizar</button>
          <button className="btn-main"
            style={{ width:'auto', padding:'9px 18px', fontSize:'0.85rem' }}
            onClick={() => { setShowForm(s => !s); setFormErr(''); }}>
            {showForm ? '✕ Cancelar' : '+ Crear reto'}
          </button>
        </div>
      </div>

      {msg && <AlertBox type={msgType === 'error' ? 'error' : 'success'} message={msg} />}

      {/* Formulario crear */}
      {showForm && (
        <ContentCard title="Nuevo reto" icon="➕" style={{ marginBottom:14 }}>
          <form onSubmit={handleCreate}>
            {formErr && <AlertBox type="error" message={formErr} />}
            <div className="fg">
              <label>Nombre <span className="req">*</span></label>
              <input type="text" placeholder="30 días corriendo"
                value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                disabled={creating} />
            </div>
            <div className="fg">
              <label>Descripción</label>
              <input type="text" placeholder="Descripción del reto"
                value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                disabled={creating} />
            </div>
            <div className="fg">
              <label>Duración (días)</label>
              <input type="number" min="1" max="365"
                value={form.duracionDias} onChange={e => setForm(p => ({ ...p, duracionDias: +e.target.value }))}
                disabled={creating} />
            </div>
            <button className="btn-main" type="submit" disabled={creating} style={{ maxWidth:180 }}>
              {creating ? <><span className="spin-anim">⟳</span> Creando…</> : 'Crear reto'}
            </button>
          </form>
        </ContentCard>
      )}

      {/* Retos donde participo */}
      {unidos.length > 0 && (
        <ContentCard title="Retos en los que participo" icon="🔥" style={{ marginBottom:14 }}>
          {unidos.map(c => (
            <div key={c.id}>
              <div className="ch">
                <div className="ch-ico">⚔️</div>
                <div className="ch-inf">
                  <div className="ch-name">{c.nombre}</div>
                  <div className="ch-meta">
                    {c.participantes?.length} participantes · {c.duracionDias} días
                  </div>
                  {c.descripcion && <div className="ch-meta">{c.descripcion}</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
                  <div className="ch-xp" style={{ background:'rgba(60,245,180,0.09)',
                    borderColor:'rgba(60,245,180,0.2)', color:'var(--teal)' }}>
                    UNIDO
                  </div>
                  <button
                    style={{ background:'rgba(212,245,60,0.1)', border:'1px solid rgba(212,245,60,0.25)',
                      borderRadius:7, padding:'4px 10px', fontSize:'0.7rem', color:'var(--accent)',
                      cursor:'pointer', fontWeight:700, fontFamily:'Space Mono,monospace' }}
                    onClick={() => setOpenEv(openEv === c.id ? null : c.id)}>
                    📝 {openEv === c.id ? 'Cerrar' : 'Evidencia'}
                  </button>
                </div>
              </div>

              {/* Panel de evidencia */}
              {openEv === c.id && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:11, padding:16, marginTop:-4, marginBottom:8 }}>
                  <p style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:10 }}>
                    Registra tu progreso en el reto <strong style={{ color:'var(--text)' }}>{c.nombre}</strong>.
                    Se guardará en tu perfil con fecha.
                  </p>
                  <textarea
                    style={{ width:'100%', minHeight:90, background:'var(--card)',
                      border:'1.5px solid var(--border)', borderRadius:9,
                      padding:'10px 12px', color:'var(--text)',
                      fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem',
                      resize:'vertical', outline:'none', marginBottom:10 }}
                    placeholder={`Ej: Completé 5km en 28 minutos. Día ${new Date().getDate()} del reto.`}
                    value={evidencias[c.id] || ''}
                    onChange={e => setEvidencias(p => ({ ...p, [c.id]: e.target.value }))}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <button className="btn-main"
                    style={{ maxWidth:180 }}
                    disabled={savingEv === c.id || !evidencias[c.id]?.trim()}
                    onClick={() => handleSaveEvidencia(c)}>
                    {savingEv === c.id
                      ? <><span className="spin-anim">⟳</span> Guardando…</>
                      : '💾 Guardar evidencia'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </ContentCard>
      )}

      {/* Retos disponibles */}
      <ContentCard title="Disponibles" icon="🎮">
        {disponibles.length === 0 && unidos.length === 0 && (
          <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>
            No hay retos aún. ¡Crea el primero!
          </p>
        )}
        {disponibles.length === 0 && unidos.length > 0 && (
          <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>
            Ya estás en todos los retos disponibles.
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
              {c.descripcion && <div className="ch-meta">{c.descripcion}</div>}
            </div>
            <button className="ch-xp"
              style={{ cursor: joining === c.id ? 'wait' : 'pointer',
                border:'1px solid var(--accent)', opacity: joining === c.id ? 0.6 : 1 }}
              onClick={() => handleUnirse(c.id)}
              disabled={!!joining}>
              {joining === c.id ? '…' : 'UNIRSE'}
            </button>
          </div>
        ))}
      </ContentCard>
    </div>
  );
}
