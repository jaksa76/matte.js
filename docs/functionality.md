# Goals

* **Fluent‑first** runtime API for UI customization.
* Defaults: table (list), mini‑card (grid), detail (read), form (create/edit), quick‑create (modal).
* Three levels of control:

  1. **Entity‑level** field presentation defaults (apply to all views).
  2. **View‑level** overrides (tweak a built‑in view instance).
  3. **Custom views** (compose primitives; register as new routes/view modes).
* All APIs normalize to a **structured view schema** internally.

---

# Imports & primitives (conceptual)

```ts
import {
  ownedEntity, privateEntity, sharedEntity, t, ref,
  ui, // ui builder namespace
} from "@modelapp/runtime";
```

---

# 1) Entity‑level: field presentation defaults

> Define **how a field appears** everywhere by default (label, widget, format, validation feedback, help, visibility, width, etc.).

```ts
ownedEntity("Task", {
  title: t.string().required(),
  description: t.richtext(),
  status: t.enum(["open", "in_progress", "blocked", "done"]).default("open"),
  priority: t.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: t.date(),
  estimate: t.number().min(0),
  assignees: ref("User").many(),
  attachments: t.file().array(),
}, {
  ui: ui.entity()
    .label({
      title: "Title",
      estimate: "Est. hours",
    })
    .widget({
      description: ui.widget.richtext({ toolbar: "minimal" }),
      status: ui.widget.badge({
        variants: {
          open: "neutral",
          in_progress: "info",
          blocked: "danger",
          done: "success",
        },
      }),
      priority: ui.widget.select({ pill: true }),
      dueDate: ui.widget.date({ showTime: false }),
      assignees: ui.widget.userPicker({ multiple: true }),
      attachments: ui.widget.file({ accept: ["image/*", "application/pdf"], maxFiles: 10 }),
    })
    .format({
      estimate: (n) => `${n} h`,
      dueDate: (d, ctx) => ctx.relativeDate(d),
    })
    .visibility({
      attachments: (ctx) => ctx.view !== "table", // hide files in table by default
    })
    .width({
      title: 3, description: 6, attachments: 3, // grid span hints for forms/detail
    })
});
```

* `ui.entity()` returns a fluent builder capturing cross‑view defaults.
* All callbacks receive a **UI ctx** with current user, role, view id, breakpoints, and feature flags.

---

# 2) View‑level overrides of built‑in views

> Adjust columns, filters, layout, actions, empty states, row decoration, etc., for a specific built‑in view.

```ts
ownedEntity("Task", { /* fields */ }, {
  ui: ui.entity()
    // ... (field defaults from previous example)
    .view("table", (v) => v
      .title("Tasks")
      .icon("SquareCheck")
      .columns(["title", "status", "priority", "assignees", "dueDate"])
      .stickyHeader(true)
      .density("comfortable") // or "compact"
      .defaultSort("-createdAt")
      .rowStyle((row) => ({
        highlight: row.priority === "urgent" || row.status === "blocked",
      }))
      .quickFilters(({ f }) => [
        f.equal("status", "open"),
        f.in("priority", ["high", "urgent"]).label("Hot"),
        f.overdue("dueDate"),
        f.mine(), // convenience for owner == me
      ])
      .bulkActions((a) => [
        a.custom("setStatus", { to: "done" }).label("Mark done"),
        a.delete(),
      ])
      .toolbar((t) => t
        .searchOn(["title", "description"])
        .button("quickCreate")
        .button("exportCsv")
      )
      .emptyState(ui.emptyState
        .title("No tasks yet")
        .body("Create your first task to get started.")
        .primaryAction("create")
      )
    )
    .view("detail", (v) => v
      .title((row) => row.title)
      .layout((l) => l
        .tabs((t) => t
          .tab("Overview", (s) => s.grid([
            ["title", "status", "priority"],
            ["assignees"],
            ["dueDate", "estimate"],
            ["description"],
            ["attachments"],
          ]))
          .tab("Activity", (s) => s.timeline("audit"))
        )
      )
      .actions((a) => [
        a.edit(),
        a.custom("start").visible((row) => row.status === "open"),
        a.custom("complete").visible((row) => row.status !== "done"),
      ])
    )
    .view("form", (v) => v
      .mode("create|edit")
      .layout((l) => l.grid([
        ["title"],
        ["description"],
        ["assignees"],
        ["status", "priority", "estimate", "dueDate"],
        ["attachments"],
      ]))
      .submitLabel((m) => (m === "create" ? "Create task" : "Save changes"))
      .validationSummary(true)
    )
});
```

**Notes**

* `view(id, configure)` targets built‑ins: `table`, `miniCard`, `detail`, `form`, `quickCreate`.
* Each view exposes specific fluent helpers: `.columns()` for tables, `.grid()` for forms, etc.
* Everything compiles to a structured view schema used by the renderer.

---

# 3) Custom views (register new view modes/routes)

> Compose primitives to build a Kanban, Calendar, or bespoke dashboard and register it alongside built‑ins.

