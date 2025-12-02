import type { EntityDefinition } from '../entities';

/**
 * Entity stub class that encapsulates fetching entities and metadata from the server.
 * Provides async methods for CRUD operations without React dependencies.
 * 
 * @example
 * ```ts
 * const stub = new EntityStub(entity, apiUrl);
 * const items = await stub.fetchAll();
 * await stub.delete(itemId);
 * ```
 */
export class EntityStub {
  constructor(
    public readonly entity: EntityDefinition,
    public readonly apiUrl: string
  ) {}

  /**
   * Fetch all entities from the API
   */
  async fetchAll(): Promise<any[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch a single entity by ID
   */
  async fetchById(id: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Create a new entity
   */
  async create(data: any): Promise<any> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to create');
    }
    return await response.json();
  }

  /**
   * Update an existing entity
   */
  async update(id: string, data: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to update');
    }
    return await response.json();
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete item');
    }
  }
}
