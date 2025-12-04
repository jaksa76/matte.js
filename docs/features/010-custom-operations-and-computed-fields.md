# TaskNo: 010 — Custom Operations on Entities & Computed Fields

Date: 2025-12-04

## Overview
Matte.js lets you add domain-specific operations (actions) to entities and define computed fields derived from existing data. Operations run server-side with validation/permissions; computed fields are read-only values calculated on access or persisted via hooks.

## Example
```ts
// entity: Order
Entity("Order", {
  fields: {
    subtotal: number(),
    taxRate: number().default(0.08),
    total: computed(({ subtotal, taxRate }) => subtotal * (1 + taxRate)),
  },
  operations: {
    applyDiscount: ({ subtotal }, { percent }: { percent: number }) => {
      if (percent <= 0 || percent >= 50) throw new Error("invalid percent");
      return { subtotal: subtotal * (1 - percent / 100) };
    },
  },
  permissions: {
    operations: { applyDiscount: role("manager") },
  }
});

// usage
await Order.ops.applyDiscount(orderId, { percent: 10 });
const total = await Order.get(orderId).select("total");
```

## Questions
- Should computed fields be lazy-only or support persisted snapshots? When?
- Can operations be transactional across multiple entities by default?
- How are operation inputs validated (schema), and can they be versioned?
- Are computed fields selectable/filterable in queries and indexed?
- Hooks: before/after operation—supported and audit logging format?
