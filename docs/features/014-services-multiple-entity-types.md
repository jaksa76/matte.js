# Services involving multiple types of entities (TaskNo: 014)

Overview
Services can encapsulate workflows that read/write multiple entity types in one place (e.g., Orders + Inventory + Payments). This promotes reuse, transaction-safe updates, and a clean API for UI and automation.

Example
```ts
// services/orderService.ts
import { Entities, tx } from "matte";

export async function placeOrder(input: { userId: string; items: { sku: string; qty: number }[] }) {
  return tx(async () => {
    const user = await Entities.User.get(input.userId);
    const order = await Entities.Order.create({ userId: user.id, status: "pending" });

    for (const item of input.items) {
      const product = await Entities.Product.getBySku(item.sku);
      await Entities.Inventory.reserve({ productId: product.id, qty: item.qty, orderId: order.id });
    }

    const payment = await Entities.Payment.charge({ userId: user.id, orderId: order.id });
    await Entities.Order.update(order.id, { status: payment.ok ? "confirmed" : "failed" });

    return { orderId: order.id, paymentId: payment.id };
  });
}
```

Questions for Product Team
- Should services enforce transactional boundaries automatically (rollback on failure)?
- How are cross-entity validations declared (schema vs. service logic)?
- Can services be exposed as HTTP endpoints by convention, and how is auth/permissions handled across entities?
