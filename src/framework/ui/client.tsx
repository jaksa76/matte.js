import React from 'react';
import ReactDOM from 'react-dom/client';
import { MultiEntityApp } from './MultiEntityApp';
import './styles.css';

// Get entity definitions from window (injected by server)
declare global {
  interface Window {
    ENTITY_CONFIG: {
      entities: any[];
    };
  }
}

const config = window.ENTITY_CONFIG;

if (config && config.entities) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <MultiEntityApp entities={config.entities} />
    </React.StrictMode>
  );
}
