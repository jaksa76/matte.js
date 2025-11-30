# Vision

A declarative, domain‑model‑first framework in JS/TS where developers define entities, relationships, and policies once. The system synthesizes a full stack: database schema + migrations, services + controllers, API endpoints + client SDKs, and a composable UI (forms, lists, dashboards). Defaults are production‑grade with auth, navigation, settings, i18n, accessibility, and observability. Everything is overridable via extension points.

---

# Core Concepts & Abstractions

## 1) Domain Model (single source of truth)

* **Entity**: Named type with fields, constraints, lifecycle state, and behaviors.
* **Field**: Scalar or complex type with validation, formatting, privacy, and access rules.
* **Relationships**: one‑to‑one, one‑to‑many, many‑to‑many, polymorphic, nested/embedded.
* **Identifiers**: human‑readable keys vs UUIDs vs compound keys.
* **Computed Fields**: derived on read/write; optionally materialized.
* **Aggregates**: transactional consistency boundaries (DDD‑style root + invariants).
* **State Machine**: allowed transitions, guards, side‑effects; drives UI actions and API.
* **Tags & Metadata**: freeform key/values for extensibility (index hints, caching hints).
* **Versioning**: schema versions per entity; data migrations.
* **Multi‑tenancy**: partition keys, tenant isolation policies.

## 2) Policies (security & governance)

* **AuthN**: pluggable providers (password, SSO/OIDC, magic links, WebAuthn).
* **AuthZ**: RBAC + ABAC + ReBAC:

  * Role & permission catalogs with **policy DSL** (e.g., can("invoice", "pay") when owner or role=="billing").
  * Row‑level security and field‑level visibility.
  * Relationship‑based rules (e.g., teammate of owner).
* **Data Protection**: PII tagging, field encryption at rest, masking in logs.
* **Rate Limits & Quotas**: per identity, per tenant.
* **Audit**: append‑only event log for reads/writes/admin actions.

## 3) Interaction Model (actions & workflows)

* **Actions**: create/update/delete/custom (approve, publish, refund). Typed inputs/outputs.
* **Workflows**: step functions/statecharts across entities (draft→review→published). Human & automated steps.
* **Hooks**: before/after validate, persist, index, notify; idempotency keys.
* **Rules**: declarative constraints (unique‑within, subtotal==sum(lines)).

## 4) Data & Persistence

* **Storage adapters**: Postgres (first‑class), SQLite (dev), MySQL, Mongo, Serverless KV, S3‑like blobs.
* **Migrations**: generated from model diffs; online/zero‑downtime options.
* **Indexes**: declared in model (btree, gin, composite, partial).
* **Search**: derived search indexes (e.g., to OpenSearch/Meilisearch) with consistency strategies.
* **Caching**: entity/read‑model caches with TTL + invalidation strategies.
* **CQRS option**: materialized projections for read heavy views.

## 5) API Surface (generated)

* **GraphQL** and/or **REST** and/or **tRPC** generated from model.
* **Contracts**: zod/io‑ts schemas; OpenAPI/SDL emitted.
* **Client SDK**: typed TS client per entity/action/query; supports reactive subscriptions.
* **Real‑time**: server‑sent events/websocket channels derived from entities & actions.
* **Pagination & Filters**: standardized (cursor/offset), sort, search, includes/expands.

## 6) UI Composition (generated but overridable)

* **Primitives**: List, Detail, Form, Wizard, Kanban, Calendar, Chart, Datagrid.
* **View Model**: decoupled presentation schema describing fields→widgets (text, select, money, file, rich text, reference picker, array, JSON editor).
* **Layout**: regions (header/sidebar/content/panels), tabs, responsive breakpoints.
* **Themes**: design tokens & Tailwind/Chakra/Vanilla Extract skins; dark mode.
* **Accessibility**: ARIA baked in; keyboard navigation; color‑contrast checks.
* **Customization**:

  * Slot/Render‑prop overrides for widgets.
  * Component registry to replace any generated component.
  * Per‑role views and conditional field visibility.
  * Action buttons bound to state machine transitions.

## 7) Query Layer

* **SQL‑like DSL** in TS: `from(Order).join(Customer).where(o => o.total.gt(100)).select(...)`.
* **Safety**: type‑safe, injection‑safe, respected by policy engine.
* **Computed Aggregates**: `count`, `sum`, `groupBy`, window functions (optional pushdown).
* **Saved Queries**: named, parameterized, permission‑scoped; drive dashboards.

## 8) Conventions (over configuration)

* **Naming**: entities→tables `snake_case`, fields→columns, relations→FKs with standard suffixes.
* **Files**: `/domain/*.model.ts` is discovered; `/ui/theme.ts` for design tokens; `/policies/*.policy.ts`.
* **Routes**: `/app/<entity>` auto‑registered with List/Detail/Create views.
* **Auth**: login/registration/settings included by default.
* **Observability**: logging, metrics, tracing enabled with sensible defaults.

## 9) Extensibility

