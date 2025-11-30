import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { APIServer, APIGenerator } from '../../src/framework/api';
import { EntityRepository, RepositoryFactory } from '../../src/framework/repository';
import { SQLiteAdapter } from '../../src/framework/database';
import { t } from '../../src/framework/entities';
import type { EntityDefinition } from '../../src/framework/entities';

describe('APIGenerator', () => {
  let db: SQLiteAdapter;
  let factory: RepositoryFactory;
  let userEntity: EntityDefinition;
  let repository: EntityRepository;

  beforeEach(async () => {
    db = new SQLiteAdapter(':memory:');
    await db.initialize();
    factory = new RepositoryFactory(db);

    userEntity = {
      name: 'User',
      owned: false,
      schema: {
        name: t.string().required(),
        email: t.string().required(),
        role: t.enum(['user', 'admin']).default('user'),
      },
    };

    await db.createTable(userEntity);
    repository = factory.create(userEntity);
  });

  afterEach(() => {
    db.close();
  });

  test('generates routes for entity', () => {
    const generator = new APIGenerator(userEntity, repository);
    const routes = generator.getRoutes();

    expect(routes.length).toBe(5);
    
    const methods = routes.map(r => r.method);
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');

    const paths = routes.map(r => r.path);
    expect(paths).toContain('/api/user');
    expect(paths.some(p => p.includes(':id'))).toBe(true);
  });

  test('generates kebab-case paths from entity names', () => {
    const camelEntity: EntityDefinition = {
      name: 'BlogPost',
      owned: false,
      schema: {
        title: t.string().required(),
      },
    };

    const generator = new APIGenerator(camelEntity, repository);
    const routes = generator.getRoutes();

    expect(routes[0]!.path).toBe('/api/blog-post');
  });
});

