import { useState, useEffect } from 'react';
import type { EntityDefinition } from '../entities';
import type { Page, Display } from '../view-system';
import { ViewDispatcher } from './ViewDispatcher';
import './styles.css';

export interface MultiPageAppProps {
  pages: Page[];
}

export function MultiPageApp({ pages }: MultiPageAppProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string>('');

  // Initialize current page from URL or use first page
  useEffect(() => {
    const path = window.location.pathname.substring(1); // Remove leading slash
    
    const pageFromPath = pages.find(p => p.path === path);
    if (pageFromPath) {
      setCurrentPageId(pageFromPath.id);
    } else if (pages.length > 0) {
      // Default to first page and update URL
      setCurrentPageId(pages[0].id);
      window.history.replaceState({}, '', `/${pages[0].path}`);
    }
  }, [pages]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1);
      const pageFromPath = pages.find(p => p.path === path);
      
      if (pageFromPath) {
        setCurrentPageId(pageFromPath.id);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pages]);

  const handleNavigate = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setCurrentPageId(pageId);
      window.history.pushState({}, '', `/${page.path}`);
    }
  };

  const currentPage = pages.find(p => p.id === currentPageId);
  const navPages = pages.filter(p => p.showInNav !== false);

  if (!currentPage) {
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
          {navPages.map((page) => {
            const isActive = currentPageId === page.id;
            return (
              <li key={page.id} className="nav-item">
                <button
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(page.id)}
                  title={page.name}
                >
                  <span className="nav-icon">{page.icon || '📋'}</span>
                  {!collapsed && <span className="nav-label">{page.name}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className={`entity-content ${collapsed ? 'nav-collapsed' : ''}`}>
        <ViewDispatcher page={currentPage} />
      </main>
    </div>
  );
}
