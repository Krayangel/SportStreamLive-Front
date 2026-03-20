// src/pages/LiveRoom.jsx
// - Dueño: cámara + micrófono, inicia/detiene stream
// - Viewer: ve el video en tiempo real via WebRTC
// - Todos: chat en vivo visible SIEMPRE (incluso antes de que el stream esté activo)
// - Solo 1 viewer puede reclamar la medalla especial

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth }      from '../context/AuthContext';
import { useStream }    from '../hooks/useStream';
import { ChatBox }      from '../components/ui/ChatBox';
import { ContentCard }  from '../components/ui/ContentCard';
import { Spinner }      from '../components/ui/Spinner';
import { AlertBox }     from '../components/ui/AlertBox';
import { claimBadge }   from '../services/badgeService';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { WS_TOPICS, WS_APP }   from '../config';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function LiveRoom({ event, onExit }) {
  const { user }  = useAuth();
  const streamId  = `event-${event.id}`;
  const isOwner   = event.creatorId === user?.id;

  const { status, start, stop } = useStream(streamId, user, isOwner);

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef          = useRef(null);

  const [camReady,     setCamReady]     = useState(false);
  const [camError,     setCamError]     = useState('');
  const [rtcConnected, setRtcConnected] = useState(false);
  const [badgeClaimed, setBadgeClaimed] = useState(false);
  const [badgeMsg,     setBadgeMsg]     = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  const isLive = status === 'STARTED' || status === 'ALIVE';

  // Limpiar al salir
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, []);

  // ── DUEÑO: pedir cámara/micrófono ───────────────────────
  const requestCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCamReady(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCamError('Permiso de cámara/micrófono denegado. Permite el acceso en tu navegador.');
      } else if (err.name === 'NotFoundError') {
        setCamError('No se encontró cámara o micrófono en este dispositivo.');
      } else {
        setCamError('Error al acceder a la cámara: ' + err.message);
      }
    }
  }, []);

  // ── DUEÑO: crear RTCPeerConnection y mandar OFFER ───────
  const startWebRTC = useCallback(async () => {
    if (!localStreamRef.current) return;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        wsSend(WS_APP.WEBRTC(streamId), {
          type: 'ICE', streamId, senderUserId: user.id,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };
    pc.onconnectionstatechange = () => {
      setRtcConnected(pc.connectionState === 'connected');
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    wsSend(WS_APP.WEBRTC(streamId), {
      type: 'OFFER', streamId, senderUserId: user.id, sdp: offer.sdp,
    });
  }, [streamId, user]);

  // ── VIEWER: crear RTCPeerConnection y esperar OFFER ─────
  const joinAsViewer = useCallback(() => {
    if (pcRef.current) return; // ya conectado
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setRtcConnected(true);
      }
    };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        wsSend(WS_APP.WEBRTC(streamId), {
          type: 'ICE', streamId, senderUserId: user.id,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };
  }, [streamId, user]);

  // ── Señales WebRTC por STOMP ─────────────────────────────
  useEffect(() => {
    if (!streamId || !user) return;
    const unsub = wsSubscribe(WS_TOPICS.WEBRTC(streamId), async (signal) => {
      if (signal.senderUserId === user.id) return;
      const pc = pcRef.current;
      if (!pc) return;
      if (signal.type === 'OFFER' && !isOwner) {
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsSend(WS_APP.WEBRTC(streamId), {
          type: 'ANSWER', streamId, senderUserId: user.id, sdp: answer.sdp,
        });
      }
      if (signal.type === 'ANSWER' && isOwner) {
        await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
      }
      if (signal.type === 'ICE') {
        try {
          await pc.addIceCandidate({
            candidate: signal.candidate,
            sdpMid: signal.sdpMid,
            sdpMLineIndex: signal.sdpMLineIndex,
          });
        } catch {}
      }
      if (signal.type === 'JOIN' && isOwner) {
        await startWebRTC();
      }
    });
    return unsub;
  }, [streamId, user, isOwner, startWebRTC]);

  // Viewer se une cuando el stream está activo
  useEffect(() => {
    if (!isOwner && isLive) {
      joinAsViewer();
      wsSend(WS_APP.WEBRTC(streamId), {
        type: 'JOIN', streamId, senderUserId: user.id,
      });
    }
  }, [isLive, isOwner, streamId, user, joinAsViewer]);

  // Dueño: cuando la cám está lista → iniciar stream + WebRTC
  useEffect(() => {
    if (camReady && isOwner && status === 'IDLE') {
      start().then(() => setTimeout(() => startWebRTC(), 800));
    }
  }, [camReady, isOwner, status, start, startWebRTC]);

  // ── Detener ─────────────────────────────────────────────
  const handleStop = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setCamReady(false);
    setRtcConnected(false);
    await stop();
  }, [stop]);

  // ── Medalla especial ─────────────────────────────────────
  const handleClaimBadge = useCallback(async () => {
    if (!user || claimLoading) return;
    setClaimLoading(true);
    try {
      const res = await claimBadge(
        `evento-${event.id}-primero`, user.id, 'ESPECTADOR_VIP', 'Espectador VIP'
      );
      setBadgeMsg(res.claimed
        ? '🏅 ¡Felicidades! La medalla es tuya.'
        : '😔 La medalla ya fue reclamada por otro espectador.');
      setBadgeClaimed(true);
    } catch {
      setBadgeMsg('Error al reclamar la medalla.');
    } finally {
      setClaimLoading(false);
    }
  }, [user, event.id, claimLoading]);

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="page">

      {/* Header */}
      <div className="ph">
        <div>
          <div className="pt">
            {isLive
              ? <><span className="t-dot active" style={{ display:'inline-block', marginRight:8 }} />EN VIVO</>
              : status === 'ENDED' ? '⏹ Stream finalizado'
              : isOwner ? '🎙️ Sala del streamer' : '📺 Sala del evento'
            }
          </div>
          <div className="ps">{event.titulo}</div>
        </div>
        <button className="btn-logout" onClick={onExit} style={{ marginLeft:'auto' }}>
          ← Volver
        </button>
      </div>

      {/* Error cámara */}
      {camError && <AlertBox type="error" message={camError} />}

      {/* ── Layout: video + chat lado a lado en desktop ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14,
        alignItems:'start', marginBottom:14 }}>

        {/* Video */}
        <div>
          <div className="live-screen" style={{ position:'relative' }}>

            {/* Video del dueño (preview local) */}
            {isOwner && (
              <video ref={localVideoRef} autoPlay muted playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover',
                  display: camReady ? 'block' : 'none', borderRadius:'var(--r)' }} />
            )}

            {/* Video remoto (viewer) */}
            {!isOwner && (
              <video ref={remoteVideoRef} autoPlay playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover',
                  display: rtcConnected ? 'block' : 'none', borderRadius:'var(--r)' }} />
            )}

            {/* Placeholder */}
            {((isOwner && !camReady) || (!isOwner && !rtcConnected)) && (
              <div className="live-placeholder">
                {status === 'ENDED'
                  ? <span>⏹ El stream ha finalizado</span>
                  : isOwner
                    ? <span style={{ color:'var(--muted)', fontSize:'0.9rem', textAlign:'center', padding:'0 20px' }}>
                        Pulsa <strong style={{ color:'var(--accent)' }}>Iniciar Live</strong> para activar tu cámara y comenzar
                      </span>
                    : <div style={{ textAlign:'center' }}>
                        <Spinner text="" />
                        <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:8 }}>
                          Esperando que el streamer inicie el video…
                        </p>
                        <p style={{ color:'var(--muted)', fontSize:'0.75rem', marginTop:4 }}>
                          El chat ya está activo mientras tanto ➡
                        </p>
                      </div>
                }
              </div>
            )}

            {/* Badge EN VIVO */}
            {isLive && (camReady || rtcConnected) && (
              <div style={{ position:'absolute', top:12, left:12,
                background:'rgba(255,77,106,0.9)', color:'#fff',
                borderRadius:8, padding:'4px 12px', fontSize:'0.72rem',
                fontWeight:800, fontFamily:'Space Mono,monospace', letterSpacing:1 }}>
                🔴 EN VIVO
              </div>
            )}

            {/* Indicador conectado para viewer */}
            {!isOwner && rtcConnected && (
              <div style={{ position:'absolute', top:12, right:12,
                background:'rgba(60,245,180,0.85)', color:'#060a0f',
                borderRadius:8, padding:'4px 12px', fontSize:'0.72rem',
                fontWeight:800, fontFamily:'Space Mono,monospace' }}>
                ✅ Conectado
              </div>
            )}
          </div>

          {/* Controles del dueño — bajo el video */}
          {isOwner && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)',
              borderRadius:'var(--r)', padding:16, marginTop:10 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                {!camReady && status !== 'ENDED' && (
                  <button className="btn-main" style={{ maxWidth:200 }} onClick={requestCamera}>
                    🎙️ Iniciar Live
                  </button>
                )}
                {camReady && isLive && (
                  <button className="btn-main"
                    style={{ maxWidth:200, background:'var(--danger)', color:'#fff' }}
                    onClick={handleStop}>
                    ⏹ Detener Live
                  </button>
                )}
                {rtcConnected && (
                  <span style={{ fontSize:'0.8rem', color:'var(--teal)', fontWeight:700 }}>
                    ✅ Viewer conectado
                  </span>
                )}
              </div>
              <p style={{ fontSize:'0.73rem', color:'var(--muted)', marginTop:8 }}>
                Solo tú puedes iniciar y detener este live.
              </p>
            </div>
          )}

          {/* Medalla especial — bajo el video del viewer */}
          {!isOwner && !badgeClaimed && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)',
              borderRadius:'var(--r)', padding:16, marginTop:10 }}>
              <p style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:10 }}>
                🏅 <strong style={{ color:'var(--text)' }}>Medalla especial:</strong> solo UN espectador puede reclamarla. ¡Sé el primero!
              </p>
              <button className="btn-main" style={{ maxWidth:220 }}
                onClick={handleClaimBadge} disabled={claimLoading}>
                {claimLoading
                  ? <><span className="spin-anim">⟳</span> Reclamando…</>
                  : '🏅 Atrapar medalla'}
              </button>
            </div>
          )}

          {badgeMsg && (
            <AlertBox type={badgeMsg.includes('Felicidades') ? 'success' : 'error'}
              message={badgeMsg} />
          )}
        </div>

        {/* Chat — siempre visible */}
        <ChatBox roomId={streamId} />

      </div>

    </div>
  );
}
