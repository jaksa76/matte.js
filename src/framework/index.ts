// Core framework
export { Matte } from './framework';
export type { MatteOptions } from './framework';

// Entity definitions
export { entity, ownedEntity, t, field, string, number, date, richtext, file, boolean, group, hgroup } from './entities';
export type { EntityDefinition, EntitySchema, EntitySchemaDefinition, FieldType, FieldDefinition, UIMetadata, FieldGroup } from './entities';

// View system
export { createEntityView, createInstanceView, createPage } from './view-system';
export type { View, EntityView, InstanceView, Page, BaseView } from './view-system';

// View helpers
export { listView, gridView, customGridView, detailView, formView, show, FieldSelector, getCustomizedEntity } from './views';

// Registries
export { EntityRegistry } from './registry';
export { PageRegistry } from './page-registry';

// Database
export { SQLiteAdapter } from './database';
export type { DatabaseAdapter } from './database';

// Repository
export { RepositoryFactory, EntityRepository } from './repository';
export type { Repository } from './repository';

// API
export { APIServer, APIGenerator } from './api';
export type { APIRoute } from './api';

// UI Components
export * from './ui';
