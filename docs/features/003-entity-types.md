# 003 – Entity Types: Private, Shared, Singleton

## Overview
Matte entities can be scoped to control visibility and lifecycle:
- Private: visible only to the owner
- Owned: visible by all, but modifiable only by the owner
- Shared: modifiable and visible by all authenticated users
- Public: visible and modifiable by unauthenticated users
- PrivateSingleton: exactly one instance per user
- Singleton: exactly one global instance for the entire application/runtime.
This lets you tune data isolation, caching, and synchronization semantics.

## Example Usage
```ts
import { privateEntity, sharedEntity, singletonEntity, string, boolean, date } from 'matte';

const Task = privateEntity('Task', [
  string("description"),
  boolean("completed")
]);

const ChatRoom = sharedEntity('ChatRoom', [
  string("roomName"),
  string("topic")
]);

const MessageOfTheDay = singletonEntity('MessageOfTheDay', [
  string("message"),
  date("lastUpdated")
]);
```

## Clarification Questions
1. Are Shared entities optimistic or pessimistic for concurrent writes?
4. How is authorization enforced on Shared vs Private?
5. Is Singleton preloaded & hot-reloaded on change?
6. Recommended cache invalidation strategy per scope?
