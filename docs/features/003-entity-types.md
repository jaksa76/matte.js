# 003 – Entity Types: Private, Shared, Singleton

## Overview
Matte entities can be scoped to control visibility, edit rights and lifecycle.


## Access Control
access control is given by the matrix:
- users: unauthenticated, authenticated, owner-only
- operations: read, write

Giving access to unauthenticated users implies access to authenticated users.
Giving access to authenticated users implies access to owner-only users.
So we can encode access control as a pair of levels: (read level, write level).
readLevel(unauthenticated) < readLevel(authenticated) < readLevel(owner)
writeLevel(unauthenticated) < writeLevel(authenticated) < writeLevel(owner)


## Entity Lifecycles
- lifecycle: multiple instances, instance per user, single instance


## Example Usage

```ts
import { privateEntity, sharedEntity, singletonEntity, string, boolean, date } from 'matte';

const BlogPost = entity('BlogPost', [
  string("Title"),
  string("Content"),
  boolean("Published")
]).readLevel('unauthenticated').writeLevel('owner');

const Task = entity('Bio', [
  string("Name"),
  string("Biography"),
]).readLevel('authenticated').writeLevel('owner').lifecycle('instancePerUser');
```


## Predefined Entity Types
To simplify common use cases, we define shorthands for common entity types:
- privateEntity: entity with readLevel('owner') and writeLevel('owner')
- ownedEntity: privateEntity with readLevel('unauthenticated') and writeLevel('owner')
- publicEntity: ownedEntity with readLevel('unauthenticated') and writeLevel('authenticated')

````ts
const Task = privateEntity('Task', [
  string("Name"),
  boolean("Completed")
]);

const WikiPage = sharedEntity('WikiPage', [
  string("Title"),
  string("Content"),
]).readLevel('unauthenticated').writeLevel('authenticated');
```

## Invalid Entity Configurations
- An entity cannot have a write level higher than its read level.
- An entity with instancePerUser lifecycle cannot have unauthenticated read level.
- A singleton entity cannot have any owner-only access.

## Future Considerations
- Adding group-based access control.