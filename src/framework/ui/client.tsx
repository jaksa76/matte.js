import React from 'react';
import ReactDOM from 'react-dom/client';
import { EntityApp } from './EntityApp';
import './styles.css';

// Get entity definition from window (injected by server)
declare global {
  interface Window {
    ENTITY_CONFIG: {
      entity: any;
      apiUrl: string;
    };
  }
}

const config = window.ENTITY_CONFIG;

if (config) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <EntityApp entity={config.entity} apiUrl={config.apiUrl} />
    </React.StrictMode>
  );
}
