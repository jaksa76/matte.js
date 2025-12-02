# Framework Classes and Responsibilities

This document provides an overview of all classes in the Matte.js framework and their respective responsibilities.

## Core Framework

### `Matte` (framework.ts)
- Main entry point and facade for the framework
- Registers entities and pages
- Initializes database and creates tables
- Creates repositories and registers API routes
- Delegates server operations to the `Server` class
- Provides access to repositories via `getRepository()`
- Manages overall framework lifecycle

### `Server` (server.ts)
- Handles HTTP server operations
- Bundles and serves client-side React code (client.tsx, landing-client.tsx)
- Routes HTTP requests to API or UI components
- Serves static assets (JavaScript bundles, CSS)
- Renders HTML pages (landing page and entity pages)
- Manages server lifecycle (start/stop)
- Serves as the HTTP layer for the framework

## Entity & Schema System

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

## View & Navigation System

### `EntityRegistry` (registry.ts)
- Central registry for all entity definitions
- Stores and retrieves entity metadata
- Singleton pattern for global access

### `PageRegistry` (page-registry.ts)
- Central registry for application pages
- Manages page metadata (path, name, icon, order)
- Provides navigation page filtering
- Supports page lookup by ID or path

## Helper Functions (not classes)

### Factory Functions (view-system.ts)
- `createEntityView`, `createInstanceView`, `createPage` - Factory functions for creating view objects

### High-Level View Helpers (views.ts)
- `listView`, `gridView`, `detailView`, `formView` - High-level view creation helpers
- `getCustomizedEntity` - Applies field customizations to entities

### Entity Definition Functions (entities.ts)
- `entity()`, `ownedEntity()` - Create entity definitions

### Field Shortcuts (entities.ts)
- `string()`, `number()`, `date()`, etc. - Quick field creation

### Group Helpers (entities.ts)
- `group()`, `hgroup()` - Organize fields in groups

## Architecture

The framework follows a layered architecture:

```
Entities → Database → Repository → API
                ↓
              Matte (facade/orchestrator)
                ↓
              Server (HTTP layer)
                ↓
           UI Components
```

The `Matte` class serves as the central facade and orchestrator, coordinating entity registration, database initialization, and repository/API setup. It delegates all HTTP and serving concerns to the `Server` class, which handles bundling, routing, and serving both API endpoints and UI components. This separation keeps the framework concerns distinct from the server concerns.
