import type { EntityDefinition } from './entities';

export type ViewType = 'grid' | 'list';

export interface EntityRegistration {
  entity: EntityDefinition;
  viewType: ViewType;
}

/**
 * Central registry for all entity definitions
 */
class Registry {
  private entities = new Map<string, EntityRegistration>();

  register(definition: EntityDefinition, viewType: ViewType = 'grid'): void {
    this.entities.set(definition.name, { entity: definition, viewType });
  }

  get(name: string): EntityRegistration | undefined {
    return this.entities.get(name);
  }

  getEntity(name: string): EntityDefinition | undefined {
    return this.entities.get(name)?.entity;
  }

  getAll(): EntityRegistration[] {
    return Array.from(this.entities.values());
  }

  getAllEntities(): EntityDefinition[] {
    return Array.from(this.entities.values()).map(reg => reg.entity);
  }

  clear(): void {
    this.entities.clear();
  }
}

export const EntityRegistry = new Registry();
