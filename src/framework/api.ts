import type { Repository } from './repository';
import type { AuthManager } from './auth';
import type { EntityDefinition } from './entities';

export interface APIRoute {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export class APIGenerator {
  private routes: APIRoute[] = [];

  constructor(
    private entity: EntityDefinition,
    private repository: Repository
  ) {
    this.generateRoutes();
  }

  private generateRoutes(): void {
    const basePath = `/api/${this.toKebabCase(this.entity.name)}`;

    // List all
    this.routes.push({
      method: 'GET',
      path: basePath,
      handler: async (req: Request) => {
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
        const data = await req.json();
        
        // Extract owner_id from headers or data
        const ownerId = req.headers.get('X-Owner-Id') || data.ownerId || 'default-user';
        
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
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
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
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
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

  addEntityRoutes(entity: EntityDefinition, repository: Repository): void {
    const generator = new APIGenerator(entity, repository);
    
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
