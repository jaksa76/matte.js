// Core framework
export { Matte } from './framework';
export type { MatteOptions } from './framework';

// Authentication
export { AuthManager } from './auth';
export type { AuthSession } from './auth';

// Server
export { Server } from './server';
export type { ServerOptions } from './server';

// Entity definitions
export { entity, ownedEntity, t, field, string, number, date, richtext, file, boolean, group, hgroup } from './entities';
export type { EntityDefinition, EntitySchema, EntitySchemaDefinition, FieldType, FieldDefinition, UIMetadata, FieldGroup } from './entities';

// View system
export { createEntityDisplay, createInstanceDisplay, createPage } from './view-system';
export type { Display, EntityDisplay, InstanceDisplay, Page, BaseDisplay } from './view-system';

// View helpers
export { listView, gridView, customGridView, detailView, formView, show, FieldSelector, getCustomizedEntity } from './views';

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
