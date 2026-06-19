import React from 'react';
import { useNotifications } from '../realtime/NotificationsContext.jsx';
import RiskBadge from './RiskBadge.jsx';

export default function NotificationToast() {
  const { toast, dismissToast } = useNotifications();
  if (!toast) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <div className={`toast glass toast-${(toast.level || 'medium').toLowerCase()}`}>
        <div className="toast-header">
          <span className="toast-title">🚨 New {toast.type} alert</span>
          <RiskBadge level={toast.level} />
          <button type="button" className="toast-close" onClick={dismissToast}>
            ×
          </button>
        </div>
        <div className="toast-message">{toast.message}</div>
      </div>
    </div>
  );
}
