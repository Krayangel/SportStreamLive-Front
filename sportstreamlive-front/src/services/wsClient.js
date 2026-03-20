// src/services/wsClient.js
// Singleton de conexión STOMP/SockJS.
// Una sola conexión para toda la app, compartida entre todos los hooks.

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../config';
import { getToken } from './authService';

let client = null;
const subscribers = {};   // topic -> Set de callbacks
const pendingMsgs = [];   // mensajes encolados antes de conectar
let connected = false;

function getClient() {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: (() => {
      const t = getToken();
      return t ? { Authorization: `Bearer ${t}` } : {};
    })(),
    reconnectDelay: 3000,

    onConnect: () => {
      connected = true;
      console.log('[WS] Conectado al broker STOMP');

      // Re-suscribir todos los topics registrados
      Object.entries(subscribers).forEach(([topic, cbs]) => {
        if (cbs.size > 0) {
          client.subscribe(topic, (msg) => {
            let parsed;
            try { parsed = JSON.parse(msg.body); } catch { parsed = msg.body; }
            cbs.forEach(cb => cb(parsed));
          });
        }
      });

      // Despachar mensajes pendientes
      pendingMsgs.splice(0).forEach(({ destination, body }) => {
        client.publish({ destination, body: JSON.stringify(body) });
      });
    },

    onDisconnect: () => {
      connected = false;
      console.log('[WS] Desconectado');
    },

    onStompError: (frame) => {
      console.error('[WS] Error STOMP:', frame.headers?.message);
    },
  });

  client.activate();
  return client;
}

/** Suscribirse a un topic. Devuelve función para desuscribirse. */
export function wsSubscribe(topic, callback) {
  if (!subscribers[topic]) subscribers[topic] = new Set();
  subscribers[topic].add(callback);

  const c = getClient();
  let stompSub = null;

  if (c.connected) {
    stompSub = c.subscribe(topic, (msg) => {
      let parsed;
      try { parsed = JSON.parse(msg.body); } catch { parsed = msg.body; }
      callback(parsed);
    });
  }
  // Si no conectó aún, se registra en subscribers y onConnect lo activa

  return () => {
    subscribers[topic]?.delete(callback);
    stompSub?.unsubscribe();
  };
}

/** Enviar mensaje. Si no conectó aún, encola. */
export function wsSend(destination, body) {
  const c = getClient();
  if (c.connected && connected) {
    c.publish({ destination, body: JSON.stringify(body) });
  } else {
    console.log('[WS] Encolando mensaje hasta conectar:', destination);
    pendingMsgs.push({ destination, body });
    getClient(); // asegurar que está activado
  }
}

/** Inicializar la conexión al arrancar la app */
export function wsInit() {
  getClient();
}

/** Desconectar (solo al cerrar sesión) */
export function wsDisconnect() {
  if (client) {
    client.deactivate();
    client = null;
    connected = false;
    Object.keys(subscribers).forEach(k => delete subscribers[k]);
  }
}
