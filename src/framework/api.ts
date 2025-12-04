import type { Repository } from './repository';
import type { AuthManager } from './auth';
import type { EntityDefinition, AccessLevel } from './entities';

export interface APIRoute {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

interface AuthContext {
  isAuthenticated: boolean;
  username: string | null;
}

export class APIGenerator {
  private routes: APIRoute[] = [];

  constructor(
    private entity: EntityDefinition,
    private repository: Repository,
    private authManager?: AuthManager
  ) {
    this.generateRoutes();
  }
  
  private extractAuthContext(req: Request): AuthContext {
    const cookie = req.headers.get('Cookie');
    const token = this.extractTokenFromCookie(cookie);
    let username = token && this.authManager ? this.authManager.validateSession(token) : null;
    
    // Fallback to X-Owner-Id header for backward compatibility (mainly for testing)
    if (!username) {
      username = req.headers.get('X-Owner-Id');
    }
    
    return {
      isAuthenticated: !!username,
      username,
    };
  }
  
  private extractTokenFromCookie(cookie: string | null): string | null {
    if (!cookie) return null;
    const match = cookie.match(/matte_session=([^;]+)/);
    return match ? match[1] : null;
  }
  
  private checkReadAccess(authContext: AuthContext, ownerId?: string): boolean {
    const readLevel = this.entity.readLevel || 'unauthenticated';
    
    switch (readLevel) {
      case 'unauthenticated':
        return true;
      case 'authenticated':
        return authContext.isAuthenticated;
      case 'owner':
        return authContext.isAuthenticated && authContext.username === ownerId;
      default:
        return false;
    }
  }
  
  private checkWriteAccess(authContext: AuthContext, ownerId?: string, isCreate = false): boolean {
    const writeLevel = this.entity.writeLevel || 'unauthenticated';
    
    switch (writeLevel) {
      case 'unauthenticated':
        return true;
      case 'authenticated':
        return authContext.isAuthenticated;
      case 'owner':
        // For CREATE operations, just check if user is authenticated (they'll own what they create)
        if (isCreate) {
          return authContext.isAuthenticated;
        }
        // For UPDATE/DELETE operations, check if user is the owner
        return authContext.isAuthenticated && authContext.username === ownerId;
      default:
        return false;
    }
  }
  
