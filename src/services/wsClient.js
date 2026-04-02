// src/services/wsClient.js
// Singleton STOMP/SockJS. Una sola conexión para toda la app.

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../config';
import { getToken } from './authService';

let client = null;
// topic -> Map<callbackFn, stompSubscription>
const subs   = {};
const queued = [];  // mensajes encolados antes de conectar
let ready    = false;

function buildClient() {
  if (client) return client;

  const tok = getToken();

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: tok ? { Authorization: `Bearer ${tok}` } : {},
    reconnectDelay: 5000,

    onConnect: () => {
      ready = true;
      console.log('[WS] Conectado');

      // Re-suscribir todos los topics registrados
      Object.entries(subs).forEach(([topic, cbMap]) => {
        cbMap.forEach((_, cb) => {
          if (!cbMap.get(cb) || cbMap.get(cb).id === undefined) {
            const stompSub = client.subscribe(topic, (msg) => {
              let parsed;
              try { parsed = JSON.parse(msg.body); } catch { parsed = msg.body; }
              cbMap.forEach((__, fn) => fn(parsed));
            });
            // Guardar una única suscripción STOMP por topic
            cbMap.set(cb, stompSub);
          }
        });
      });

      // Despachar mensajes encolados
      queued.splice(0).forEach(({ destination, body }) => {
        client.publish({ destination, body: JSON.stringify(body) });
      });
    },

    onDisconnect: () => {
      ready = false;
      console.log('[WS] Desconectado');
    },

    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame.headers?.message);
    },
  });

  client.activate();
  return client;
}

/**
 * Suscribirse a un topic.
 * Devuelve función para desuscribirse.
 */
export function wsSubscribe(topic, callback) {
  if (!subs[topic]) subs[topic] = new Map();
  const cbMap = subs[topic];

  // Evitar suscripción duplicada del mismo callback
  if (cbMap.has(callback)) return () => {};

  const c = buildClient();
  let stompSub = null;

  if (c.connected) {
    // Si ya hay otros callbacks en este topic, reutilizar la suscripción STOMP existente
    const existing = [...cbMap.values()].find(s => s && s.id);
    if (existing) {
      // La suscripción STOMP ya existe, solo añadir el callback
      cbMap.set(callback, existing);
    } else {
      stompSub = c.subscribe(topic, (msg) => {
        let parsed;
        try { parsed = JSON.parse(msg.body); } catch { parsed = msg.body; }
        subs[topic]?.forEach((_, fn) => fn(parsed));
      });
      cbMap.set(callback, stompSub);
    }
  } else {
    // Se registra; onConnect lo activará
    cbMap.set(callback, null);
  }

  return () => {
    const entry = subs[topic];
    if (!entry) return;
    const sub = entry.get(callback);
    entry.delete(callback);
    // Solo desuscribir STOMP si es el único que usaba esa suscripción
    if (sub && entry.size === 0) {
      try { sub.unsubscribe(); } catch {}
      delete subs[topic];
    }
  };
}

/** Enviar mensaje; si no está conectado, encola. */
export function wsSend(destination, body) {
  const c = buildClient();
  if (c.connected && ready) {
    c.publish({ destination, body: JSON.stringify(body) });
  } else {
    console.log('[WS] Encolando:', destination);
    queued.push({ destination, body });
  }
}

/** Inicializar la conexión (llamado al login). */
export function wsInit() {
  buildClient();
}

/** Desconectar (llamado al logout). */
export function wsDisconnect() {
  if (client) {
    try { client.deactivate(); } catch {}
    client = null;
    ready  = false;
    Object.keys(subs).forEach(k => delete subs[k]);
    queued.length = 0;
  }
}