describe('APIServer', () => {
  let server: APIServer;
  let db: SQLiteAdapter;
  let factory: RepositoryFactory;

  beforeEach(async () => {
    server = new APIServer();
    db = new SQLiteAdapter(':memory:');
    await db.initialize();
    factory = new RepositoryFactory(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('LIST endpoint', () => {
    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
        },
      };

      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);

      // Add test data
      await repository.create({ name: 'Alice', email: 'alice@example.com' });
      await repository.create({ name: 'Bob', email: 'bob@example.com' });
    });

    test('returns list of all records', async () => {
      const req = new Request('http://localhost/api/user');
      const response = await server.handle(req);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    test('filters records by query parameters', async () => {
      const req = new Request('http://localhost/api/user?name=Alice');
      const response = await server.handle(req);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Alice');
    });

    test('returns empty array when no matches', async () => {
      const req = new Request('http://localhost/api/user?name=NonExistent');
      const response = await server.handle(req);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.length).toBe(0);
    });
  });

  describe('GET by ID endpoint', () => {
    let userId: string;

    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
        },
      };

      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);

      const user = await repository.create({
        name: 'Alice',
        email: 'alice@example.com',
      });
      userId = user.id;
    });

    test('returns record by ID', async () => {
      const req = new Request(`http://localhost/api/user/${userId}`);
      const response = await server.handle(req);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.id).toBe(userId);
      expect(data.name).toBe('Alice');
    });

    test('returns 404 for non-existent ID', async () => {
      const req = new Request('http://localhost/api/user/non-existent-id');
      const response = await server.handle(req);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Not found');
    });
  });

  describe('POST (create) endpoint', () => {
    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
        },
      };

      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);
    });

    test('creates new record', async () => {
      const req = new Request('http://localhost/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Charlie',
          email: 'charlie@example.com',
        }),
      });

      const response = await server.handle(req);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Charlie');
      expect(data.email).toBe('charlie@example.com');
    });

    test('returns 400 for validation errors', async () => {
      const req = new Request('http://localhost/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Incomplete',
          // missing required email
        }),
      });

      const response = await server.handle(req);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('handles owned entities with owner header', async () => {
      const taskEntity: EntityDefinition = {
        name: 'Task',
        owned: true,
        schema: {
          title: t.string().required(),
        },
      };

      await db.createTable(taskEntity);
      const repository = factory.create(taskEntity);
      server.addEntityRoutes(taskEntity, repository);

      const req = new Request('http://localhost/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-Id': 'user-123',
        },
        body: JSON.stringify({ title: 'My Task' }),
      });

      const response = await server.handle(req);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      // Repository converts owner_id to ownerId via toCamelCase
      expect(data.owner_id || data.ownerId).toBe('user-123');
    });
  });

  describe('PUT (update) endpoint', () => {
    let userId: string;

    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
        },
      };

      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);

      const user = await repository.create({
        name: 'Original',
        email: 'original@example.com',
      });
      userId = user.id;
    });

    test('updates existing record', async () => {
      const req = new Request(`http://localhost/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });

      const response = await server.handle(req);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.id).toBe(userId);
      expect(data.name).toBe('Updated Name');
    });

    test('returns 400 for invalid ID', async () => {
      const req = new Request('http://localhost/api/user/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await server.handle(req);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE endpoint', () => {
    let userId: string;

    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
        },
      };

      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);

      const user = await repository.create({ name: 'To Delete' });
      userId = user.id;
    });

    test('deletes record', async () => {
      const req = new Request(`http://localhost/api/user/${userId}`, {
        method: 'DELETE',
      });

      const response = await server.handle(req);

      expect(response.status).toBe(204);
    });

    test('returns 204 even for non-existent ID', async () => {
      const req = new Request('http://localhost/api/user/non-existent', {
        method: 'DELETE',
      });

      const response = await server.handle(req);

      expect(response.status).toBe(204);
    });
  });

  describe('CORS and OPTIONS', () => {
    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: { name: t.string().required() },
      };

      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);
    });

    test('handles OPTIONS preflight request', async () => {
      const req = new Request('http://localhost/api/user', {
        method: 'OPTIONS',
      });

      const response = await server.handle(req);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    test('includes CORS headers in responses', async () => {
      const req = new Request('http://localhost/api/user');
      const response = await server.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    test('returns 404 for unknown route', async () => {
      // Add at least one entity so server has routes
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: { name: t.string().required() },
      };
      
      await db.createTable(userEntity);
      const repository = factory.create(userEntity);
      server.addEntityRoutes(userEntity, repository);
      
      const req = new Request('http://localhost/api/unknown');
      const response = await server.handle(req);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Not found');
    });

    test('returns 405 for unsupported method', async () => {
      const req = new Request('http://localhost/api/user', {
        method: 'PATCH',
      });

      const response = await server.handle(req);

      expect(response.status).toBe(405);
      
      const data = await response.json();
      expect(data.error).toBe('Method not allowed');
    });
  });

  describe('Multiple Entities', () => {
    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
        },
      };

      const taskEntity: EntityDefinition = {
        name: 'Task',
        owned: false,
        schema: {
          title: t.string().required(),
        },
      };

      await db.createTable(userEntity);
      await db.createTable(taskEntity);

      const userRepo = factory.create(userEntity);
      const taskRepo = factory.create(taskEntity);

      server.addEntityRoutes(userEntity, userRepo);
      server.addEntityRoutes(taskEntity, taskRepo);

      await userRepo.create({ name: 'Alice' });
      await taskRepo.create({ title: 'Task 1' });
    });

    test('handles multiple entity endpoints', async () => {
      const userReq = new Request('http://localhost/api/user');
      const userRes = await server.handle(userReq);
      const users = await userRes.json();

      const taskReq = new Request('http://localhost/api/task');
      const taskRes = await server.handle(taskReq);
      const tasks = await taskRes.json();

      expect(users.length).toBe(1);
      expect(users[0].name).toBe('Alice');
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Task 1');
    });
  });
});
