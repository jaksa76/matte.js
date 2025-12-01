import { EntityRegistry } from './registry';
import { PageRegistry } from './page-registry';
import { SQLiteAdapter } from './database';
import { RepositoryFactory } from './repository';
import { APIServer } from './api';
import type { EntityDefinition } from './entities';
import type { Page, View, EntityView } from './view-system';
import { createPage, createEntityView } from './view-system';

export interface MatteOptions {
  dbPath?: string;
  port?: number;
  defaultView?: 'grid' | 'list';
}

export class Matte {
  private db: SQLiteAdapter;
  private repositoryFactory: RepositoryFactory;
  private apiServer: APIServer;
  private port: number;
  private defaultView: 'grid' | 'list';
  private initialized = false;
  private server?: any; // Store server reference for cleanup
  private clientBundle?: string; // Cache the bundled client code
  private cssBundle?: string; // Cache the CSS

  constructor(options: MatteOptions = {}) {
    this.db = new SQLiteAdapter(options.dbPath);
    this.repositoryFactory = new RepositoryFactory(this.db);
    this.apiServer = new APIServer();
    this.port = options.port || 3000;
    this.defaultView = options.defaultView || 'grid';
  }

  /**
   * Register a page or entity with the framework.
   * - If a Page is provided, it's registered directly
   * - If an EntityDefinition is provided, a default page is created with the configured default view
   */
  register(pageOrEntity: Page | EntityDefinition): void {
    if (this.isPage(pageOrEntity)) {
      // Register the page
      PageRegistry.register(pageOrEntity);
      
      // Extract and register the entity from the view
      const view = pageOrEntity.view;
      if (view.viewType === 'entity' || view.viewType === 'instance') {
        EntityRegistry.register(view.entity);
      }
    } else {
      // Create a default page for the entity
      const entity = pageOrEntity;
      EntityRegistry.register(entity);
      
      // Create default page with configured default view
      const view = createEntityView(this.defaultView, entity, {
        displayName: `${entity.name} ${this.defaultView === 'grid' ? 'Grid' : 'List'}`,
      });
      
      const page = createPage(
        `${entity.name}-${this.defaultView}`,
        entity.name,
        this.toKebabCase(entity.name),
        view
      );
      
      PageRegistry.register(page);
    }
  }

  private isPage(obj: any): obj is Page {
    return obj && typeof obj === 'object' && 'id' in obj && 'path' in obj && 'view' in obj;
  }

  async start(): Promise<void> {
    if (this.initialized) return;

    await this.db.initialize();

    // Build client bundle
    await this.buildClient();

    // Get all registered entities
    const entities = EntityRegistry.getAll();

    // Create tables for all entities
    for (const entity of entities) {
      await this.db.createTable(entity);
      
      // Create repository and register API routes
      const repository = this.repositoryFactory.create(entity);
      this.apiServer.addEntityRoutes(entity, repository);
    }

    this.initialized = true;

    const self = this;
    this.server = Bun.serve({
      port: this.port,
      async fetch(req) {
        const url = new URL(req.url);
        
        // Serve API requests
        if (url.pathname.startsWith('/api/')) {
          return await self.apiServer.handle(req);
        }

        // Serve client JS bundle
        if (url.pathname === '/client.js') {
          return new Response(self.clientBundle, {
            headers: { 'Content-Type': 'application/javascript' },
          });
        }

        // Serve CSS
        if (url.pathname === '/styles.css') {
          return new Response(self.cssBundle, {
            headers: { 'Content-Type': 'text/css' },
          });
        }

        // Serve landing page at root
        if (url.pathname === '/' || url.pathname === '/index.html') {
          return new Response(self.renderLandingPage(), {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        // Serve page routes - check if path matches a registered page
        const path = url.pathname.substring(1); // Remove leading slash
        const page = PageRegistry.getByPath(path);
        if (page) {
          return new Response(self.renderHTML(), {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        return new Response('Not Found', { status: 404 });
      },
    });

    console.log(`🚀 Server running at http://localhost:${this.server.port}`);
    console.log(`📊 Registered entities: ${entities.map(e => e.name).join(', ')}`);
    console.log(`📄 Registered pages: ${PageRegistry.getAll().map(p => p.name).join(', ')}`);
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = undefined;
    }
  }

  close(): void {
    this.stop();
    this.db.close();
  }

  private async buildClient(): Promise<void> {
    // Bundle the React client
    const result = await Bun.build({
      entrypoints: ['./src/framework/ui/client.tsx'],
      outdir: './build',
      minify: false,
      target: 'browser',
      format: 'iife',
      globalName: 'MatteUI',
      external: [],
    });

    if (!result.success) {
      console.error('Build errors:', result.logs);
      throw new Error('Failed to build client bundle');
    }

    // Read the bundled file
    this.clientBundle = await Bun.file('./build/client.js').text();
    
    // Read the CSS file
    this.cssBundle = await Bun.file('./src/framework/ui/styles.css').text();
  }

  private renderLandingPage(): string {
    const pages = PageRegistry.getNavigationPages();
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matte.js</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .landing-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .landing-header {
      text-align: center;
      margin-bottom: 50px;
    }
    .landing-title {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 10px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .landing-subtitle {
      font-size: 18px;
      color: #666;
      margin: 0;
    }
    .pages-section {
      margin-top: 40px;
    }
    .pages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .page-card {
      background: white;
      border: 2px solid #e1e4e8;
      border-radius: 8px;
      padding: 24px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      display: block;
    }
    .page-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    .page-card-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #24292e;
    }
    .page-card-info {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="landing-page">
    <div class="landing-header">
      <h1 class="landing-title">Matte.js</h1>
      <p class="landing-subtitle">Full-stack entity management framework</p>
    </div>
    <div class="pages-section">
      <h2>Available Pages</h2>
      ${pages.length > 0 ? `
      <div class="pages-grid">
        ${pages.map(p => `
        <a href="/${p.path}" class="page-card">
          <h3 class="page-card-title">${p.icon || '📋'} ${p.name}</h3>
          <p class="page-card-info">${p.view.viewId} view</p>
        </a>
        `).join('')}
      </div>
      ` : `
      <div class="empty-state">
        <p>No pages registered yet.</p>
      </div>
      `}
    </div>
  </div>
</body>
</html>`;
  }

  private renderHTML(): string {
    const pages = PageRegistry.getAll();
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matte.js - Entity Management</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="root"></div>
  <script>
    window.MATTE_CONFIG = {
      pages: ${JSON.stringify(pages)}
    };
  </script>
  <script src="/client.js"></script>
</body>
</html>`;
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }

  getRepository<T = any>(entityName: string): any {
    const entity = EntityRegistry.get(entityName);
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }
    return this.repositoryFactory.create<T>(entity);
  }
}
