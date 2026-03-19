// src/pages/LiveRoom.jsx
// Sala de streaming en vivo.
// - El dueño (owner) puede iniciar/detener el stream y escribe en chat.
// - Los viewers solo pueden ver el stream, escribir en chat y salir.
// - Solo UN viewer puede recibir la medalla especial "Espectador VIP"
//   usando el endpoint /api/badges/{badgeId}/claim (AtomicBoolean en el back).

import React, { useEffect, useState, useCallback } from 'react';
import { useStream }   from '../hooks/useStream';
import { useAuth }     from '../context/AuthContext';
import { ChatBox }     from '../components/ui/ChatBox';
import { claimBadge }  from '../services/badgeService';
import { ContentCard } from '../components/ui/ContentCard';
import { Spinner }     from '../components/ui/Spinner';

export function LiveRoom({ event, onExit, setThread }) {
  const { user }    = useAuth();
  const streamId    = `event-${event.id}`;
  const isOwner     = event.creatorId === user?.id;

  const { status, start, stop } = useStream(streamId, user);
  const [badgeClaimed,  setBadgeClaimed]  = useState(false);
  const [badgeMsg,      setBadgeMsg]      = useState('');
  const [claimLoading,  setClaimLoading]  = useState(false);

  // Actualizar monitor de hilos
  useEffect(() => {
    setThread?.('stream', 'running');
    setThread?.('ws', 'running');
    return () => {
      setThread?.('stream', 'idle');
      setThread?.('ws', 'idle');
    };
  }, [setThread]);

  // El dueño inicia el stream automáticamente al entrar
  useEffect(() => {
    if (isOwner && status === 'IDLE') {
      start();
    }
  }, [isOwner, status, start]);

  /** Solo UN viewer puede reclamar la medalla especial del evento */
  const handleClaimBadge = useCallback(async () => {
    if (!user || claimLoading) return;
    setClaimLoading(true);
    try {
      const badgeId = `evento-${event.id}-primero`;
      const res = await claimBadge(badgeId, user.id, 'ESPECTADOR_VIP', 'Espectador VIP');
      if (res.claimed) {
        setBadgeMsg(`🏅 ¡Felicidades! Obtuviste: ${res.message}`);
        setBadgeClaimed(true);
      } else {
        setBadgeMsg('😔 La medalla ya fue reclamada por otro espectador.');
        setBadgeClaimed(true);
      }
    } catch {
      setBadgeMsg('Error al reclamar la medalla.');
    } finally {
      setClaimLoading(false);
    }
  }, [user, event.id, claimLoading]);

  const isLive = status === 'STARTED' || status === 'ALIVE';

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">
            {isLive
              ? <><span className="t-dot active" style={{ display: 'inline-block', marginRight: 8 }} />EN VIVO</>
              : status === 'ENDED' ? '⏹ Stream finalizado' : '⏳ Conectando…'
            }
          </div>
          <div className="ps">{event.titulo}</div>
        </div>
        <button className="btn-logout" onClick={onExit} style={{ marginLeft: 'auto' }}>
          ← Volver
        </button>
      </div>

      {/* Pantalla del stream */}
      <div className="live-screen">
        {status === 'IDLE' || status === 'ENDED'
          ? (
            <div className="live-placeholder">
              {status === 'ENDED'
                ? <span>⏹ El stream ha finalizado</span>
                : <Spinner text="Esperando el stream…" />
              }
            </div>
          )
          : (
            <div className="live-active">
              <div className="live-badge-live">🔴 EN VIVO</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 12 }}>
                Stream de datos en tiempo real activo
              </div>
            </div>
          )
        }
      </div>

      {/* Controles del dueño */}
      {isOwner && (
        <ContentCard title="Controles del streamer" icon="🎙️" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {!isLive && status !== 'ENDED' && (
              <button className="btn-main" style={{ maxWidth: 180 }} onClick={start}>
                ▶ Iniciar stream
              </button>
            )}
            {isLive && (
              <button
                className="btn-main"
                style={{ maxWidth: 180, background: 'var(--danger)', color: '#fff' }}
                onClick={stop}
              >
                ⏹ Detener stream
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 10 }}>
            Solo tú puedes iniciar y detener este stream.
          </p>
        </ContentCard>
      )}

      {/* Medalla especial para viewers */}
      {!isOwner && isLive && !badgeClaimed && (
        <ContentCard title="🏅 Medalla especial" icon="🎁" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
            ¡Solo UN espectador puede reclamar esta medalla! Sé el primero.
          </p>
          <button
            className="btn-main"
            style={{ maxWidth: 220 }}
            onClick={handleClaimBadge}
            disabled={claimLoading}
          >
            {claimLoading ? <><span className="spin-anim">⟳</span> Reclamando…</> : '🏅 Atrapar medalla'}
          </button>
        </ContentCard>
      )}

      {badgeMsg && (
        <div className={`alert-box ${badgeMsg.includes('Felicidades') ? 'alert-ok' : 'alert-err'}`}
          style={{ marginBottom: 14 }}>
          {badgeMsg}
        </div>
      )}

      {/* Chat en vivo */}
      <ChatBox roomId={streamId} />
    </div>
  );
}