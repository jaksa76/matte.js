import { SQLiteAdapter } from './database';
import { RepositoryFactory } from './repository';
import { APIServer } from './api';
import { Server } from './server';
import { AuthManager } from './auth';
import type { EntityDefinition } from './entities';
import type { Page, Display, EntityDisplay } from './view-system';
import { createPage, createEntityDisplay } from './view-system';

export interface MatteOptions {
  dbPath?: string;
  port?: number;
  defaultView?: 'grid' | 'list';
  appName?: string;
}

export class Matte {
  private entities = new Map<string, EntityDefinition>();
  private pages = new Map<string, Page>();
  private db: SQLiteAdapter;
  private repositoryFactory: RepositoryFactory;
  private apiServer: APIServer;
  private server: Server;
  private defaultView: 'grid' | 'list';
  private initialized = false;
  public auth: AuthManager;
  public readonly appName: string;

  constructor(options: MatteOptions | string = {}) {
    // Allow passing app name as first parameter for convenience
    const opts = typeof options === 'string' ? { appName: options } : options;
    
    this.appName = opts.appName || 'Matte.js';
    this.db = new SQLiteAdapter(opts.dbPath);
    this.repositoryFactory = new RepositoryFactory(this.db);
    this.apiServer = new APIServer();
    this.auth = new AuthManager();
    this.server = new Server(this.apiServer, this.entities, this.pages, this.auth, { port: opts.port, appName: this.appName });
    this.defaultView = opts.defaultView || 'grid';
  }

  /**
   * Register a page or entity with the framework.
   * - If a Page is provided, it's registered directly
   * - If an EntityDefinition is provided, a default page is created with the configured default view
   */
  register(pageOrEntity: Page | EntityDefinition): void {
    if (this.isPage(pageOrEntity)) {
      // Register the page
      this.pages.set(pageOrEntity.id, pageOrEntity);
      
      // Extract and register the entity from the display
      const display = pageOrEntity.display;
      if (display.displayType === 'entity' || display.displayType === 'instance') {
        this.entities.set(display.entity.name, display.entity);
      }
    } else {
      // Create a default page for the entity
      const entity = pageOrEntity;
      this.entities.set(entity.name, entity);
      
      // Create default page with configured default view
      const display = createEntityDisplay(this.defaultView, entity, {
        displayName: `${entity.name} ${this.defaultView === 'grid' ? 'Grid' : 'List'}`,
      });
      
      const page = createPage(
        `${entity.name}-${this.defaultView}`,
        entity.name,
        this.toKebabCase(entity.name),
        display
      );
      
      this.pages.set(page.id, page);
    }
  }

  private isPage(obj: any): obj is Page {
    return obj && typeof obj === 'object' && 'id' in obj && 'path' in obj && 'display' in obj;
  }

  async start(): Promise<void> {
    if (this.initialized) return;

    await this.db.initialize();

    // Get all registered entities
    const entities = Array.from(this.entities.values());

    // Create tables for all entities
    for (const entity of entities) {
      await this.db.createTable(entity);
      
      // Create repository and register API routes
      const repository = this.repositoryFactory.create(entity);
      this.apiServer.addEntityRoutes(entity, repository);
    }

    this.initialized = true;

    // Delegate to server
    await this.server.start();
  }

  stop(): void {
    this.server.stop();
  }

  close(): void {
    this.stop();
    this.db.close();
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }

  getRepository<T = any>(entityName: string): any {
    const entity = this.entities.get(entityName);
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }
    return this.repositoryFactory.create<T>(entity);
  }
}
