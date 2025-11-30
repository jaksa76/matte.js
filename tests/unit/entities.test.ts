import { describe, test, expect, beforeEach } from 'bun:test';
import { t, entity, ownedEntity } from '../../src/framework/entities';
import { EntityRegistry } from '../../src/framework/registry';

describe('Field Types', () => {
  describe('StringField', () => {
    test('creates basic string field', () => {
      const field = t.string();
      expect(field.type).toBe('string');
      expect(field.isRequired).toBe(false);
      expect(field.isArray).toBe(false);
    });

    test('creates required string field', () => {
      const field = t.string().required();
      expect(field.isRequired).toBe(true);
    });

    test('sets default value', () => {
      const field = t.string().default('hello');
      expect(field._default).toBe('hello');
    });

    test('sets min and max length', () => {
      const field = t.string().minLength(5).maxLength(100);
      expect(field._minLength).toBe(5);
      expect(field._maxLength).toBe(100);
    });

    test('chains methods', () => {
      const field = t.string().minLength(5).maxLength(100).default('test').required();
      expect(field.isRequired).toBe(true);
      expect(field._default).toBe('test');
      expect(field._minLength).toBe(5);
      expect(field._maxLength).toBe(100);
    });
  });

  describe('NumberField', () => {
    test('creates basic number field', () => {
      const field = t.number();
      expect(field.type).toBe('number');
      expect(field.isRequired).toBe(false);
    });

    test('sets min and max values', () => {
      const field = t.number().min(0).max(100);
      expect(field._min).toBe(0);
      expect(field._max).toBe(100);
    });

    test('creates required number field with default', () => {
      const field = t.number().default(42).required();
      expect(field.isRequired).toBe(true);
      expect(field._default).toBe(42);
    });
  });

  describe('EnumField', () => {
    test('creates enum field with values', () => {
      const field = t.enum(['draft', 'published', 'archived']);
      expect(field.type).toBe('enum');
      expect(field.values).toEqual(['draft', 'published', 'archived']);
    });

    test('sets default enum value', () => {
      const field = t.enum(['low', 'medium', 'high']).default('medium');
      expect(field._default).toBe('medium');
    });

    test('creates required enum field', () => {
      const field = t.enum(['yes', 'no']).required();
      expect(field.isRequired).toBe(true);
    });
  });

  describe('DateField', () => {
    test('creates basic date field', () => {
      const field = t.date();
      expect(field.type).toBe('date');
      expect(field.isRequired).toBe(false);
    });

    test('creates required date field', () => {
      const field = t.date().required();
      expect(field.isRequired).toBe(true);
    });
  });

  describe('RichTextField', () => {
    test('creates richtext field', () => {
      const field = t.richtext();
      expect(field.type).toBe('richtext');
      expect(field.isRequired).toBe(false);
    });

    test('sets default richtext value', () => {
      const field = t.richtext().default('<p>Hello</p>');
      expect(field._default).toBe('<p>Hello</p>');
    });
  });

  describe('FileField', () => {
    test('creates basic file field', () => {
      const field = t.file();
      expect(field.type).toBe('file');
      expect(field.isArray).toBe(false);
    });

    test('creates file array field', () => {
      const field = t.file().array();
      expect(field.type).toBe('file');
      expect(field.isArray).toBe(true);
    });

    test('sets max size and allowed types', () => {
      const field = t.file().maxSize(1024 * 1024).allowedTypes(['image/png', 'image/jpeg']);
      expect(field._maxSize).toBe(1024 * 1024);
      expect(field._allowedTypes).toEqual(['image/png', 'image/jpeg']);
    });
  });

  describe('BooleanField', () => {
    test('creates boolean field', () => {
      const field = t.boolean();
      expect(field.type).toBe('boolean');
      expect(field.isRequired).toBe(false);
    });

    test('sets default boolean value', () => {
      const field = t.boolean().default(true);
      expect(field._default).toBe(true);
    });
  });
});

describe('Entity Definitions', () => {
  beforeEach(() => {
    EntityRegistry.clear();
  });

  test('creates basic entity', () => {
    const def = entity('User', {
      name: t.string().required(),
      email: t.string().required(),
      age: t.number(),
    });

    expect(def.name).toBe('User');
    expect(def.owned).toBe(false);
    expect(Object.keys(def.schema)).toEqual(['name', 'email', 'age']);
  });

  test('creates owned entity', () => {
    const def = ownedEntity('Task', {
      title: t.string().required(),
      status: t.enum(['open', 'done']).default('open'),
    });

    expect(def.name).toBe('Task');
    expect(def.owned).toBe(true);
    expect(Object.keys(def.schema)).toEqual(['title', 'status']);
  });

  test('registers entity in registry', () => {
    entity('Product', {
      name: t.string().required(),
      price: t.number().min(0).required(),
    });

    const registered = EntityRegistry.get('Product');
    expect(registered).toBeDefined();
    expect(registered?.name).toBe('Product');
  });

  test('supports complex schema', () => {
    const def = ownedEntity('BlogPost', {
      title: t.string().required(),
      slug: t.string().required(),
      content: t.richtext(),
      status: t.enum(['draft', 'published', 'archived']).default('draft'),
      publishedAt: t.date(),
      viewCount: t.number().min(0).default(0),
      tags: t.string(),
      featured: t.boolean().default(false),
    });

    expect(Object.keys(def.schema).length).toBe(8);
    expect(def.schema.status._default).toBe('draft');
    expect(def.schema.viewCount._default).toBe(0);
  });
});

describe('Entity Registry', () => {
  beforeEach(() => {
    EntityRegistry.clear();
  });

  test('registers and retrieves entity', () => {
    const def = entity('User', { name: t.string() });
    
    const retrieved = EntityRegistry.get('User');
    expect(retrieved).toBe(def);
  });

  test('returns undefined for non-existent entity', () => {
    const retrieved = EntityRegistry.get('NonExistent');
    expect(retrieved).toBeUndefined();
  });

  test('gets all entities', () => {
    entity('User', { name: t.string() });
    entity('Product', { name: t.string() });
    ownedEntity('Task', { title: t.string() });

    const all = EntityRegistry.getAll();
    expect(all.length).toBe(3);
    expect(all.map(e => e.name).sort()).toEqual(['Product', 'Task', 'User']);
  });

  test('clears all entities', () => {
    entity('User', { name: t.string() });
    entity('Product', { name: t.string() });

    expect(EntityRegistry.getAll().length).toBe(2);

    EntityRegistry.clear();

    expect(EntityRegistry.getAll().length).toBe(0);
  });
});
