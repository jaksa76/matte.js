# Goals addressed

* **Field‑local customization** lives *next to the field declaration*.
* **CSS‑like styling** (responsive + states + view contexts) without leaking full CSS.
* **Field order is preserved** and **groups/subcontainers** (named or nameless) are supported.
* **View customization is independent** of entity declarations, so imported entities can be themed/overridden.
* **Fluent‑first**, with structured equivalents possible later.

---

# 1) Field‑local customization (fluent)

```ts
import { ownedEntity, t, ui, css, field, group } from "@modelapp/runtime";

// Use an array to preserve field order and express groups.
ownedEntity("Task", [
  field("title", t.string().required()
    .ui((u) => u
      .label("Title")
      .widget(ui.text({ placeholder: "Write a clear task title" }))
      .style(css({
        base: { gridColumn: "span 2" },
        "@md": { gridColumn: "span 1" },
        ":table": { width: 320 },
        ":invalid": { outlineColor: "var(--danger)" },
      }))
    )
  ),

  group("Planning", [
    field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")
      .ui((u) => u
        .label("Status")
        .widget(ui.badge({
          variants: { done: "success", blocked: "danger", open: "neutral", in_progress: "info" },
        }))
        .style(css({ ":table": { textTransform: "uppercase" } }))
      )
    ),

    field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")
      .ui((u) => u.widget(ui.select({ pill: true })))
    ),

    field("dueDate", t.date()
      .ui((u) => u.widget(ui.date({ showTime: false })).style(css({ base: { minWidth: 180 } })))
    ),
  ], { columns: 3, collapsible: true, id: "planning" }),

  group(null, [ // nameless: just a layout block
    field("description", t.richtext().ui(u => u.widget(ui.richtext({ toolbar: "minimal" }))))
  ], { columns: 1 }),

  field("attachments", t.file().array().ui((u) => u.widget(ui.file({ maxFiles: 10 }))))
], {
  // Optional entity‑wide defaults still possible (labels, widgets) if you prefer
});
```

### Notes

* `field(name, builder)` is used when authoring with arrays; you can still pass an object if you don’t care about order. Arrays are **recommended** to preserve order.
* `group(title?: string, items: (field|group)[], opts)` creates **subcontainers** with layout hints: `columns`, `collapsible`, `id` for anchoring.
* `.ui(fn)` fluently sets **label**, **widget**, **format**, **visibility**, and **style** on a field.
* `css()` accepts a constrained, theme‑aware object:

  * **Responsive keys**: `@sm`, `@md`, `@lg`, `@xl`.
  * **State pseudos**: `:hover`, `:focus`, `:invalid`, `:required`, `:disabled`.
  * **View contexts**: `:table`, `:detail`, `:form`, `:miniCard`, `:quickCreate`.
  * Values accept primitives or **design tokens**: `var(--space-2)`, `var(--accent)`, etc.

---

# 2) View customization **independent** from entities

> Adjust built‑ins or register custom views in a separate module (works for entities from libraries).

```ts
import { customizeView, slot, ui, css } from "@modelapp/runtime";

// Tweak the built‑in table for Task without touching the entity file
customizeView("Task", "table", (v) => v
  .columns(["title", "status", "priority", "dueDate", "assignees"]) // order matters here too
  .defaultSort("-createdAt")
  .density("comfortable")
  .quickFilters(({ f }) => [
    f.equal("status", "open"),
    f.in("priority", ["high", "urgent"]).label("Hot"),
    f.overdue("dueDate")
  ])
  .style(css({ base: { rowGap: 4 }, ":row(odd)": { background: "var(--surface-1)" } }))
  .slot(slot.cell("status"), ({ value }) => ui.badge({ text: value }))
);

// Register a custom Kanban view as an alternate route
customizeView("Task", "kanban", (v) => v
  .route("/tasks/kanban")
  .uses(ui.primitives.kanban({ groupBy: "status" }))
  .toolbar((t) => t.searchOn(["title"]))
);
```

### Notes

