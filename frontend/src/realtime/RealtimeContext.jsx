import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const RealtimeContext = createContext(null);

function buildWsUrl() {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  try {
    const u = new URL(apiBase);
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${u.host}/ws`;
  } catch (_) {
    return 'ws://localhost:8000/ws';
  }
}

export function RealtimeProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set());

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    // Everything below is scoped to ONE effect run. StrictMode dev mounts ->
    // cleans up -> mounts again; locals make sure stale closures from the
    // first run cannot revive themselves after the second run starts.
    let cancelled = false;
    let reconnectTimer = null;
    let reconnectMs = 1000;
    let currentWs = null;

    function connect() {
      if (cancelled) return;
      let ws;
      try {
        ws = new WebSocket(buildWsUrl());
      } catch (_) {
        if (!cancelled) reconnectTimer = window.setTimeout(connect, 2000);
        return;
      }
      currentWs = ws;

      ws.onopen = () => {
        if (cancelled || ws !== currentWs) {
          try { ws.close(); } catch (_) { /* ignore */ }
          return;
        }
        setConnected(true);
        reconnectMs = 1000;
      };

      ws.onmessage = (evt) => {
        if (cancelled || ws !== currentWs) return;
        let data;
        try {
          data = JSON.parse(evt.data);
        } catch (_) {
          return;
        }
        listenersRef.current.forEach((fn) => {
          try {
            fn(data);
          } catch (_) {
            /* ignore listener errors */
          }
        });
      };

      ws.onclose = () => {
        if (cancelled || ws !== currentWs) return;
        setConnected(false);
        const delay = reconnectMs;
        reconnectMs = Math.min(reconnectMs * 1.6, 8000);
        reconnectTimer = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        try { ws.close(); } catch (_) { /* ignore */ }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      const ws = currentWs;
      currentWs = null;
      if (ws) {
        // Detach handlers BEFORE closing so a delayed close event can't
        // trigger the reconnect timer in this stale closure.
        try { ws.onopen = null; } catch (_) { /* ignore */ }
        try { ws.onmessage = null; } catch (_) { /* ignore */ }
        try { ws.onclose = null; } catch (_) { /* ignore */ }
        try { ws.onerror = null; } catch (_) { /* ignore */ }
        try { ws.close(); } catch (_) { /* ignore */ }
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}

/** Subscribe to a single message type and call `handler` for each payload. */
export function useRealtimeEvent(type, handler) {
  const { subscribe } = useRealtime();
  useEffect(() => {
    return subscribe((msg) => {
      if (msg && msg.type === type) handler(msg.payload);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, handler]);
}
