import { describe, test, expect } from 'bun:test';
import { 
  entity, 
  ownedEntity, 
  privateEntity, 
  sharedEntity, 
  singletonEntity,
  validateEntityDefinition,
  string, 
  number, 
  boolean 
} from '../../src/framework/entities';
import type { EntityDefinition } from '../../src/framework/entities';

describe('Entity Types - Access Levels', () => {
  describe('Default Access Levels', () => {
    test('entity() has unauthenticated read/write by default', () => {
      const def = entity('Product', [string('name')]).build();
      
      expect(def.readLevel).toBe('unauthenticated');
      expect(def.writeLevel).toBe('unauthenticated');
      expect(def.lifecycle).toBe('default');
    });

    test('ownedEntity() has unauthenticated read/write by default', () => {
      const def = ownedEntity('Task', [string('title')]).build();
      
      expect(def.readLevel).toBe('unauthenticated');
      expect(def.writeLevel).toBe('unauthenticated');
      expect(def.owned).toBe(true);
    });
  });

  describe('Custom Access Levels', () => {
    test('sets custom readLevel', () => {
      const def = entity('BlogPost', [string('title')])
        .readLevel('authenticated')
        .writeLevel('authenticated')
        .build();
      
      expect(def.readLevel).toBe('authenticated');
      expect(def.writeLevel).toBe('authenticated');
    });

    test('sets custom writeLevel', () => {
      const def = entity('Article', [string('title')])
        .writeLevel('owner')
        .readLevel('owner')
        .build();
      
      expect(def.readLevel).toBe('owner');
      expect(def.writeLevel).toBe('owner');
    });

    test('sets both read and write levels', () => {
      const def = entity('Comment', [string('text')])
        .readLevel('unauthenticated')
        .writeLevel('authenticated')
        .build();
      
      expect(def.readLevel).toBe('unauthenticated');
      expect(def.writeLevel).toBe('authenticated');
    });
  });

  describe('Predefined Entity Types', () => {
    test('privateEntity sets owner read/write', () => {
      const def = privateEntity('Secret', [string('data')]).build();
      
      expect(def.readLevel).toBe('owner');
      expect(def.writeLevel).toBe('owner');
    });

    test('sharedEntity sets unauthenticated read, authenticated write', () => {
      const def = sharedEntity('Wiki', [string('content')]).build();
      
      expect(def.readLevel).toBe('unauthenticated');
      expect(def.writeLevel).toBe('authenticated');
    });

    test('singletonEntity sets authenticated read/write and singleton lifecycle', () => {
      const def = singletonEntity('Settings', [string('theme')]).build();
      
      expect(def.readLevel).toBe('authenticated');
      expect(def.writeLevel).toBe('authenticated');
      expect(def.lifecycle).toBe('singleton');
    });
  });
});

describe('Entity Types - Lifecycle', () => {
  describe('Default Lifecycle', () => {
    test('entity has default lifecycle', () => {
      const def = entity('Product', [string('name')]).build();
      
      expect(def.lifecycle).toBe('default');
    });
  });

  describe('Custom Lifecycle', () => {
    test('sets instancePerUser lifecycle', () => {
      const def = entity('UserProfile', [string('bio')])
        .lifecycle('instancePerUser')
        .readLevel('authenticated')
        .writeLevel('authenticated')
        .build();
      
      expect(def.lifecycle).toBe('instancePerUser');
    });

    test('sets singleton lifecycle', () => {
      const def = entity('AppSettings', [string('theme')])
        .lifecycle('singleton')
        .build();
      
      expect(def.lifecycle).toBe('singleton');
    });
  });
});

