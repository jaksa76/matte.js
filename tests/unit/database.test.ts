import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { SQLiteAdapter } from '../../src/framework/database';
import { entity, ownedEntity, t } from '../../src/framework/entities';
import type { EntityDefinition } from '../../src/framework/entities';

describe('SQLiteAdapter', () => {
  let db: SQLiteAdapter;

  beforeEach(async () => {
    db = new SQLiteAdapter(':memory:');
    await db.initialize();
  });

  afterEach(() => {
    db.close();
  });

  describe('Table Creation', () => {
    test('creates table for basic entity', async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
          age: t.number(),
        },
      };

      await db.createTable(userEntity);

      // Insert a test record to verify table structure
      const user = await db.insert('user', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });

      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
    });

    test('creates table for owned entity with owner_id', async () => {
      const taskEntity: EntityDefinition = {
        name: 'Task',
        owned: true,
        schema: {
          title: t.string().required(),
          status: t.enum(['open', 'done']).default('open'),
        },
      };

      await db.createTable(taskEntity);

      const task = await db.insert('task', {
        title: 'Test Task',
        status: 'open',
        owner_id: 'user-123',
      });

      expect(task.owner_id).toBe('user-123');
      expect(task.title).toBe('Test Task');
    });

    test('creates table with various field types', async () => {
      const postEntity: EntityDefinition = {
        name: 'Post',
        owned: false,
        schema: {
          title: t.string().required(),
          content: t.richtext(),
          published: t.boolean().default(false),
          viewCount: t.number().min(0).default(0),
          publishedAt: t.date(),
          tags: t.string(),
        },
      };

      await db.createTable(postEntity);

      const post = await db.insert('post', {
        title: 'Test Post',
        content: '<p>Content</p>',
        published: true,
        view_count: 100, // Use snake_case for database column
        published_at: new Date('2025-01-01').toISOString(),
      });

      expect(post.title).toBe('Test Post');
      expect(post.published).toBe(1); // SQLite stores boolean as integer
      expect(post.view_count).toBe(100);
    });
  });

  describe('Insert Operations', () => {
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
    });

    test('inserts record with auto-generated ID', async () => {
      const user = await db.insert('user', {
        name: 'Alice',
        email: 'alice@example.com',
      });

      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    test('inserts record with custom ID', async () => {
      const user = await db.insert('user', {
        id: 'custom-id-123',
        name: 'Bob',
        email: 'bob@example.com',
      });

      expect(user.id).toBe('custom-id-123');
    });

    test('serializes complex values', async () => {
      const entity: EntityDefinition = {
        name: 'Config',
        owned: false,
        schema: {
          data: t.string(),
        },
      };
      await db.createTable(entity);

      const config = await db.insert('config', {
        data: { key: 'value', nested: { array: [1, 2, 3] } },
      });

      expect(config.data).toEqual({ key: 'value', nested: { array: [1, 2, 3] } });
    });
  });

  describe('Find Operations', () => {
    beforeEach(async () => {
      const userEntity: EntityDefinition = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
          role: t.enum(['user', 'admin']).default('user'),
        },
      };
      await db.createTable(userEntity);

      // Insert test data
      await db.insert('user', { name: 'Alice', email: 'alice@example.com', role: 'admin' });
      await db.insert('user', { name: 'Bob', email: 'bob@example.com', role: 'user' });
      await db.insert('user', { name: 'Charlie', email: 'charlie@example.com', role: 'user' });
    });

    test('finds record by ID', async () => {
      const users = await db.findAll('user');
      const firstUserId = users[0]!.id;

      const user = await db.findById('user', firstUserId);

      expect(user).toBeDefined();
      expect(user.id).toBe(firstUserId);
      expect(user.name).toBeDefined(); // Just verify it has a name
    });

    test('returns null for non-existent ID', async () => {
      const user = await db.findById('user', 'non-existent-id');
      expect(user).toBeNull();
    });

    test('finds all records', async () => {
      const users = await db.findAll('user');

      expect(users.length).toBe(3);
      // Verify all users are present
      const names = users.map(u => u.name).sort();
      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('finds records with filters', async () => {
      const admins = await db.findAll('user', { role: 'admin' });

      expect(admins.length).toBe(1);
      expect(admins[0]!.name).toBe('Alice');
    });

    test('finds records with empty result', async () => {
      const results = await db.findAll('user', { role: 'superadmin' });

      expect(results.length).toBe(0);
    });
  });

  describe('Update Operations', () => {
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

      const user = await db.insert('user', {
        name: 'Original Name',
        email: 'original@example.com',
      });
      userId = user.id;
    });

    test('updates record fields', async () => {
      const updated = await db.update('user', userId, {
        name: 'Updated Name',
      });

      expect(updated.id).toBe(userId);
      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('original@example.com');
      expect(updated.updated_at).toBeDefined();
    });

    test('updates multiple fields', async () => {
      const updated = await db.update('user', userId, {
        name: 'New Name',
        email: 'new@example.com',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.email).toBe('new@example.com');
    });

    test('updated_at timestamp changes', async () => {
      const original = await db.findById('user', userId);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await db.update('user', userId, { name: 'Changed' });

      expect(updated.updated_at).not.toBe(original.updated_at);
    });
  });

  describe('Delete Operations', () => {
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

      const user = await db.insert('user', { name: 'To Delete' });
      userId = user.id;
    });

    test('deletes record by ID', async () => {
      await db.delete('user', userId);

      const user = await db.findById('user', userId);
      expect(user).toBeNull();
    });

    test('deletes non-existent record without error', async () => {
      await expect(db.delete('user', 'non-existent-id')).resolves.toBeUndefined();
    });
  });

  describe('Data Serialization', () => {
    test('serializes and deserializes dates', async () => {
      const entity: EntityDefinition = {
        name: 'Event',
        owned: false,
        schema: {
          name: t.string().required(),
          eventDate: t.date().required(),
        },
      };
      await db.createTable(entity);

      const date = new Date('2025-12-25T10:00:00Z');
      const event = await db.insert('event', {
        name: 'Christmas',
        event_date: date,
      });

      expect(event.event_date).toBe(date.toISOString());
    });

    test('serializes and deserializes arrays', async () => {
      const entity: EntityDefinition = {
        name: 'TaggedItem',
        owned: false,
        schema: {
          name: t.string().required(),
          tags: t.string(), // Add tags to schema
        },
      };
      await db.createTable(entity);

      const item = await db.insert('tagged_item', {
        name: 'Item',
        tags: ['tag1', 'tag2', 'tag3'],
      });

      expect(item.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('serializes and deserializes boolean values', async () => {
      const entity: EntityDefinition = {
        name: 'Feature',
        owned: false,
        schema: {
          enabled: t.boolean().default(false),
        },
      };
      await db.createTable(entity);

      const feature1 = await db.insert('feature', { enabled: true });
      const feature2 = await db.insert('feature', { enabled: false });

      expect(feature1.enabled).toBe(1); // SQLite stores as integer
      expect(feature2.enabled).toBe(0);
    });
  });

  describe('Snake Case Conversion', () => {
    test('converts camelCase to snake_case for columns', async () => {
      const entity: EntityDefinition = {
        name: 'Example',
        owned: false,
        schema: {
          firstName: t.string().required(),
          lastName: t.string().required(),
          emailAddress: t.string().required(),
        },
      };

      await db.createTable(entity);

      const record = await db.insert('example', {
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com',
      });

      expect(record.first_name).toBe('John');
      expect(record.last_name).toBe('Doe');
      expect(record.email_address).toBe('john@example.com');
    });
  });
});
