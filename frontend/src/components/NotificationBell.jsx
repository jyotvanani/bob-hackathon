import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../realtime/NotificationsContext.jsx';
import { useRealtime } from '../realtime/RealtimeContext.jsx';
import RiskBadge from './RiskBadge.jsx';
import { formatDate } from '../utils/formatDate';

export default function NotificationBell() {
  const { items, unreadCount, markAllRead } = useNotifications();
  const { connected } = useRealtime();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next) markAllRead();
      return next;
    });
  }

  return (
    <div className="bell-wrap" ref={wrapperRef}>
      <button
        type="button"
        className="bell-btn"
        onClick={toggle}
        aria-label="Notifications"
        title={connected ? 'Live (WebSocket connected)' : 'Reconnecting...'}
      >
        <span className="bell-icon">🔔</span>
        <span className={`bell-dot ${connected ? 'bell-dot-live' : 'bell-dot-off'}`} />
        {unreadCount > 0 && <span className="bell-count">{unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-panel glass">
          <div className="bell-panel-header">
            <strong>Alerts</strong>
            <span className="muted small">
              {items.length === 0 ? 'No alerts yet' : `${items.length} recent`}
            </span>
          </div>
          <div className="bell-list">
            {items.length === 0 ? (
              <div className="bell-empty muted">
                You'll see new alerts here in real time.
              </div>
            ) : (
              items.map((n) => (
                <div key={n.id} className="bell-item">
                  <div className="bell-item-row">
                    <span className="bell-item-type">{n.type}</span>
                    <RiskBadge level={n.level} />
                  </div>
                  <div className="bell-item-msg">{n.message}</div>
                  <div className="bell-item-meta muted small">
                    {formatDate(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