* **Plugins**: add fields (e.g., `Money`, `Slug`), adapters (DB, queue), UI widgets (Map, Signature), or actions.
* **Code‑gen vs Runtime**: toggle between ahead‑of‑time code generation and fully dynamic runtime for rapid dev.
* **Event Bus**: internal async events (`entity.created`) for integrations.
* **Webhooks**: secure outbound hooks with retries & signatures.

## 10) DX (Developer Experience)

* **Model Studio**: visual editor for entities/relations/state machines with live type checking.
* **Storybook‑like UI Explorer** for generated components with sample data.
* **Playground**: query DSL REPL.
* **CLI**: `npx <tool> new`, `generate`, `migrate`, `inspect`, `seed`, `build`.
* **Hot Reload** for model changes → instant UI/API regeneration.
* **Inspector**: runtime panel showing what was generated and why (trace from model→UI/API).

---

# Minimal DSL Sketch (conceptual, not final)

```ts
entity("Invoice", {
  fields: {
    id: uuid().primary(),
    number: slug().unique(),
    customer: ref("Customer").required(),
    lines: array(ref("InvoiceLine")),
    subtotal: money().computed(({ lines }) => sum(lines.map(l => l.total))),
    status: state(["draft", "sent", "paid", "void"], { initial: "draft" }),
  },
  policies: allow({ read: isMemberOfTenant, write: isOwnerOrRole("billing") }),
  actions: {
    send: action().guard(canSend).effect(sendEmail),
    pay: action().guard(canPay).effect(chargeProvider),
    void: action().guard(canVoid),
  },
  views: {
    list: view().columns(["number", "customer", "subtotal", "status"]).filters([status, customer]),
    detail: view().layout(tabs("Details", "Timeline")),
  },
});
```

---

# Runtime Architecture

* **Model Compiler** → builds an intermediate representation (IR) from the DSL.
* **Generators** (pluggable):

  * **DB Generator**: DDL, migrations, seeders.
  * **API Generator**: REST/GraphQL routes, validators, controllers, OpenAPI/SDL.
  * **Client Generator**: Typed TS SDK, hooks (React Query), subscriptions.
  * **UI Generator**: pages, widgets, layouts bound to entity/view model + policies.
* **Policy Engine**: executed server‑side, mirrored client‑side for UI gating (never trusts client).
* **Runtime Services**: caching, search sync, job queue, notifications, webhooks.
* **Observability**: structured logs, tracing (OpenTelemetry), metrics (RED/USE).

---

# Customization Surfaces

* **Replace**: swap a generated controller/service/widget via registry.
* **Extend**: add hooks (before/after validate/save), additional routes, or queries.
* **Style**: theme tokens; CSS‑in‑JS or Tailwind; component slots.
* **Compose**: build custom pages that mix generated widgets with bespoke components.
* **Override Policies**: per‑view/field overrides; temporary feature flags.

---

# Non‑functional Requirements

* **Performance**: code‑gen for cold start, query pushdown, batched resolvers.
* **Security**: least privilege defaults, CSRF/SSR‑safe templates, CSP, secrets management.
* **Scalability**: horizontal scaling, stateless app nodes, background workers.
* **Offline/Sync** (optional): client cache, conflict resolution (CRDTs or server‑wins strategies).
* **Accessibility & i18n**: WCAG AA baseline; translation keys auto‑extracted from model.

---

# MVP Scope (pragmatic first cut)

1. **Postgres‑only** persistence with generated migrations.
2. **Auth**: password + magic link; simple RBAC; tenant field.
3. **Entities** with CRUD, relations, computed fields, and state machine (basic).
4. **REST** (+ OpenAPI) and **typed TS client** with React Query hooks.
5. **Generated UI**: List, Detail, Form with overridable widgets + theme.
6. **Query DSL**: filters/sort/paginate; joins within tenant; saved queries.
7. **CLI** + **Model Studio** (alpha) + hot reload.
8. **Audit log** and basic observability.

---

# Competitive Landscape & Positioning

* **Retool/Low‑code**: fast UI but proprietary; your angle: OSS, model‑first, full‑stack.
* **Next.js + Prisma + tRPC + Admin UI**: flexible but lots of glue; your angle: one model → everything.
* **Redwood/Blitz/Nest**: strong opinions; your angle: stronger model compiler + UI synthesis.
* **Hasura/Supabase**: great data/API; your angle: unified UI + workflow/state machine + policy DSL.

---

# Open Questions / Design Risks

* **How dynamic is “dynamic”?** Balance runtime flexibility with code‑gen performance.
* **Policy mirroring**: how to safely reflect server policies in client without leaks.
* **Migrations**: safe diffs for destructive changes; data backfills.
* **Complex layouts**: limits of view schema vs bespoke pages.
* **N‑tier caching**: correctness vs speed; invalidation strategies.
* **Plugin sandboxing**: API boundaries, versioning, and stability.
* **Real‑time**: protocol choice and scale story (fan‑out, presence, ordering).

---

# Next Steps

* Lock an **MVP domain** (e.g., Orders/Invoices) to drive feature slicing.
* Draft v0 **model DSL spec** and **IR schema**.
* Build **DB generator**, **REST layer**, **UI list/form generator**.
* Dogfood in 1–2 real internal apps; iterate on DX.