  private accessDeniedResponse(): Response {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private generateRoutes(): void {
    const basePath = `/api/${this.toKebabCase(this.entity.name)}`;

    // List all
    this.routes.push({
      method: 'GET',
      path: basePath,
      handler: async (req: Request) => {
        const authContext = this.extractAuthContext(req);
        const readLevel = this.entity.readLevel || 'unauthenticated';
        
        // For owner-level read access, must be authenticated and we filter by owner
        if (readLevel === 'owner') {
          if (!authContext.isAuthenticated) {
            return this.accessDeniedResponse();
          }
          
          // Automatically filter by owner
          const items = await this.repository.findAll({ ownerId: authContext.username });
          return new Response(JSON.stringify(items), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        // For authenticated or unauthenticated, check general access
        if (!this.checkReadAccess(authContext)) {
          return this.accessDeniedResponse();
        }
        
        const url = new URL(req.url);
        const filters: Record<string, any> = {};
        
        // Parse query parameters as filters
        for (const [key, value] of url.searchParams.entries()) {
          filters[key] = value;
        }

        const items = await this.repository.findAll(Object.keys(filters).length > 0 ? filters : undefined);
        return new Response(JSON.stringify(items), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    // Get by ID
    this.routes.push({
      method: 'GET',
      path: `${basePath}/:id`,
      handler: async (req: Request) => {
        const authContext = this.extractAuthContext(req);
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const item = await this.repository.findById(id);
        
        if (!item) {
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        // Check read access
        const ownerId = (item as any).ownerId;
        if (!this.checkReadAccess(authContext, ownerId)) {
          return this.accessDeniedResponse();
        }

        return new Response(JSON.stringify(item), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    // Create
    this.routes.push({
      method: 'POST',
      path: basePath,
      handler: async (req: Request) => {
        const authContext = this.extractAuthContext(req);
        
        // Check write access (isCreate = true)
        if (!this.checkWriteAccess(authContext, undefined, true)) {
          return this.accessDeniedResponse();
        }
        
        const data = await req.json();
        
        // Extract owner_id from context or data
        const ownerId = authContext.username || data.ownerId || 'default-user';
        
        try {
          const item = await this.repository.create(data, ownerId);
          return new Response(JSON.stringify(item), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    });

    // Update
    this.routes.push({
      method: 'PUT',
      path: `${basePath}/:id`,
      handler: async (req: Request) => {
        const authContext = this.extractAuthContext(req);
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // First fetch the item to check ownership
        const existing = await this.repository.findById(id);
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const ownerId = (existing as any).ownerId;
        if (!this.checkWriteAccess(authContext, ownerId)) {
          return this.accessDeniedResponse();
        }

        const data = await req.json();
        
        try {
          const item = await this.repository.update(id, data);
          return new Response(JSON.stringify(item), {
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    });

    // Delete
    this.routes.push({
      method: 'DELETE',
      path: `${basePath}/:id`,
      handler: async (req: Request) => {
        const authContext = this.extractAuthContext(req);
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // First fetch the item to check ownership
        const existing = await this.repository.findById(id);
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const ownerId = (existing as any).ownerId;
        if (!this.checkWriteAccess(authContext, ownerId)) {
          return this.accessDeniedResponse();
        }

        await this.repository.delete(id);
        return new Response(null, { status: 204 });
      },
    });
  }

  getRoutes(): APIRoute[] {
    return this.routes;
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }
}

export class APIServer {
  private routes: Map<string, Map<string, (req: Request) => Promise<Response>>> = new Map();
  private authManager?: AuthManager;

  addEntityRoutes(entity: EntityDefinition, repository: Repository, authManager?: AuthManager): void {
    this.authManager = authManager;
    const generator = new APIGenerator(entity, repository, authManager);
    
    for (const route of generator.getRoutes()) {
      if (!this.routes.has(route.method)) {
        this.routes.set(route.method, new Map());
      }
      this.routes.get(route.method)!.set(route.path, route.handler);
    }
  }

  async handle(req: Request, authManager: AuthManager): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    // Add CORS headers
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id, Cookie',
    });

    // Handle OPTIONS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Extract and validate session
    const cookie = req.headers.get('Cookie');
    const token = this.extractTokenFromCookie(cookie);
    const username = token ? authManager.validateSession(token) : null;

    // Clone request with username header if authenticated
    let modifiedReq = req;
    if (username) {
      const newHeaders = new Headers(req.headers);
      newHeaders.set('X-Owner-Id', username);
      modifiedReq = new Request(req, { headers: newHeaders });
    }

    const methodRoutes = this.routes.get(method);
    
    if (!methodRoutes) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' },
      });
    }

    // Try exact match first
    let handler = methodRoutes.get(pathname);

    // Try pattern matching for :id routes
    if (!handler) {
      for (const [pattern, h] of methodRoutes.entries()) {
        if (pattern.includes(':id')) {
          const regex = new RegExp('^' + pattern.replace(':id', '[^/]+') + '$');
          if (regex.test(pathname)) {
            handler = h;
            break;
          }
        }
      }
    }

    if (!handler) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' },
      });
    }

    try {
      const response = await handler(modifiedReq);
      
      // Add CORS headers to response
      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of headers.entries()) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' },
      });
    }
  }

  private extractTokenFromCookie(cookie: string | null): string | null {
    if (!cookie) return null;

    const match = cookie.match(/matte_session=([^;]+)/);
    return match ? match[1] : null;
  }
}
