import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { RealtimeProvider } from './realtime/RealtimeContext.jsx';
import { NotificationsProvider } from './realtime/NotificationsContext.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <NotificationsProvider>
            <App />
            <NotificationToast />
          </NotificationsProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
