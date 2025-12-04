import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './LandingPage';
import { LoginDialog } from './LoginDialog';
import './styles.css';

// Get page configurations from window (injected by server)
declare global {
  interface Window {
    MATTE_LANDING_CONFIG: {
      pages: any[];
      appName: string;
    };
  }
}

function LandingApp() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>('');
  const config = window.MATTE_LANDING_CONFIG;

  // Check session status on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setAuthenticated(data.authenticated);
        setUsername(data.username || '');
      }
    } catch (err) {
      console.error('Failed to check session:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthenticated(false);
      setUsername('');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleLoginSuccess = (loggedInUsername: string) => {
    setAuthenticated(true);
    setUsername(loggedInUsername);
  };

  return (
    <>
      <LandingPage 
        pages={config.pages}
        appName={config.appName}
        authenticated={authenticated}
        username={username}
        onLoginClick={() => setShowLoginDialog(true)}
        onLogoutClick={handleLogout}
      />
      {showLoginDialog && (
        <LoginDialog
          onClose={() => setShowLoginDialog(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

const config = window.MATTE_LANDING_CONFIG;

if (config && config.pages) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <LandingApp />
    </React.StrictMode>
  );
}