```ts
ownedEntity("Task", { /* fields */ }, {
  ui: ui.entity()
    .customView("kanban", (v) => v
      .title("Kanban")
      .route("/tasks/kanban")           // mounted automatically under entity route
      .uses(ui.primitives.kanban({
        groupBy: "status",
        orderBy: ["priority DESC", "createdAt DESC"],
        columns: [
          { id: "open", label: "Open" },
          { id: "in_progress", label: "In progress" },
          { id: "blocked", label: "Blocked" },
          { id: "done", label: "Done" },
        ],
        card: ui.card()
          .title((row) => row.title)
          .subtitle((row) => `${row.priority} • ${row.assignees.length} assignees`)
          .badges((row) => [
            row.priority === "urgent" && { text: "Urgent", tone: "danger" },
            row.dueDate && ui.badge.date(row.dueDate),
          ].filter(Boolean)),
        onDrop: ui.action("setStatus"),
      }))
      .toolbar((t) => t.searchOn(["title"]))
      .permissions({ read: "any", write: "owner() or role('manager')" })
    )
});
```

* `customView` takes a **renderer primitive** (kanban, calendar, chart, map) or a **component ref** via registry id: `.uses(ui.component("acme.TaskHeatmap"))`.
* It registers route, breadcrumb, and menu item if desired (`.menu(true)` default).

---

# 4) Per‑role / per‑segment variants

> Target different audiences without forking entities.

```ts
ownedEntity("Task", { /* fields */ }, {
  ui: ui.entity()
    .variant("manager", (u) => u
      .view("table", (v) => v
        .columns(["title", "status", "priority", "assignees", "estimate", "dueDate"])
        .quickFilters(({ f }) => [f.in("status", ["open", "in_progress", "blocked"])])
      )
      .permissions({ menu: "role('manager')" })
    )
    .variant("contributor", (u) => u
      .view("table", (v) => v
        .columns(["title", "status", "dueDate"]) // simpler
      )
      .permissions({ menu: "not role('manager')" })
    )
});
```

* Variants share the same routes by default; you can also assign dedicated routes: `.routeSuffix("/manager")`.

---

# 5) Field‑level slots & render props

> Last‑mile control without replacing whole views.

```ts
ownedEntity("Task", { /* fields */ }, {
  ui: ui.entity()
    .slot("table.cell.status", ({ row, value }) => ui.badge({
      text: value,
      tone: value === "blocked" ? "danger" : value === "done" ? "success" : "neutral",
    }))
    .slot("detail.section.meta", ({ row }) => ui.kv([
      ["Created", ui.timeago(row.createdAt)],
      ["Updated", ui.timeago(row.updatedAt)],
    ]))
});
```

* Slots are **stable IDs** where custom renderers can be attached. They receive a typed context.
* Common slot namespaces: `table.header.*`, `table.cell.<field>`, `detail.section.*`, `form.footer`, `toolbar.*`.

---

# 6) Actions in UI (bind to entity actions)

```ts
ownedEntity("Task", { /* fields */ }, {
  actions: {
    setStatus: ui.action.input<{ id: string; status: string }>()
      .server("fn:task.setStatus")            // server function registry id
      .visible((row, ctx) => ctx.canWrite(row))
      .confirm(({ status }) => `Move to ${status}?`),
  },
  ui: ui.entity()
    .view("table", (v) => v.actions((a) => [a.custom("setStatus"), a.delete()]))
    .view("detail", (v) => v.actions((a) => [a.edit(), a.custom("setStatus")]))
});
```

* Actions are defined once, then **referenced** from views.
* Visibility conditions run client‑side and are re‑checked server‑side.

---

# 7) Structured counterpart (for tools)

> The runtime can emit/accept a JSON‑ish schema equivalent to the fluent configuration.

```ts
{
  "entity": "Task",
  "views": {
    "table": {
      "title": "Tasks",
      "columns": ["title", "status", "priority", "assignees", "dueDate"],
      "defaultSort": "-createdAt",
      "quickFilters": [
        { "equal": { "field": "status", "value": "open" } },
        { "in": { "field": "priority", "values": ["high", "urgent"], "label": "Hot" } },
        { "overdue": { "field": "dueDate" } },
        { "mine": {} }
      ],
      "emptyState": { "title": "No tasks yet", "primaryAction": "create" }
    },
    "detail": {
      "layout": {
        "tabs": [
          { "id": "overview", "grid": [["title", "status", "priority"], ["assignees"], ["dueDate", "estimate"], ["description"], ["attachments"]] },
          { "id": "activity", "timeline": "audit" }
        ]
      }
    }
  },
  "slots": {
    "table.cell.status": "cmp:TaskStatusBadge"
  }
}
```

* Tools reference components via registry ids (`cmp:*`) and actions via function ids (`fn:*`).

---

# 8) Safety & accessibility baked in

* UI widgets carry native **validation & ARIA** attributes; focus management in dialogs/forms.
* Table density/columns respond to breakpoints with sane defaults; devs can override.
* Field visibility never bypasses **server‑side policies**; client only mirrors allowed UI.

---

# 9) Minimal mental model

* **Entity defaults** → “How fields look everywhere.”
* **View overrides** → “How *this* page looks.”
* **Custom views** → “New page type with your composition.”
* **Slots** → “Targeted custom renderers without rebuilding the view.”
* **Actions** → “Bind server behaviors into UI affordances.”
