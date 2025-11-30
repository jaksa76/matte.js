/**
 * Example demonstrating different view types for entities
 */

import { Matte, listView, gridView } from '../framework';
import { ownedEntity, string, number, date, richtext } from '../framework/entities';

// ============================================================================
// Example 1: Grid View (Default)
// ============================================================================
// Grid view displays entities as cards in a responsive grid layout
const Product = ownedEntity("Product", [
  string("name").required(),
  string("category"),
  number("price").required().min(0),
  date("releaseDate"),
  richtext("description"),
]);

// ============================================================================
// Example 2: List View (Explicit)
// ============================================================================
// List view displays entities in a traditional table format
const Task = ownedEntity("Task", [
  string("title").required(),
  string("assignee"),
  string("status"),
  date("dueDate"),
]);

// ============================================================================
// Example 3: Grid View (Explicit)
// ============================================================================
// You can also explicitly set grid view using gridView()
const Article = ownedEntity("Article", [
  string("title").required(),
  string("author"),
  richtext("content"),
  date("publishedAt"),
]);

// Initialize the app
const app = new Matte();

// Register entities with different views
app.register(Product);              // Defaults to grid view
app.register(listView(Task));       // Explicitly use list view
app.register(gridView(Article));    // Explicitly use grid view

app.start();
