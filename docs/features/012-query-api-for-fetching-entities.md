# TaskNo: 012 — Query API for Fetching Entities

Overview:
The Query API lets users fetch entities with filters, sorting, pagination, and field selection. It provides a consistent, type-safe interface for reading data across all entity types.

Example:
```ts
import { matte } from "matte";

// Fetch published articles by author, latest first, first 10
const res = await matte.query("Article", {
  where: { status: "published", authorId: "u_123" },
  orderBy: [{ createdAt: "desc" }],
  take: 10,
  skip: 0,
  select: ["id", "title", "createdAt"],
});

console.log(res.items);       // array of Article
console.log(res.pageInfo);    // { total, hasNext, hasPrev }
```

Questions:
- Should complex filters support AND/OR groups and nested relations (e.g., comments.user.email)?
- Can select include computed fields and relationship traversal, or only scalar fields?
- What are the default limits and max values for take/skip to prevent heavy queries?
- How are authorization checks applied (field-level, row-level)?
- Is caching or ETag/if-none-match supported for repeated queries?
