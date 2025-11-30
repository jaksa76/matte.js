import { t, ownedEntity } from '../../src/framework/entities';
import type { EntityDefinition } from '../../src/framework/entities';

// Common test entities
export const testEntities = {
  user: {
    name: 'User',
    owned: false,
    schema: {
      name: t.string().required(),
      email: t.string().required(),
      age: t.number(),
      active: t.boolean().default(true),
    },
  } as EntityDefinition,

  task: {
    name: 'Task',
    owned: true,
    schema: {
      title: t.string().required(),
      description: t.richtext(),
      status: t.enum(['open', 'in_progress', 'done']).default('open'),
      priority: t.enum(['low', 'medium', 'high']).default('medium'),
      dueDate: t.date(),
      estimate: t.number().min(0),
    },
  } as EntityDefinition,

  product: {
    name: 'Product',
    owned: false,
    schema: {
      name: t.string().required(),
      sku: t.string().required(),
      price: t.number().min(0).required(),
      inStock: t.boolean().default(true),
      category: t.enum(['electronics', 'clothing', 'food']),
    },
  } as EntityDefinition,

  blogPost: {
    name: 'BlogPost',
    owned: true,
    schema: {
      title: t.string().required(),
      slug: t.string().required(),
      content: t.richtext(),
      status: t.enum(['draft', 'published', 'archived']).default('draft'),
      publishedAt: t.date(),
      viewCount: t.number().min(0).default(0),
      featured: t.boolean().default(false),
    },
  } as EntityDefinition,
};

// Sample data generators
export const sampleData = {
  users: [
    { name: 'Alice Johnson', email: 'alice@example.com', age: 28, active: true },
    { name: 'Bob Smith', email: 'bob@example.com', age: 35, active: true },
    { name: 'Charlie Brown', email: 'charlie@example.com', age: 42, active: false },
    { name: 'Diana Prince', email: 'diana@example.com', age: 30, active: true },
  ],

  tasks: [
    { title: 'Complete documentation', description: 'Write comprehensive docs', status: 'open', priority: 'high' },
    { title: 'Fix bug #123', description: 'Login issue on mobile', status: 'in_progress', priority: 'urgent' },
    { title: 'Code review', description: 'Review PR #456', status: 'open', priority: 'medium' },
    { title: 'Deploy to production', description: 'Release v2.0', status: 'done', priority: 'high' },
  ],

  products: [
    { name: 'Laptop', sku: 'ELEC-001', price: 999.99, inStock: true, category: 'electronics' },
    { name: 'T-Shirt', sku: 'CLO-001', price: 19.99, inStock: true, category: 'clothing' },
    { name: 'Coffee Beans', sku: 'FOOD-001', price: 12.99, inStock: false, category: 'food' },
    { name: 'Headphones', sku: 'ELEC-002', price: 149.99, inStock: true, category: 'electronics' },
  ],

  blogPosts: [
    { title: 'Getting Started', slug: 'getting-started', content: '<p>Welcome!</p>', status: 'published', featured: true },
    { title: 'Advanced Topics', slug: 'advanced-topics', content: '<p>Deep dive</p>', status: 'draft', featured: false },
    { title: 'Best Practices', slug: 'best-practices', content: '<p>Tips and tricks</p>', status: 'published', featured: true },
  ],
};

// Helper to create a unique ID
export function uniqueId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to wait for async operations
export async function wait(ms: number = 10): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to create test data in bulk
export async function seedData<T>(
  repository: any,
  data: Partial<T>[],
  ownerId?: string
): Promise<T[]> {
  const results: T[] = [];
  
  for (const item of data) {
    const created = await repository.create(item, ownerId);
    results.push(created);
  }
  
  return results;
}

// Helper to make HTTP requests with common options
export async function apiRequest(
  url: string,
  method: string = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

// Assertion helpers
export function assertValidEntity(entity: any, requiredFields: string[]): void {
  if (!entity) {
    throw new Error('Entity is null or undefined');
  }
  
  if (!entity.id) {
    throw new Error('Entity must have an id');
  }
  
  if (!entity.created_at && !entity.createdAt) {
    throw new Error('Entity must have created_at timestamp');
  }
  
  if (!entity.updated_at && !entity.updatedAt) {
    throw new Error('Entity must have updated_at timestamp');
  }
  
  for (const field of requiredFields) {
    if (entity[field] === undefined && entity[field] === null) {
      throw new Error(`Entity must have required field: ${field}`);
    }
  }
}

export function assertOwnedEntity(entity: any, expectedOwnerId: string): void {
  assertValidEntity(entity, []);
  
  const ownerId = entity.owner_id || entity.ownerId;
  if (ownerId !== expectedOwnerId) {
    throw new Error(`Entity owner_id (${ownerId}) does not match expected (${expectedOwnerId})`);
  }
}
