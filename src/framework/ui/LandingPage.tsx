import type { Page } from '../view-system';
import './LandingPage.css';

export interface LandingPageProps {
  pages: Page[];
}

export function LandingPage({ pages }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1 className="landing-title">Matte.js</h1>
        <p className="landing-subtitle">Full-stack entity management framework</p>
      </div>
      <div className="pages-section">
        <h2>Available Pages</h2>
        {pages.length > 0 ? (
          <div className="pages-grid">
            {pages.map((page) => (
              <a key={page.id} href={`/${page.path}`} className="page-card">
                <h3 className="page-card-title">
                  {page.icon || '📋'} {page.name}
                </h3>
                <p className="page-card-info">{page.view.viewId} view</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No pages registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
