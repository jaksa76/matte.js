import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './LandingPage';
import './styles.css';

// Get page configurations from window (injected by server)
declare global {
  interface Window {
    MATTE_LANDING_CONFIG: {
      pages: any[];
    };
  }
}

const config = window.MATTE_LANDING_CONFIG;

if (config && config.pages) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <LandingPage pages={config.pages} />
    </React.StrictMode>
  );
}
