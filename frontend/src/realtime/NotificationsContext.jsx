import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRealtime } from './RealtimeContext.jsx';

const NotificationsContext = createContext(null);

const MAX_KEEP = 50;

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const { subscribe } = useRealtime();
  // Tracks alert ids we've already shown so we never duplicate, regardless of
  // upstream weirdness (StrictMode, double connects, replays, etc.).
  const seenAlertIdsRef = useRef(new Set());

  const push = useCallback((notif) => {
    setItems((prev) => [notif, ...prev].slice(0, MAX_KEEP));
    setToast(notif);
    window.setTimeout(() => {
      setToast((cur) => (cur && cur.id === notif.id ? null : cur));
    }, 5000);
  }, []);

  useEffect(() => {
    return subscribe((msg) => {
      if (!msg || msg.type !== 'alert') return;
      const a = msg.payload || {};
      // Dedup on alert.id - the backend never reuses ids and broadcasts once.
      if (a.id !== undefined) {
        if (seenAlertIdsRef.current.has(a.id)) return;
        seenAlertIdsRef.current.add(a.id);
      }
      push({
        id: `alert-${a.id ?? Date.now()}`,
        alertId: a.id,
        level: a.risk_level,
        type: a.alert_type,
        message: a.message,
        createdAt: a.created_at,
        read: false,
      });
    });
  }, [subscribe, push]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, markAllRead, toast, dismissToast }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
