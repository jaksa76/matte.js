import { EntityRegistry } from './registry';
import { SQLiteAdapter } from './database';
import { RepositoryFactory } from './repository';
import { APIServer } from './api';
import type { EntityDefinition } from './entities';

export interface FrameworkOptions {
  dbPath?: string;
  port?: number;
}

export class Framework {
  private db: SQLiteAdapter;
  private repositoryFactory: RepositoryFactory;
  private apiServer: APIServer;
  private port: number;
  private initialized = false;
  private server?: any; // Store server reference for cleanup
  private clientBundle?: string; // Cache the bundled client code
  private cssBundle?: string; // Cache the CSS

  constructor(options: FrameworkOptions = {}) {
    this.db = new SQLiteAdapter(options.dbPath);
    this.repositoryFactory = new RepositoryFactory(this.db);
    this.apiServer = new APIServer();
    this.port = options.port || 3000;
  }

  async initialize(): Promise<void> {
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
  }

  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

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

        // Serve UI
        if (url.pathname === '/' || url.pathname === '/index.html') {
          return new Response(self.renderHTML(), {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        return new Response('Not Found', { status: 404 });
      },
    });

    console.log(`🚀 Server running at http://localhost:${this.server.port}`);
    console.log(`📊 Registered entities: ${EntityRegistry.getAll().map(e => e.name).join(', ')}`);
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

  private renderHTML(): string {
    const entities = EntityRegistry.getAll();
    const entityName = entities[0]?.name || 'Entity';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entityName} Management - Matte.js</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="root"></div>
  <script>
    window.ENTITY_CONFIG = {
      entity: ${JSON.stringify(entities[0])},
      apiUrl: '/api/${this.toKebabCase(entityName)}'
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
