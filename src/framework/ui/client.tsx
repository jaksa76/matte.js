import React from 'react';
import ReactDOM from 'react-dom/client';
import { MultiPageApp } from './MultiPageApp';
import './styles.css';

// Get page configurations from window (injected by server)
declare global {
  interface Window {
    MATTE_CONFIG: {
      pages: any[];
    };
  }
}

const config = window.MATTE_CONFIG;

if (config && config.pages) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <MultiPageApp pages={config.pages} />
    </React.StrictMode>
  );
}
