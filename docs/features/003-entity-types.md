# 003 – Entity Types: Private, Shared, Singleton

# 003 – Entity Types: Private, Shared, Singleton

## Overview
Matte entities can be scoped to control visibility, edit rights, and lifecycle. Entities support access control levels (unauthenticated, authenticated, owner) and lifecycle modes (multiple instances, instance per user, singleton).

```typescript
import { entity, privateEntity, string, boolean } from 'matte';

// Custom access control
const BlogPost = entity('BlogPost', [
  string("Title"),
  string("Content"),
  boolean("Published")
]).readLevel('unauthenticated').writeLevel('owner');

// Predefined shorthands
const Task = privateEntity('Task', [
  string("Name"),
  boolean("Completed")
]);

// Instance per user lifecycle
const UserProfile = entity('UserProfile', [
  string("Bio")
]).lifecycle('instancePerUser');
```

Access levels enforce permissions on read/write operations. Lifecycle modes control entity instantiation (multiple, one per user, or singleton).

## Implementation Plan

### Entity Definition Layer

#### `src/framework/entities.ts` (MODIFY)
- Add `readLevel?: 'unauthenticated' | 'authenticated' | 'owner'` to `EntityDefinition`
- Add `writeLevel?: 'unauthenticated' | 'authenticated' | 'owner'` to `EntityDefinition`
- Add `lifecycle?: 'default' | 'instancePerUser' | 'singleton'` to `EntityDefinition`
- Add `.readLevel()`, `.writeLevel()`, `.lifecycle()` methods to entity builder
- Update `privateEntity()` to set `readLevel('owner')` and `writeLevel('owner')`
- Add `sharedEntity()` helper: `readLevel('unauthenticated')`, `writeLevel('authenticated')`
- Add `singletonEntity()` helper: `lifecycle('singleton')`, `readLevel('authenticated')`
- Add validation in entity builder to reject invalid configurations

### Data Layer

#### `src/framework/database.ts` (MODIFY)
- Do not enforce access control at DB layer; handle in API/repository layers. This allows flexibiliy for migrations between different types of entities without changing DB schema.

#### `src/framework/repository.ts` (MODIFY)
- `create()`: For `instancePerUser`, check if user already has instance (return existing or error)
- `create()`: For `singleton`, check if instance exists (return existing or error)
- `create()`: Validate `ownerId` presence based on lifecycle and access levels
- `findAll()`: Filter by `ownerId` for `instancePerUser` lifecycle automatically
- `findAll()`: For singleton, return single instance or empty array

### API Layer

#### `src/framework/api.ts` (MODIFY)
- `APIGenerator.generateRoutes()`: Apply access control checks before repository calls
- Check `readLevel` in GET endpoints: verify user authentication level meets requirement
- Check `writeLevel` in POST/PUT/DELETE endpoints: verify user authentication level meets requirement
- Extract authentication level from request (unauthenticated, authenticated, owner)
- Return 401/403 errors when access is denied
- For `instancePerUser`: automatically filter to current user's instance
- For singleton: enforce single instance semantics in create operations

### Validation

#### `src/framework/entities.ts` (ADD)
- `validateEntityDefinition()` function to check:
  - writeLevel must not exceed readLevel (owner > authenticated > unauthenticated)
  - `instancePerUser` cannot have `unauthenticated` readLevel
  - `singleton` cannot have `owner` readLevel or writeLevel
  - Call during entity creation/registration