import type { Page } from '../view-system';
import './LandingPage.css';

export interface LandingPageProps {
  pages: Page[];
  appName: string;
  authenticated: boolean;
  username: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export function LandingPage({ pages, appName, authenticated, username, onLoginClick, onLogoutClick }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1 className="landing-title">{appName}</h1>
        <p className="landing-subtitle">Full-stack entity management framework</p>
      </div>
      <div className="landing-auth-section">
        {authenticated ? (
          <div className="landing-auth-info">
            <span className="landing-username">👤 {username}</span>
            <button className="landing-logout-button" onClick={onLogoutClick}>
              Logout
            </button>
          </div>
        ) : (
          <button className="landing-login-button" onClick={onLoginClick}>
            🔑 Login
          </button>
        )}
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
                <p className="page-card-info">{page.display.displayId} view</p>
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
