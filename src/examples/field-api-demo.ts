/**
 * Comprehensive example showing all shortcuts and field customization
 */

import { ownedEntity, t, field, string, number, date, richtext, file, boolean } from '../framework/entities';

// ============================================================================
// Example 1: Basic shortcuts
// ============================================================================
ownedEntity("Person", [
  string("firstName"),
  string("lastName"),
  number("age"),
  date("birthDate"),
  boolean("isActive"),
]);

// ============================================================================
// Example 2: Shortcuts with modifiers
// ============================================================================
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

// ============================================================================
// Example 3: Using field() for complex types
// ============================================================================
ownedEntity("Task", [
  string("title").required(),
  richtext("description"),
  field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array().maxSize(10 * 1024 * 1024), // 10MB
]);

// ============================================================================
// Example 4: Mixing shortcuts and field() helpers
// ============================================================================
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
