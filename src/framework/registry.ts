import type { EntityDefinition } from './entities';

/**
 * Central registry for all entity definitions
 * Note: This registry only stores entity definitions, not view configurations.
 * Views are managed separately through the Page system.
 */
class Registry {
  private entities = new Map<string, EntityDefinition>();

  /**
   * Register an entity definition
   */
  register(definition: EntityDefinition): void {
    this.entities.set(definition.name, definition);
  }

  /**
   * Get an entity by name
   */
  get(name: string): EntityDefinition | undefined {
    return this.entities.get(name);
  }

  /**
   * Get all registered entities
   */
  getAll(): EntityDefinition[] {
    return Array.from(this.entities.values());
  }

  /**
   * Check if an entity is registered
   */
  has(name: string): boolean {
    return this.entities.has(name);
  }

  /**
   * Remove an entity
   */
  remove(name: string): boolean {
    return this.entities.delete(name);
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
  }

  /**
   * Get the number of registered entities
   */
  get size(): number {
    return this.entities.size;
  }
}

export const EntityRegistry = new Registry();