* `customizeView(entityName, viewId, fn)` always operates outside the entity source, enabling **theming of imported entities**.
* `slot.*` helpers attach **render props** to stable view anchors (cells, headers, panels, toolbars).
* `.style(css(...))` here applies to the **view container** (rows, cards, panels). A few extra selectors are available: `:row(odd)`, `:card`, `:header`.

---

# 3) External decoration of an imported entity’s fields

> When you can’t edit the original entity, apply **field‑level tweaks** from the outside.

```ts
import { decorateEntity, ui, css } from "@modelapp/runtime";

decorateEntity("Task")
  .field("status").label("State").widget(ui.badge())
  .field("dueDate").style(css({ ":table": { width: 160 } }))
  .apply();
```

* `decorateEntity(name)` lets you patch **field defaults** post‑hoc. This is merged after the entity is registered but **before** views render.

---

# 4) Structured counterparts (for tools)

```jsonc
{
  "entity": "Task",
  "fields": [
    { "name": "title", "type": "string", "ui": {
      "label": "Title",
      "widget": { "kind": "text", "placeholder": "Write a clear task title" },
      "style": {
        "base": { "gridColumn": "span 2" },
        "@md": { "gridColumn": "span 1" },
        ":table": { "width": 320 },
        ":invalid": { "outlineColor": "var(--danger)" }
      }
    }},
    { "group": { "id": "planning", "title": "Planning", "columns": 3, "collapsible": true },
      "items": [
        { "name": "status", "type": { "enum": ["open","in_progress","blocked","done"] }, "ui": { "widget": { "kind": "badge" } } },
        { "name": "priority", "type": { "enum": ["low","medium","high","urgent"] } },
        { "name": "dueDate", "type": "date" }
      ]
    },
    { "group": { }, "items": [ { "name": "description", "type": "richtext" } ] },
    { "name": "attachments", "type": { "file": { "many": true } } }
  ]
}
```

And independent view config:

```jsonc
{
  "view": { "entity": "Task", "id": "table" },
  "columns": ["title","status","priority","dueDate","assignees"],
  "defaultSort": "-createdAt",
  "quickFilters": [
    { "equal": { "field": "status", "value": "open" } },
    { "in": { "field": "priority", "values": ["high", "urgent"], "label": "Hot" } }
  ],
  "style": { "base": { "rowGap": 4 }, ":row(odd)": { "background": "var(--surface-1)" } },
  "slots": { "cell:status": "cmp:Badge" }
}
```

---

# 5) Rules of precedence (simple mental model)

1. **Entity field `.ui()`** → base defaults.
2. **`decorateEntity()` patches** → override field defaults (for imported entities).
3. **`customizeView()`** → adjusts *a specific view*. It can also override field presentation *within that view*.
4. **Runtime policies** always win over visibility hints; clients never expand access.

---

# 6) CSS‑like constraints & tokens

* Supported properties are a curated set: layout (gridColumn, gap, width/height), spacing (margin/padding), typography (fontSize, fontWeight, textTransform), color (color/background/borderColor via tokens), border radius/shadow, opacity, display/visibility.
* No arbitrary selectors; only the provided **contexts** and **states** to keep it portable across renderers.
* Tokens: `--space-*`, `--radius-*`, `--font-*`, `--surface-*`, `--text-*`, `--accent`, `--danger`, etc.

---

# 7) Form and detail layout from groups

* Default **form** and **detail** layouts use the declared `group(...)` structure.
* A view can **ignore or re-map** groups via `customizeView().layout(...)` if needed.
* Each group can be targeted via anchors (ids) for deep‑linking, e.g., `/tasks/new#planning`.

---

# 8) Minimal renderer contract (so multiple UI kits can implement it)

* Widgets: `text`, `textarea`, `richtext`, `select`, `badge`, `date`, `userPicker`, `file`, `json`, etc.
* Primitives: `table`, `form`, `detail`, `miniCard`, `kanban`, `calendar`.
* Slot IDs: `cell:<field>`, `header`, `toolbar`, `panel:<name>`, `footer`.
* CSS contexts: `:table | :detail | :form | :miniCard | :quickCreate` + state pseudos.
