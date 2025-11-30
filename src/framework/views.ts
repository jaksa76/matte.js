import type { EntityDefinition } from './entities';
import type { ViewType } from './registry';

/**
 * Base class for entity views
 */
export class View {
  constructor(
    public entity: EntityDefinition,
    public viewType: ViewType
  ) {}
}

/**
 * Wrap an entity to use list view
 */
export function listView(entity: EntityDefinition): View {
  return new View(entity, 'list');
}

/**
 * Wrap an entity to use grid view
 */
export function gridView(entity: EntityDefinition): View {
  return new View(entity, 'grid');
}
