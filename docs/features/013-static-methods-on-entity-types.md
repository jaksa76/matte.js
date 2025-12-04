# TaskNo: 013 — Static Methods on Entity Types

## Feature overview
Entity types can define static methods for operations that don’t require an instance (e.g., lookups, factory creation, validations). Static methods centralize domain logic, enable reuse across pages/services, and provide a clear API surface for entity-wide actions.

## Example usage
```ts
// src/entities/User.ts
export class User extends Entity {
  // Instance fields/methods...

  static async findByEmail(email: string): Promise<User | null> {
    return await db.users.first({ email });
  }

  static createGuest(): User {
    return new User({ role: 'guest', active: true });
  }
}

// Anywhere in app
const guest = User.createGuest();
const existing = await User.findByEmail('alex@example.com');
```

## Questions for product
- Should static methods have access to framework services (db, cache, logger) via a static context, or import directly?
- Are static methods allowed to perform side effects (writes) or expected to be pure unless named with a convention?
- How are static methods exposed in generated API/SDKs—available to client code or server-only?
- Any naming conventions (e.g., create*, find*, validate*) enforced by lint rules?
