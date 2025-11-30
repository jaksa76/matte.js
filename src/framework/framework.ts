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

  constructor(options: FrameworkOptions = {}) {
    this.db = new SQLiteAdapter(options.dbPath);
    this.repositoryFactory = new RepositoryFactory(this.db);
    this.apiServer = new APIServer();
    this.port = options.port || 3000;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.db.initialize();

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

  private renderHTML(): string {
    const entities = EntityRegistry.getAll();
    const entityName = entities[0]?.name || 'Entity';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entityName} Management - Matte.js</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    button {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
    }
    button:hover:not(:disabled) {
      background-color: #0056b3;
    }
    button:disabled {
      opacity: 0.6;
    }
    input, select, textarea {
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;

    function App() {
      const [mode, setMode] = useState('list');
      const [items, setItems] = useState([]);
      const [selectedItem, setSelectedItem] = useState(null);
      const [loading, setLoading] = useState(true);

      const entity = ${JSON.stringify(entities[0])};
      const apiUrl = '/api/${this.toKebabCase(entityName)}';

      useEffect(() => {
        if (mode === 'list') {
          fetchItems();
        }
      }, [mode]);

      const fetchItems = async () => {
        try {
          setLoading(true);
          const response = await fetch(apiUrl);
          const data = await response.json();
          setItems(data);
        } catch (err) {
          console.error('Failed to fetch items:', err);
        } finally {
          setLoading(false);
        }
      };

      const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
          await fetch(\`\${apiUrl}/\${id}\`, { method: 'DELETE' });
          fetchItems();
        } catch (err) {
          alert('Failed to delete: ' + err.message);
        }
      };

      if (mode === 'list') {
        return (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1>{entity.name}s</h1>
              <button onClick={() => setMode('create')}>Create New</button>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : items.length === 0 ? (
              <p>No items found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    {Object.keys(entity.schema).slice(0, 4).map(field => (
                      <th key={field} style={{ padding: '12px', textAlign: 'left' }}>{field}</th>
                    ))}
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      {Object.keys(entity.schema).slice(0, 4).map(field => (
                        <td key={field} style={{ padding: '12px' }}>
                          {item[field] !== null && item[field] !== undefined ? String(item[field]) : '-'}
                        </td>
                      ))}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => { setSelectedItem(item); setMode('detail'); }} style={{ marginRight: '8px' }}>View</button>
                        <button onClick={() => { setSelectedItem(item); setMode('edit'); }} style={{ marginRight: '8px' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#dc3545' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      }

      if (mode === 'detail' && selectedItem) {
        return (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1>{entity.name} Details</h1>
              <div>
                <button onClick={() => setMode('list')} style={{ marginRight: '8px' }}>Back</button>
                <button onClick={() => setMode('edit')}>Edit</button>
              </div>
            </div>
            <div style={{ maxWidth: '600px' }}>
              {Object.entries(entity.schema).map(([field]) => (
                <div key={field} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <strong>{field}:</strong> {selectedItem[field] !== null && selectedItem[field] !== undefined ? String(selectedItem[field]) : 'Not set'}
                </div>
              ))}
            </div>
          </div>
        );
      }

      return <EntityForm entity={entity} apiUrl={apiUrl} initialData={selectedItem} onSuccess={() => setMode('list')} onCancel={() => setMode('list')} />;
    }

    function EntityForm({ entity, apiUrl, initialData, onSuccess, onCancel }) {
      const [formData, setFormData] = useState(initialData || {});
      const [submitting, setSubmitting] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          const method = initialData?.id ? 'PUT' : 'POST';
          const url = initialData?.id ? \`\${apiUrl}/\${initialData.id}\` : apiUrl;
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          if (!response.ok) throw new Error('Failed to save');
          onSuccess();
        } catch (err) {
          alert('Error: ' + err.message);
        } finally {
          setSubmitting(false);
        }
      };

      return (
        <div style={{ padding: '20px' }}>
          <h1>{initialData?.id ? 'Edit' : 'Create'} {entity.name}</h1>
          <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
            {Object.entries(entity.schema).map(([field, def]) => (
              <div key={field} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  {field}{def.required && <span style={{ color: 'red' }}> *</span>}
                </label>
                {def.type === 'enum' ? (
                  <select value={formData[field] || ''} onChange={(e) => setFormData({...formData, [field]: e.target.value})} style={{ width: '100%', padding: '8px' }}>
                    <option value="">Select...</option>
                    {def.values.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : def.type === 'number' ? (
                  <input type="number" value={formData[field] || ''} onChange={(e) => setFormData({...formData, [field]: parseFloat(e.target.value)})} style={{ width: '100%', padding: '8px' }} />
                ) : def.type === 'date' ? (
                  <input type="date" value={formData[field]?.split('T')[0] || ''} onChange={(e) => setFormData({...formData, [field]: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                ) : def.type === 'richtext' ? (
                  <textarea value={formData[field] || ''} onChange={(e) => setFormData({...formData, [field]: e.target.value})} rows={6} style={{ width: '100%', padding: '8px' }} />
                ) : (
                  <input type="text" value={formData[field] || ''} onChange={(e) => setFormData({...formData, [field]: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                )}
              </div>
            ))}
            <div style={{ marginTop: '24px' }}>
              <button type="submit" disabled={submitting} style={{ marginRight: '8px' }}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d' }}>Cancel</button>
            </div>
          </form>
        </div>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
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
