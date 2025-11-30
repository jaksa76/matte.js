import { useState, useEffect } from 'react';
import type { EntityDefinition } from '../entities';
import { EntityApp } from './EntityApp';
import './styles.css';

export interface MultiEntityAppProps {
  entities: EntityDefinition[];
}

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
}

export function MultiEntityApp({ entities }: MultiEntityAppProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [currentEntityName, setCurrentEntityName] = useState<string>('');

  // Initialize current entity from URL or use first entity
  useEffect(() => {
    const path = window.location.pathname;
    const entityFromPath = path.split('/')[1];
    
    if (entityFromPath && entities.some(e => toKebabCase(e.name) === entityFromPath)) {
      setCurrentEntityName(entityFromPath);
    } else if (entities.length > 0) {
      // Default to first entity and update URL
      const defaultEntity = toKebabCase(entities[0].name);
      setCurrentEntityName(defaultEntity);
      window.history.replaceState({}, '', `/${defaultEntity}`);
    }
  }, [entities]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const entityFromPath = path.split('/')[1];
      
      if (entityFromPath && entities.some(e => toKebabCase(e.name) === entityFromPath)) {
        setCurrentEntityName(entityFromPath);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [entities]);

  const handleNavigate = (entityName: string) => {
    const kebabName = toKebabCase(entityName);
    setCurrentEntityName(kebabName);
    window.history.pushState({}, '', `/${kebabName}`);
  };

  const currentEntity = entities.find(e => toKebabCase(e.name) === currentEntityName);

  if (!currentEntity) {
    return (
      <div className="multi-entity-app">
        <div className="loading-container">Loading...</div>
      </div>
    );
  }

  return (
    <div className="multi-entity-app">
      <nav className={`entity-nav ${collapsed ? 'collapsed' : ''}`}>
        <div className="nav-header">
          <h1 className="nav-title">{collapsed ? 'M' : 'Matte.js'}</h1>
          <button 
            className="nav-toggle" 
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <ul className="nav-list">
          {entities.map((entity) => {
            const kebabName = toKebabCase(entity.name);
            const isActive = currentEntityName === kebabName;
            return (
              <li key={entity.name} className="nav-item">
                <button
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(entity.name)}
                  title={entity.name}
                >
                  <span className="nav-icon">📋</span>
                  {!collapsed && <span className="nav-label">{entity.name}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className={`entity-content ${collapsed ? 'nav-collapsed' : ''}`}>
        <EntityApp 
          entity={currentEntity} 
          apiUrl={`/api/${currentEntityName}`} 
        />
      </main>
    </div>
  );
}
