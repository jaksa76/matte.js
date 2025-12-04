import type { EntityDefinition } from './entities';
import type { DatabaseAdapter } from './database';

/**
 * Generic repository interface for CRUD operations.
 */
export interface Repository<T = any> {
  create(data: Partial<T>, ownerId?: string): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * EntityRepository implements the Repository interface for a specific entity.
 */
export class EntityRepository<T = any> implements Repository<T> {
  private tableName: string;

  constructor(
    private entity: EntityDefinition,
    private db: DatabaseAdapter
  ) {
    this.tableName = this.toSnakeCase(entity.name);
  }

  async create(data: Partial<T>, ownerId?: string): Promise<T> {
    const lifecycle = this.entity.lifecycle || 'default';
    
    // For instancePerUser lifecycle, check if user already has an instance
    if (lifecycle === 'instancePerUser') {
      if (!ownerId) {
        throw new Error(`Entity ${this.entity.name} with lifecycle 'instancePerUser' requires an owner_id`);
      }
      
      const existing = await this.db.findAll(this.tableName, { owner_id: ownerId });
      if (existing.length > 0) {
        throw new Error(`User ${ownerId} already has an instance of ${this.entity.name}`);
      }
    }
    
    // For singleton lifecycle, check if instance exists
    if (lifecycle === 'singleton') {
      const existing = await this.db.findAll(this.tableName);
      if (existing.length > 0) {
        throw new Error(`Singleton entity ${this.entity.name} already has an instance`);
      }
    }
    
    const record: Record<string, any> = {};

    // Add owner if entity is owned, instancePerUser, or has owner-level access
    const needsOwner = this.entity.owned || 
                       lifecycle === 'instancePerUser' ||
                       this.entity.readLevel === 'owner' ||
                       this.entity.writeLevel === 'owner';
    if (needsOwner) {
      if (!ownerId) {
        throw new Error(`Entity ${this.entity.name} requires an owner_id`);
      }
      record.owner_id = ownerId;
    }

    // Process fields
    for (const [fieldName, field] of Object.entries(this.entity.schema)) {
      const key = fieldName as keyof T;
      const value = data[key];

      if (value !== undefined) {
        record[this.toSnakeCase(fieldName)] = value;
      } else if (field._default !== undefined) {
        record[this.toSnakeCase(fieldName)] = field._default;
      } else if (field.isRequired) {
        throw new Error(`Field ${fieldName} is required for ${this.entity.name}`);
      }
    }

    return await this.db.insert(this.tableName, record);
  }

  async findById(id: string): Promise<T | null> {
    const record = await this.db.findById(this.tableName, id);
    return record ? this.toCamelCase(record) : null;
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    const lifecycle = this.entity.lifecycle || 'default';
    let snakeFilters: Record<string, any> = {};
    
    // Convert filters to snake_case
    if (filters) {
      snakeFilters = this.toSnakeCaseObject(filters);
    }
    
    const records = await this.db.findAll(this.tableName, Object.keys(snakeFilters).length > 0 ? snakeFilters : undefined);
    
    // For singleton, return at most one instance
    if (lifecycle === 'singleton') {
      return records.slice(0, 1).map(r => this.toCamelCase(r));
    }
    
    return records.map(r => this.toCamelCase(r));
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const record: Record<string, any> = {};

    for (const [fieldName] of Object.entries(this.entity.schema)) {
      const key = fieldName as keyof T;
      const value = data[key];

      if (value !== undefined) {
        record[this.toSnakeCase(fieldName)] = value;
      }
    }

    const updated = await this.db.update(this.tableName, id, record);
    return this.toCamelCase(updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(this.tableName, id);
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  private toCamelCase(obj: Record<string, any>): T {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    
    return result as T;
  }

  private toSnakeCaseObject(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      result[this.toSnakeCase(key)] = value;
    }
    
    return result;
  }
}

export class RepositoryFactory {
  constructor(private db: DatabaseAdapter) {}

  create<T = any>(entity: EntityDefinition): Repository<T> {
    return new EntityRepository<T>(entity, this.db);
  }
}
