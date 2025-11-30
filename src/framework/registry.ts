import type { EntityDefinition } from './entities';

/**
 * Central registry for all entity definitions
 */
class Registry {
  private entities = new Map<string, EntityDefinition>();

  register(definition: EntityDefinition): void {
    this.entities.set(definition.name, definition);
  }

  get(name: string): EntityDefinition | undefined {
    return this.entities.get(name);
  }

  getAll(): EntityDefinition[] {
    return Array.from(this.entities.values());
  }

  clear(): void {
    this.entities.clear();
  }
}

export const EntityRegistry = new Registry();
