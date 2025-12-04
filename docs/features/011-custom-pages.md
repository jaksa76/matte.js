# Task 011: Custom Pages

Overview: Allows defining bespoke pages outside the default routing, so apps can render specialized views, layouts, or flows. Custom pages integrate with Matte.js routing, middleware, and data loaders while keeping component structure familiar.

Example:
```ts
// routes/pages/custom.tsx
import { Page } from "matte";

export default Page({
  path: "/reports/summary",
  layout: "dashboard",
  loader: async ({ ctx }) => ({ stats: await ctx.db.getStats() }),
  component: ({ stats }) => <SummaryReport stats={stats} />,
  guards: ["auth"],
});
```
Registering:
```ts
// index.ts
import customSummary from "./routes/pages/custom";
app.usePage(customSummary);
```

Questions for Product:
- Should custom pages support dynamic params (e.g., /reports/:id) and typed loaders out of the box?
- How do pages compose with nested layouts and route groups?
- What is the priority when a custom page path overlaps with a conventional route?
- Can pages declare SEO metadata (title, canonical) and streaming/SSR options?
- What are the recommended patterns for guards and middleware ordering?
