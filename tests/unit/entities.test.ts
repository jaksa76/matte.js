import { describe, test, expect, beforeEach } from 'bun:test';
import { t, entity, ownedEntity, field, string, number, richtext, boolean, date } from '../../src/framework/entities';
import type { EntityDefinition } from '../../src/framework/entities';

let testRegistry: Map<string, EntityDefinition>;

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
  test('creates basic entity', () => {
    const def = entity('User', [
      string('name').required(),
      string('email').required(),
      number('age'),
    ]).build();

    expect(def.name).toBe('User');
    expect(def.owned).toBe(false);
    expect(def.fieldOrder).toEqual(['name', 'email', 'age']);
  });

  test('creates owned entity', () => {
    const def = ownedEntity('Task', [
      string('title').required(),
      field('status', t.enum(['open', 'done']).default('open')),
    ]).build();

    expect(def.name).toBe('Task');
    expect(def.owned).toBe(true);
    expect(def.fieldOrder).toEqual(['title', 'status']);
  });

  test('uses entity definition', () => {
    const def = entity('Product', [
      string('name').required(),
      number('price').min(0).required(),
    ]).build();

    expect(def.name).toBe('Product');
    expect(def.schema.name.isRequired).toBe(true);
    expect(def.schema.price.isRequired).toBe(true);
  });

  test('supports complex schema', () => {
    const def = ownedEntity('BlogPost', [
      string('title').required(),
      string('slug').required(),
      richtext('content'),
      field('status', t.enum(['draft', 'published', 'archived']).default('draft')),
      date('publishedAt'),
      number('viewCount').min(0).default(0),
      string('tags'),
      boolean('featured').default(false),
    ]).build();

    expect(def.fieldOrder.length).toBe(8);
    expect(def.schema.status._default).toBe('draft');
    expect(def.schema.viewCount._default).toBe(0);
  });
});

describe('Entity Registry', () => {
  beforeEach(() => {
    testRegistry = new Map<string, EntityDefinition>();
  });

  test('registers and retrieves entity', () => {
    const def = entity('User', [string('name')]).build();
    testRegistry.set(def.name, def);
    
    const retrieved = testRegistry.get('User');
    expect(retrieved).toBe(def);
  });

  test('returns undefined for non-existent entity', () => {
    const retrieved = testRegistry.get('NonExistent');
    expect(retrieved).toBeUndefined();
  });

  test('gets all entities', () => {
    const user = entity('User', [string('name')]).build();
    const product = entity('Product', [string('name')]).build();
    const task = ownedEntity('Task', [string('title')]).build();

    testRegistry.set(user.name, user);
    testRegistry.set(product.name, product);
    testRegistry.set(task.name, task);

    const all = Array.from(testRegistry.values());
    expect(all.length).toBe(3);
    expect(all.map(e => e.name).sort()).toEqual(['Product', 'Task', 'User']);
  });

  test('clears all entities', () => {
    const user = entity('User', [string('name')]).build();
    const product = entity('Product', [string('name')]).build();

    testRegistry.set(user.name, user);
    testRegistry.set(product.name, product);

    expect(testRegistry.size).toBe(2);

    testRegistry.clear();

    expect(testRegistry.size).toBe(0);
  });
});
