// src/hooks/useStream.js
import { useState, useEffect, useCallback } from 'react';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { startStream, stopStream } from '../services/streamService';
import { WS_TOPICS, WS_APP } from '../config';

export function useStream(streamId, user, isOwner) {
  const [status, setStatus] = useState('IDLE');

  useEffect(() => {
    if (!streamId) return;
    const unsub = wsSubscribe(WS_TOPICS.STREAM(streamId), (event) => {
      console.log('[useStream] WS evento:', event.tipo);
      if (event.tipo === 'STARTED') setStatus('STARTED');
      if (event.tipo === 'ALIVE')   setStatus('ALIVE');
      if (event.tipo === 'ENDED')   setStatus('ENDED');
    });
    return unsub;
  }, [streamId]);

  const start = useCallback(async () => {
    if (!user?.id || !streamId) return;
    try {
      await startStream(streamId, user.id);
      setStatus('STARTED');
      setTimeout(() => {
        wsSend(WS_APP.STREAM_START(streamId), { userId: user.id, tipo: 'START' });
      }, 600);
    } catch (err) {
      console.error('[useStream] start error:', err.message);
    }
  }, [streamId, user]);

  const stop = useCallback(async () => {
    if (!user?.id || !streamId) return;
    try {
      await stopStream(streamId, user.id);
      setStatus('ENDED');
      wsSend(WS_APP.STREAM_STOP(streamId), { userId: user.id, tipo: 'STOP' });
    } catch (err) {
      console.error('[useStream] stop error:', err.message);
    }
  }, [streamId, user]);

  return { status, start, stop };
}
