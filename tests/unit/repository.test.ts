import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EntityRepository, RepositoryFactory } from '../../src/framework/repository';
import { SQLiteAdapter } from '../../src/framework/database';
import { t } from '../../src/framework/entities';
import type { EntityDefinition } from '../../src/framework/entities';

describe('EntityRepository', () => {
  let db: SQLiteAdapter;
  let factory: RepositoryFactory;

  beforeEach(async () => {
    db = new SQLiteAdapter(':memory:');
    await db.initialize();
    factory = new RepositoryFactory(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('CRUD Operations', () => {
    let userEntity: EntityDefinition;
    let repository: EntityRepository;

    beforeEach(async () => {
      userEntity = {
        name: 'User',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
          age: t.number(),
          active: t.boolean().default(true),
        },
      };

      await db.createTable(userEntity);
      repository = factory.create(userEntity);
    });

    describe('Create', () => {
      test('creates a new record', async () => {
        const user = await repository.create({
          name: 'Alice',
          email: 'alice@example.com',
          age: 25,
        });

        expect(user.id).toBeDefined();
        expect(user.name).toBe('Alice');
        expect(user.email).toBe('alice@example.com');
        expect(user.age).toBe(25);
      });

      test('applies default values', async () => {
        const user = await repository.create({
          name: 'Bob',
          email: 'bob@example.com',
        });

        expect(user.active).toBe(1); // Boolean stored as integer
      });

      test('throws error for missing required field', async () => {
        await expect(
          repository.create({
            name: 'Charlie',
            // missing email
          })
        ).rejects.toThrow('Field email is required');
      });

      test('converts camelCase to snake_case', async () => {
        const entity: EntityDefinition = {
          name: 'Product',
          owned: false,
          schema: {
            productName: t.string().required(),
            unitPrice: t.number().required(),
          },
        };

        await db.createTable(entity);
        const repo = factory.create(entity);

        const product = await repo.create({
          productName: 'Widget',
          unitPrice: 9.99,
        });

        expect(product.id).toBeDefined();
        // Check using snake_case since DB stores it that way but returns camelCase
        const rawProduct = await db.findById('product', product.id);
        expect(rawProduct.product_name).toBe('Widget');
        expect(rawProduct.unit_price).toBe(9.99);
      });
    });

    describe('FindById', () => {
      test('finds record by ID', async () => {
        const created = await repository.create({
          name: 'Dave',
          email: 'dave@example.com',
        });

        const found = await repository.findById(created.id);

        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
        expect(found?.name).toBe('Dave');
      });

      test('returns null for non-existent ID', async () => {
        const found = await repository.findById('non-existent-id');

        expect(found).toBeNull();
      });

      test('converts snake_case to camelCase', async () => {
        const entity: EntityDefinition = {
          name: 'Customer',
          owned: false,
          schema: {
            firstName: t.string().required(),
            lastName: t.string().required(),
          },
        };

        await db.createTable(entity);
        const repo = factory.create(entity);

        const created = await repo.create({
          firstName: 'John',
          lastName: 'Smith',
        });

        const found = await repo.findById(created.id);

        expect(found?.firstName).toBe('John');
        expect(found?.lastName).toBe('Smith');
      });
    });

    describe('FindAll', () => {
      beforeEach(async () => {
        await repository.create({ name: 'User 1', email: 'user1@example.com', age: 20 });
        await repository.create({ name: 'User 2', email: 'user2@example.com', age: 30 });
        await repository.create({ name: 'User 3', email: 'user3@example.com', age: 40 });
      });

      test('finds all records', async () => {
        const users = await repository.findAll();

        expect(users.length).toBe(3);
        expect(users.every(u => u.name && u.email)).toBe(true);
      });

      test('finds records with filters', async () => {
        const users = await repository.findAll({ age: 30 });

        expect(users.length).toBe(1);
        expect(users[0]!.name).toBe('User 2');
      });

      test('returns empty array when no matches', async () => {
        const users = await repository.findAll({ age: 999 });

        expect(users.length).toBe(0);
      });

      test('handles camelCase filters', async () => {
        const entity: EntityDefinition = {
          name: 'Purchase',
          owned: false,
          schema: {
            purchaseNumber: t.string().required(),
            purchaseStatus: t.enum(['pending', 'shipped']).default('pending'),
          },
        };

        await db.createTable(entity);
        const repo = factory.create(entity);

        await repo.create({ purchaseNumber: 'PUR-001', purchaseStatus: 'pending' });
        await repo.create({ purchaseNumber: 'PUR-002', purchaseStatus: 'shipped' });

        const pending = await repo.findAll({ purchaseStatus: 'pending' });

        expect(pending.length).toBe(1);
        // Check raw DB value
        const rawPending = await db.findById('purchase', pending[0]!.id);
        expect(rawPending.purchase_number).toBe('PUR-001');
      });
    });

    describe('Update', () => {
      test('updates existing record', async () => {
        const user = await repository.create({
          name: 'Original',
          email: 'original@example.com',
        });

        const updated = await repository.update(user.id, {
          name: 'Updated',
        });

        expect(updated.id).toBe(user.id);
        expect(updated.name).toBe('Updated');
        expect(updated.email).toBe('original@example.com');
      });

      test('updates multiple fields', async () => {
        const user = await repository.create({
          name: 'Alice',
          email: 'alice@example.com',
          age: 25,
        });

        const updated = await repository.update(user.id, {
          name: 'Alice Smith',
          age: 26,
        });

        expect(updated.name).toBe('Alice Smith');
        expect(updated.age).toBe(26);
      });

      test('handles camelCase field names', async () => {
        const entity: EntityDefinition = {
          name: 'Profile',
          owned: false,
          schema: {
            displayName: t.string().required(),
            profilePicture: t.string(),
          },
        };

        await db.createTable(entity);
        const repo = factory.create(entity);

        const profile = await repo.create({
          displayName: 'John',
          profilePicture: 'photo.jpg',
        });

        const updated = await repo.update(profile.id, {
          displayName: 'John Doe',
        });

        expect(updated.displayName).toBe('John Doe');
      });
    });

    describe('Delete', () => {
      test('deletes existing record', async () => {
        const user = await repository.create({
          name: 'To Delete',
          email: 'delete@example.com',
        });

        await repository.delete(user.id);

        const found = await repository.findById(user.id);
        expect(found).toBeNull();
      });

      test('does not throw on non-existent ID', async () => {
        await expect(repository.delete('non-existent-id')).resolves.toBeUndefined();
      });
    });
  });

  describe('Owned Entities', () => {
    let taskEntity: EntityDefinition;
    let repository: EntityRepository;

    beforeEach(async () => {
      taskEntity = {
        name: 'Task',
        owned: true,
        schema: {
          title: t.string().required(),
          status: t.enum(['open', 'done']).default('open'),
        },
      };

      await db.createTable(taskEntity);
      repository = factory.create(taskEntity);
    });

    test('requires owner_id for owned entities', async () => {
      await expect(
        repository.create({
          title: 'Task without owner',
        })
      ).rejects.toThrow('requires an owner_id');
    });

    test('creates owned entity with owner_id', async () => {
      const task = await repository.create(
        {
          title: 'My Task',
          status: 'open',
        },
        'user-123'
      );

      // Check raw DB to verify owner_id
      const rawTask = await db.findById('task', task.id);
      expect(rawTask.owner_id).toBe('user-123');
      expect(task.title).toBe('My Task');
    });

    test('filters by owner_id', async () => {
      await repository.create({ title: 'User 1 Task 1' }, 'user-1');
      await repository.create({ title: 'User 1 Task 2' }, 'user-1');
      await repository.create({ title: 'User 2 Task 1' }, 'user-2');

      const user1Tasks = await repository.findAll({ ownerId: 'user-1' });

      expect(user1Tasks.length).toBe(2);
      expect(user1Tasks.every(t => t.ownerId === 'user-1')).toBe(true);
    });
  });

  describe('Complex Field Types', () => {
    test('handles date fields', async () => {
      const entity: EntityDefinition = {
        name: 'Event',
        owned: false,
        schema: {
          name: t.string().required(),
          eventDate: t.date().required(),
        },
      };

      await db.createTable(entity);
      const repo = factory.create(entity);

      const event = await repo.create({
        name: 'Conference',
        eventDate: '2025-12-25T10:00:00Z',
      });

      // Check raw DB value
      const rawEvent = await db.findById('event', event.id);
      expect(rawEvent.event_date).toBe('2025-12-25T10:00:00Z');
    });

    test('handles richtext fields', async () => {
      const entity: EntityDefinition = {
        name: 'Article',
        owned: false,
        schema: {
          title: t.string().required(),
          content: t.richtext(),
        },
      };

      await db.createTable(entity);
      const repo = factory.create(entity);

      const article = await repo.create({
        title: 'My Article',
        content: '<h1>Heading</h1><p>Paragraph</p>',
      });

      expect(article.content).toBe('<h1>Heading</h1><p>Paragraph</p>');
    });

    test('handles enum fields with defaults', async () => {
      const entity: EntityDefinition = {
        name: 'Document',
        owned: false,
        schema: {
          title: t.string().required(),
          status: t.enum(['draft', 'published', 'archived']).default('draft'),
        },
      };

      await db.createTable(entity);
      const repo = factory.create(entity);

      const doc = await repo.create({
        title: 'My Document',
      });

      expect(doc.status).toBe('draft');
    });
  });

  describe('Validation', () => {
    test('validates required fields on create', async () => {
      const entity: EntityDefinition = {
        name: 'Contact',
        owned: false,
        schema: {
          name: t.string().required(),
          email: t.string().required(),
          phone: t.string(),
        },
      };

      await db.createTable(entity);
      const repo = factory.create(entity);

      await expect(
        repo.create({ name: 'John' }) // missing email
      ).rejects.toThrow('email is required');
    });

    test('allows optional fields to be omitted', async () => {
      const entity: EntityDefinition = {
        name: 'Profile',
        owned: false,
        schema: {
          username: t.string().required(),
          bio: t.string(),
          website: t.string(),
        },
      };

      await db.createTable(entity);
      const repo = factory.create(entity);

      const profile = await repo.create({
        username: 'johndoe',
      });

      expect(profile.username).toBe('johndoe');
      expect(profile.bio).toBeNull(); // SQLite returns null, not undefined
    });
  });
});
