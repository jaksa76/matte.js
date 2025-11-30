/**
 * Comprehensive example showing all shortcuts and field customization
 */

import { ownedEntity, t, field, string, number, date, richtext, file, boolean } from '../framework/entities';

console.log("\n🎯 Comprehensive Field API Examples\n");
console.log("=" .repeat(50) + "\n");

// ============================================================================
// Example 1: Basic shortcuts
// ============================================================================
console.log("1️⃣  Basic Shortcuts:");
console.log("-".repeat(50));

ownedEntity("Person", [
  string("firstName"),
  string("lastName"),
  number("age"),
  date("birthDate"),
  boolean("isActive"),
]);

console.log("✓ Person entity with basic field shortcuts\n");

// ============================================================================
// Example 2: Shortcuts with modifiers
// ============================================================================
console.log("2️⃣  Shortcuts with Modifiers:");
console.log("-".repeat(50));

ownedEntity("Product", [
  string("name").required().minLength(3).maxLength(100),
  string("sku").required(),
  number("price").required().min(0),
  number("stock").default(0).min(0),
  boolean("available").default(true),
  richtext("description"),
  file("images").array(),
  date("releaseDate"),
]);

console.log("✓ Product entity with field modifiers\n");

// ============================================================================
// Example 3: Using field() for complex types
// ============================================================================
console.log("3️⃣  Complex Types with field():");
console.log("-".repeat(50));

ownedEntity("Task", [
  string("title").required(),
  richtext("description"),
  field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array().maxSize(10 * 1024 * 1024), // 10MB
]);

console.log("✓ Task entity with enums and complex configurations\n");

// ============================================================================
// Example 4: Mixing shortcuts and field() helpers
// ============================================================================
console.log("4️⃣  Mixed Approach:");
console.log("-".repeat(50));

ownedEntity("BlogPost", [
  // Shortcuts for simple fields
  string("title").required().maxLength(200),
  string("slug").required(),
  richtext("content").required(),
  
  // field() for enums
  field("status", t.enum(["draft", "published", "archived"]).default("draft")),
  
  // More shortcuts
  date("publishedAt"),
  number("viewCount").default(0).min(0),
  boolean("featured").default(false),
  
  // File field
  file("coverImage"),
]);

console.log("✓ BlogPost entity with mixed approach\n");

// ============================================================================
// Summary
// ============================================================================
console.log("=" .repeat(50));
console.log("\n📚 API Summary:\n");
console.log("Shortcuts (for common types):");
console.log("  • string(name)   - Creates a string field");
console.log("  • number(name)   - Creates a number field");
console.log("  • date(name)     - Creates a date field");
console.log("  • richtext(name) - Creates a richtext field");
console.log("  • file(name)     - Creates a file field");
console.log("  • boolean(name)  - Creates a boolean field");
console.log("\nfield() helper (for complex types):");
console.log("  • field(name, t.enum([...]))  - For enum fields");
console.log("  • field(name, t.string())     - Alternative to shortcuts");
console.log("\nCommon modifiers (chainable):");
console.log("  • .required()           - Make field required");
console.log("  • .default(value)       - Set default value");
console.log("  • .min(n) / .max(n)     - Number constraints");
console.log("  • .minLength(n) / .maxLength(n) - String length");
console.log("  • .array()              - Make field an array");
console.log("  • .maxSize(bytes)       - File size limit");
console.log("  • .allowedTypes([...])  - File type restrictions");
console.log("\n✨ All shortcuts return chainable builders!");
console.log("✨ Field order is preserved in array-based schemas!\n");
