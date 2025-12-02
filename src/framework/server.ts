import type { APIServer } from './api';
import type { EntityDefinition } from './entities';
import type { Page } from './view-system';

export interface ServerOptions {
  port?: number;
}

/**
 * Server class to handle HTTP requests, serve API and UI components.
 */
export class Server {
  private port: number;
  private server?: any;
  private clientBundle?: string;
  private landingBundle?: string;
  private cssBundle?: string;

  constructor(
    private apiServer: APIServer,
    private entities: Map<string, EntityDefinition>,
    private pages: Map<string, Page>,
    options: ServerOptions = {}
  ) {
    this.port = options.port || 3000;
  }

  async start(): Promise<void> {
    // Build client bundles
    await this.buildClient();

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
}
