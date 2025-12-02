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
  private landingBundle?: string; // Cache the bundled landing page code
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

        // Serve landing page JS bundle
        if (url.pathname === '/landing.js') {
          return new Response(self.landingBundle, {
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
      external: [],
    });

    if (!result.success) {
      console.error('Build errors:', result.logs);
      throw new Error('Failed to build client bundle');
    }

    // Bundle the landing page
    const landingResult = await Bun.build({
      entrypoints: ['./src/framework/ui/landing-client.tsx'],
      outdir: './build',
      minify: false,
      target: 'browser',
      format: 'iife',
      external: [],
    });

    if (!landingResult.success) {
      console.error('Landing build errors:', landingResult.logs);
      throw new Error('Failed to build landing page bundle');
    }

    // Read the bundled files
    this.clientBundle = await Bun.file('./build/client.js').text();
    this.landingBundle = await Bun.file('./build/landing-client.js').text();
    
    // Read and combine CSS files
    const mainCss = await Bun.file('./src/framework/ui/styles.css').text();
    const landingCss = await Bun.file('./src/framework/ui/LandingPage.css').text();
    this.cssBundle = mainCss + '\n\n' + landingCss;
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
</head>
<body>
  <div id="root"></div>
  <script>
    window.MATTE_LANDING_CONFIG = {
      pages: ${JSON.stringify(pages)}
    };
  </script>
  <script src="/landing.js"></script>
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