describe('Entity Definition Validation', () => {
  describe('Valid Configurations', () => {
    test('allows writeLevel equal to readLevel', () => {
      const def: EntityDefinition = {
        name: 'Test',
        schema: {},
        owned: false,
        fieldOrder: [],
        readLevel: 'authenticated',
        writeLevel: 'authenticated',
        lifecycle: 'default',
      };
      
      expect(() => validateEntityDefinition(def)).not.toThrow();
    });

    test('allows writeLevel more restrictive than readLevel', () => {
      const def: EntityDefinition = {
        name: 'Test',
        schema: {},
        owned: false,
        fieldOrder: [],
        readLevel: 'unauthenticated',
        writeLevel: 'authenticated',
        lifecycle: 'default',
      };
      
      expect(() => validateEntityDefinition(def)).not.toThrow();
    });

    test('allows owner writeLevel with owner readLevel', () => {
      const def: EntityDefinition = {
        name: 'Test',
        schema: {},
        owned: false,
        fieldOrder: [],
        readLevel: 'owner',
        writeLevel: 'owner',
        lifecycle: 'default',
      };
      
      expect(() => validateEntityDefinition(def)).not.toThrow();
    });
  });

  describe('Invalid Configurations', () => {
    test('rejects writeLevel more permissive than readLevel', () => {
      expect(() => {
        entity('Invalid', [string('name')])
          .readLevel('owner')
          .writeLevel('authenticated')
          .build();
      }).toThrow(/writeLevel.*must not be more permissive than readLevel/);
    });

    test('rejects unauthenticated writeLevel with authenticated readLevel', () => {
      expect(() => {
        entity('Invalid', [string('name')])
          .readLevel('authenticated')
          .writeLevel('unauthenticated')
          .build();
      }).toThrow(/writeLevel.*must not be more permissive than readLevel/);
    });

    test('rejects instancePerUser with unauthenticated readLevel', () => {
      expect(() => {
        entity('Invalid', [string('name')])
          .lifecycle('instancePerUser')
          .readLevel('unauthenticated')
          .build();
      }).toThrow(/instancePerUser.*cannot have readLevel 'unauthenticated'/);
    });

    test('rejects singleton with owner readLevel', () => {
      expect(() => {
        entity('Invalid', [string('name')])
          .lifecycle('singleton')
          .readLevel('owner')
          .build();
      }).toThrow(/singleton.*cannot have readLevel.*set to 'owner'/);
    });

    test('rejects singleton with owner writeLevel', () => {
      expect(() => {
        entity('Invalid', [string('name')])
          .lifecycle('singleton')
          .writeLevel('owner')
          .readLevel('owner')
          .build();
      }).toThrow(/singleton.*cannot have.*writeLevel set to 'owner'/);
    });
  });
});

describe('Entity Builder Pattern', () => {
  test('allows method chaining', () => {
    const def = entity('Article', [
      string('title').required(),
      string('content'),
    ])
      .readLevel('unauthenticated')
      .writeLevel('authenticated')
      .lifecycle('default')
      .build();
    
    expect(def.name).toBe('Article');
    expect(def.readLevel).toBe('unauthenticated');
    expect(def.writeLevel).toBe('authenticated');
    expect(def.lifecycle).toBe('default');
  });

  test('allows overriding predefined entity settings', () => {
    const def = privateEntity('Task', [string('title')])
      .readLevel('authenticated') // Override from owner
      .build();
    
    expect(def.readLevel).toBe('authenticated');
    expect(def.writeLevel).toBe('owner'); // Still owner
  });

  test('validates on build()', () => {
    const builder = entity('Invalid', [string('name')])
      .readLevel('owner')
      .writeLevel('unauthenticated');
    
    expect(() => builder.build()).toThrow();
  });
});

describe('Complex Entity Scenarios', () => {
  test('creates a public read-only entity', () => {
    const def = entity('Announcement', [
      string('title').required(),
      string('content').required(),
    ])
      .readLevel('unauthenticated')
      .writeLevel('owner')
      .build();
    
    expect(def.readLevel).toBe('unauthenticated');
    expect(def.writeLevel).toBe('owner');
  });

  test('creates a user-specific settings entity', () => {
    const def = entity('UserSettings', [
      string('theme').default('light'),
      boolean('notifications').default(true),
    ])
      .lifecycle('instancePerUser')
      .readLevel('owner')
      .writeLevel('owner')
      .build();
    
    expect(def.lifecycle).toBe('instancePerUser');
    expect(def.readLevel).toBe('owner');
    expect(def.writeLevel).toBe('owner');
  });

  test('creates a collaborative entity', () => {
    const def = entity('WikiPage', [
      string('title').required(),
      string('content'),
      number('version').default(1),
    ])
      .readLevel('unauthenticated')
      .writeLevel('authenticated')
      .build();
    
    expect(def.readLevel).toBe('unauthenticated');
    expect(def.writeLevel).toBe('authenticated');
  });
});
