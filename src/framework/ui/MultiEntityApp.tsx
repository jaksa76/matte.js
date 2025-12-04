import { useState, useEffect } from 'react';
import type { EntityDefinition } from '../entities';
import { EntityApp } from './EntityApp';
import './styles.css';

export interface EntityRegistration {
  entity: EntityDefinition;
  viewType: 'grid' | 'list';
}

export interface MultiEntityAppProps {
  entities: EntityRegistration[];
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
    
    if (entityFromPath && entities.some(r => toKebabCase(r.entity.name) === entityFromPath)) {
      setCurrentEntityName(entityFromPath);
    } else if (entities.length > 0) {
      // Default to first entity and update URL
      const defaultEntity = toKebabCase(entities[0].entity.name);
      setCurrentEntityName(defaultEntity);
      window.history.replaceState({}, '', `/${defaultEntity}`);
    }
  }, [entities]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const entityFromPath = path.split('/')[1];
      
      if (entityFromPath && entities.some(r => toKebabCase(r.entity.name) === entityFromPath)) {
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

  const currentRegistration = entities.find(r => toKebabCase(r.entity.name) === currentEntityName);

  if (!currentRegistration) {
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
          <button
            className="home-button"
            onClick={() => window.location.href = '/'}
            title="Home"
            aria-label="Home"
          >
            🏠
          </button>
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
          {entities.map((registration) => {
            const kebabName = toKebabCase(registration.entity.name);
            const isActive = currentEntityName === kebabName;
            return (
              <li key={registration.entity.name} className="nav-item">
                <button
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(registration.entity.name)}
                  title={registration.entity.name}
                >
                  <span className="nav-icon">📋</span>
                  {!collapsed && <span className="nav-label">{registration.entity.name}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className={`entity-content ${collapsed ? 'nav-collapsed' : ''}`}>
        <EntityApp 
          entity={currentRegistration.entity}
          viewType={currentRegistration.viewType}
          apiUrl={`/api/${currentEntityName}`} 
        />
      </main>
    </div>
  );
}
