import type { APIServer } from './api';
import type { AuthManager } from './auth';
import type { EntityDefinition } from './entities';
import type { Page } from './view-system';

export interface ServerOptions {
  port?: number;
  appName?: string;
}

/**
 * Server class to handle HTTP requests, serve API and UI components.
 */
export class Server {
  private port: number;
  private appName: string;
  private server?: any;
  private clientBundle?: string;
  private landingBundle?: string;
  private cssBundle?: string;

  constructor(
    private apiServer: APIServer,
    private entities: Map<string, EntityDefinition>,
    private pages: Map<string, Page>,
    private authManager: AuthManager,
    options: ServerOptions = {}
  ) {
    this.port = options.port || 3000;
    this.appName = options.appName || 'Matte.js';
  }

  async start(): Promise<void> {
    // Build client bundles
    await this.buildClient();

    const self = this;
    this.server = Bun.serve({
      port: this.port,
      async fetch(req) {
        const url = new URL(req.url);
        
        // Handle auth API endpoints
        if (url.pathname.startsWith('/api/auth/')) {
          return await self.handleAuthRequest(req);
        }

        // Serve API requests
        if (url.pathname.startsWith('/api/')) {
          return await self.apiServer.handle(req, self.authManager);
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
        const page = Array.from(self.pages.values()).find(p => p.path === path);
        if (page) {
          return new Response(self.renderHTML(), {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        return new Response('Not Found', { status: 404 });
      },
    });

    console.log(`🚀 Server running at http://localhost:${this.server.port}`);
    console.log(`📊 Registered entities: ${Array.from(this.entities.values()).map(e => e.name).join(', ')}`);
    console.log(`📄 Registered pages: ${Array.from(this.pages.values()).map(p => p.name).join(', ')}`);
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = undefined;
    }
  }

  private async handleAuthRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      try {
        const { username, password } = await req.json();
        const token = this.authManager.login(username, password);

        if (!token) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers,
          });
        }

        return new Response(JSON.stringify({ token, username }), {
          status: 200,
          headers: {
            ...headers,
            'Set-Cookie': `matte_session=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
          },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers,
        });
      }
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const cookie = req.headers.get('Cookie');
      const token = this.extractTokenFromCookie(cookie);

      if (token) {
        this.authManager.logout(token);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          ...headers,
          'Set-Cookie': 'matte_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
        },
      });
    }

    // GET /api/auth/session
    if (pathname === '/api/auth/session' && req.method === 'GET') {
      const cookie = req.headers.get('Cookie');
      const token = this.extractTokenFromCookie(cookie);
      const username = token ? this.authManager.validateSession(token) : null;

      return new Response(JSON.stringify({
        authenticated: !!username,
        username: username || undefined,
      }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers,
    });
  }

  private extractTokenFromCookie(cookie: string | null): string | null {
    if (!cookie) return null;

    const match = cookie.match(/matte_session=([^;]+)/);
    return match ? match[1] : null;
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

  private getNavigationPages(): Page[] {
    return Array.from(this.pages.values())
      .filter(p => p.showInNav !== false)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  private renderLandingPage(): string {
    const pages = this.getNavigationPages();
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.appName}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="root"></div>
  <script>
    window.MATTE_LANDING_CONFIG = {
      pages: ${JSON.stringify(pages)},
      appName: ${JSON.stringify(this.appName)}
    };
  </script>
  <script src="/landing.js"></script>
</body>
</html>`;
  }

  private renderHTML(): string {
    const pages = Array.from(this.pages.values()).sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.appName}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="root"></div>
  <script>
    window.MATTE_CONFIG = {
      pages: ${JSON.stringify(pages)},
      appName: ${JSON.stringify(this.appName)}
    };
  </script>
  <script src="/client.js"></script>
</body>
</html>`;
  }
}
