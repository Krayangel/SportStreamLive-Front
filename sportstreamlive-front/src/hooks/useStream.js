// src/hooks/useStream.js
// Gestiona el ciclo de vida del stream en vivo vía WebSocket + REST.
// El dueño puede iniciar/detener. Los viewers solo se suscriben.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { startStream, stopStream } from '../services/streamService';
import { WS_TOPICS, WS_APP } from '../config';

export function useStream(streamId, user) {
  const [status,   setStatus]   = useState('IDLE');   // IDLE | STARTED | ALIVE | ENDED
  const [viewers,  setViewers]  = useState(0);
  const [lastData, setLastData] = useState(null);
  const { subscribe, send } = useWebSocket();
  const ownerRef = useRef(false);

  // Suscribirse a eventos del stream
  useEffect(() => {
    if (!streamId) return;
    const unsub = subscribe(WS_TOPICS.STREAM(streamId), (event) => {
      if (event.tipo === 'STARTED') { setStatus('STARTED'); setViewers(v => v + 1); }
      if (event.tipo === 'ALIVE')   setStatus('ALIVE');
      if (event.tipo === 'ENDED')   { setStatus('ENDED'); ownerRef.current = false; }
      if (event.tipo === 'DATA')    setLastData(event.payload);
    });
    return unsub;
  }, [streamId, subscribe]);

  /** El dueño inicia el stream (REST + WS) */
  const start = useCallback(async () => {
    if (!user || !streamId) return;
    await startStream(streamId, user.id);
    ownerRef.current = true;
    send(WS_APP.STREAM_START(streamId), { userId: user.id, tipo: 'START' });
  }, [streamId, user, send]);

  /** El dueño detiene el stream */
  const stop = useCallback(async () => {
    if (!user || !streamId) return;
    await stopStream(streamId, user.id);
    send(WS_APP.STREAM_STOP(streamId), { userId: user.id, tipo: 'STOP' });
    ownerRef.current = false;
  }, [streamId, user, send]);

  /** Enviar datos en vivo (GPS, bpm, etc.) */
  const sendData = useCallback((payload) => {
    send(WS_APP.STREAM_DATA(streamId), { streamId, userId: user?.id, tipo: 'DATA', payload });
  }, [streamId, user, send]);

  return {
    status,
    viewers,
    lastData,
    isOwner: ownerRef.current,
    start,
    stop,
    sendData,
  };
}