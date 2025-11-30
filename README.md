# matte.js

A lightweight framework for rapidly building full-stack applications with automatic API generation, database management, and type-safe entity definitions.

## Features

- 🎯 **Array-based entity schemas** with guaranteed field ordering
- 🔧 **Shortcut helpers** for common field types
- 🔗 **Chainable API** for fluent field configuration
- 🚀 **Automatic REST API generation** from entity definitions
- 💾 **Built-in database adapter** (SQLite)
- 🔐 **Multi-tenant ownership** support
- ✅ **Type-safe** with full TypeScript support

## Quick Start

To install dependencies:

```bash
bun install
```

### Define Entities

```typescript
import { ownedEntity, field, string, richtext, date, number, file, t } from './framework';

const Task = ownedEntity("Task", [
  string("title").required(),
  richtext("description"),
  field("status", t.enum(["open", "in_progress", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array(),
]);
```

### Field Shortcuts

- `string(name)` - String field
- `number(name)` - Number field
- `date(name)` - Date field
- `richtext(name)` - Rich text field
- `file(name)` - File field
- `boolean(name)` - Boolean field
- `field(name, type)` - For complex types like enums

All shortcuts support method chaining:

```typescript
string("email").required().maxLength(100)
number("price").min(0).default(0)
file("avatar").maxSize(5 * 1024 * 1024)
```

### Run the Framework

```typescript
import { Framework } from './framework';

const framework = new Framework({
  dbPath: './data.db',
  port: 3000,
});

// Register entities
framework.register(Task);

// Start the framework (initialization happens automatically)
await framework.start();
```

This automatically:
- Initializes the database
- Creates database tables
- Generates REST API endpoints
- Serves a UI at `http://localhost:3000`

## API Endpoints

For each entity, the following endpoints are automatically generated:

- `GET /api/{entities}` - List all records
- `GET /api/{entities}/:id` - Get single record
- `POST /api/{entities}` - Create record
- `PUT /api/{entities}/:id` - Update record
- `DELETE /api/{entities}/:id` - Delete record

## Examples

See the `src/examples/` directory:
- `simple-entity.ts` - Basic entity definition
- `customizable-fields.ts` - Advanced field customization
- `field-api-demo.ts` - Comprehensive API demo
- `verify-ordering.ts` - Field ordering demonstration

To run an example:

```bash
bun run ./src/examples/simple-entity.ts
```

## Testing

```bash
bun test
```

All 107 tests pass ✅

## Documentation

- [Field Ordering Implementation](./docs/field-ordering-implementation.md)
- [Vision & Roadmap](./docs/refined-functionality.md)

## License

MIT

---

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
