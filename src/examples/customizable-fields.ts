/**
 * This example demonstrates field display customization with the new array-based API.
 * 
 * Key features:
 * 1. Array-based schema that preserves field order
 * 2. Shortcut helpers (string(), richtext(), etc.) for common field types
 * 3. Full field() helper for complex configurations
 * 4. Vision for future UI customization capabilities
 */

import { ownedEntity, t, field, string, richtext, date, number, file } from '../framework/entities';

// ============================================================================
// CURRENT IMPLEMENTATION: Array-based API with field ordering
// ============================================================================

// Example 1: Using shortcut helpers for common field types
ownedEntity("Task", [
  // Shortcut: string(name) creates a string field
  string("title").required(),
  
  // Shortcut: richtext(name) creates a richtext field
  richtext("description"),
  
  // field() helper for enums and other complex types
  field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  
  // More shortcuts
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array(),
]);

console.log("\n✓ Task entity registered with array-based schema");
console.log("✓ Field order is preserved: title → description → status → priority → dueDate → estimate → attachments\n");

// ============================================================================
// VISION: Future UI customization API (not yet implemented)
// ============================================================================

/*
 * The following shows how field customization would work in the future,
 * based on the refined-functionality.md vision document.
 */

const visionExample = `
import { ownedEntity, t, field, string, richtext, ui, css, group } from '@modelapp/runtime';

ownedEntity("Task", [
  // Field with full UI customization
  field("title", t.string().required()
    .ui((u) => u
      .label("Task Title")
      .widget(ui.text({ 
        placeholder: "Write a clear task title",
        maxLength: 200 
      }))
      .style(css({
        base: { 
          gridColumn: "span 2",
          fontSize: "var(--font-lg)" 
        },
        "@md": { gridColumn: "span 1" },
        ":table": { 
          width: 320,
          fontWeight: 600 
        },
        ":invalid": { 
          outlineColor: "var(--danger)",
          backgroundColor: "var(--danger-subtle)" 
        },
      }))
    )
  ),

  // Grouping fields with layout hints
  group("Planning", [
    field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")
      .ui((u) => u
        .label("Status")
        .widget(ui.badge({
          variants: { 
            done: "success", 
            blocked: "danger", 
            open: "neutral", 
            in_progress: "info" 
          },
        }))
        .style(css({ 
          ":table": { textTransform: "uppercase" },
          ":detail": { fontSize: "var(--font-xl)" }
        }))
      )
    ),

    field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")
      .ui((u) => u
        .label("Priority Level")
        .widget(ui.select({ pill: true }))
      )
    ),

    date("dueDate")
      .ui((u) => u
        .widget(ui.date({ showTime: false }))
        .style(css({ base: { minWidth: 180 } }))
      ),
  ], { 
    columns: 3, 
    collapsible: true, 
    id: "planning" 
  }),

  richtext("description")
    .ui((u) => u
      .widget(ui.richtext({ toolbar: "minimal" }))
    ),

  file("attachments").array()
    .ui((u) => u
      .widget(ui.file({ maxFiles: 10 }))
    ),
]);
`;

const viewCustomizationVision = `
// Independent view customization (works for imported entities too)
import { customizeView, slot, ui, css } from "@modelapp/runtime";

customizeView("Task", "table", (v) => v
  .columns(["title", "status", "priority", "dueDate", "estimate"])
  .defaultSort("-createdAt")
  .quickFilters(({ f }) => [
    f.equal("status", "open").label("Open Tasks"),
    f.in("priority", ["high", "urgent"]).label("Hot Items"),
  ])
  .style(css({ 
    base: { rowGap: 4 },
    ":row(odd)": { background: "var(--surface-1)" },
  }))
);
`;

export const customizationVision = {
  fieldCustomization: visionExample,
  viewCustomization: viewCustomizationVision,
};