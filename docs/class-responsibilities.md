# Framework Classes and Responsibilities

This document provides an overview of all classes in the Matte.js framework and their respective responsibilities.

## Core Framework

### `Matte` (framework.ts)
- Main entry point and facade for the framework
- Provides methods to register entities and pages
- Maintains entity and page registries using `Map<string, EntityDefinition>` and `Map<string, Page>`
- Delegates server operations to the `Server` class
- Delegates database operations to `RepositoryFactory`

### `Server` (server.ts)
- Handles HTTP server operations
- Receives entity and page Maps from `Matte` class
- Bundles and serves client-side React code (client.tsx, landing-client.tsx)
- Uses Api and ViewSystem to route requests appropriately

## Entity & Schema System

### `EntityDefinition` (entities.ts)
- Defines the schema for an entity
- Contains fields, ownership info, and metadata
- Used to generate database tables and API routes
- Supports field customization for views

### `StringField`, `NumberField`, `DateField`, `EnumField`, `RichTextField`, `FileField`, `BooleanField`, `FieldGroup` (entities.ts)
- Define field types with validation rules and defaults
- Provide fluent API for field configuration (required, min/max, etc.)
- Support UI customization (labels, styling, alignment, etc.)
- Each field class handles its specific data type

### `FieldBuilder` (entities.ts)
- Wrapper class for chainable field definition
- Allows method chaining on field creation shortcuts
- Converts to `FieldDefinition` format

### `FieldSelector` (views.ts)
- Selects and customizes fields for custom views
- Provides UI metadata overrides (styling, labels, alignment)
- Used to create customized entity views

## Data Layer

### `SQLiteAdapter` (database.ts)
- Implements database operations using SQLite
- Creates tables from entity definitions
- Handles CRUD operations (create, read, update, delete)
- Serializes/deserializes data (JSON, dates, booleans)
- Manages SQL identifier quoting for reserved words
- Converts between snake_case (DB) and camelCase (app)

### `EntityRepository` (repository.ts)
- Provides high-level data access for entities
- Enforces entity schema and validation rules
- Handles owner_id for owned entities
- Converts between application and database formats
- Wraps DatabaseAdapter with entity-specific logic

### `RepositoryFactory` (repository.ts)
- Creates repository instances for entities
- Injects database adapter dependency

## API Layer

### `APIGenerator` (api.ts)
- Generates REST API routes for an entity
- Creates standard CRUD endpoints (GET, POST, PUT, DELETE)
- Handles query parameter filtering
- Manages owner_id from headers or request body

### `APIServer` (api.ts)
- Routes API requests to appropriate handlers
- Handles CORS headers
- Manages route pattern matching (including :id parameters)
- Centralizes error handling for API

## Helper Functions (not classes)

### Entity Definition Functions (entities.ts)
- `entity()`, `ownedEntity()` - Create entity definitions

### Field Shortcuts (entities.ts)
- `string()`, `number()`, `date()`, etc. - Quick field creation

### Group Helpers (entities.ts)
- `group()`, `hgroup()` - Organize fields in groups

### High-Level View Helpers (views.ts)
- `listView`, `gridView`, `detailView`, `formView` - High-level view creation helpers
- `getCustomizedEntity` - Applies field customizations to entities