/**
 * Test application for E2E Playwright tests
 * 
 * This app includes multiple entities with customized fields
 * to demonstrate full framework capabilities
 */

import { Matte } from '../../src/framework';
import { 
  ownedEntity, 
  string, 
  number, 
  date, 
  richtext, 
  boolean, 
  field, 
  t,
  group,
  hgroup 
} from '../../src/framework/entities';

// ============================================================================
// Entity 1: Project with customized fields and grouping
// ============================================================================
const Project = ownedEntity("Project", [
  // Basic info with custom styling
  string("name")
    .required()
    .minLength(3)
    .maxLength(100)
    .placeholder("Enter project name...")
    .label("Project Name")
    .width(1),
  
  string("code")
    .required()
    .maxLength(10)
    .placeholder("PROJ-001")
    .label("Project Code")
    .width(0.3),
  
  // Status with enum
  field("status", t.enum(["planning", "active", "on-hold", "completed", "cancelled"]).default("planning")),
  
  // Priority with enum
  field("priority", t.enum(["low", "medium", "high", "critical"]).default("medium")),
  
  // Timeline group
  hgroup("Timeline", [
    date("startDate").label("Start Date"),
    date("endDate").label("End Date"),
    number("duration").suffix(" days").label("Duration").readOnly(),
  ]),
  
  // Budget group
  group("Budget Information", [
    number("estimatedBudget")
      .prefix("$")
      .min(0)
      .alignRight()
      .label("Estimated Budget"),
    number("actualCost")
      .prefix("$")
      .min(0)
      .default(0)
      .alignRight()
      .label("Actual Cost"),
    number("variance")
      .prefix("$")
      .readOnly()
      .alignRight()
      .label("Variance"),
  ]).collapsible(),
  
  // Description
  richtext("description")
    .label("Description")
    .placeholder("Enter project description..."),
  
  // Team members
  string("projectManager")
    .placeholder("Assigned PM")
    .label("Project Manager")
    .width(0.5),
  
  string("teamLead")
    .placeholder("Assigned Lead")
    .label("Team Lead")
    .width(0.5),
  
  // Flags
  boolean("isConfidential")
    .default(false)
    .label("Confidential"),
  
  boolean("requiresApproval")
    .default(false)
    .label("Requires Approval"),
]);

// ============================================================================
// Entity 2: Task with various field types
// ============================================================================
const Task = ownedEntity("Task", [
  string("title")
    .required()
    .minLength(1)
    .maxLength(200)
    .placeholder("What needs to be done?")
    .label("Task Title")
    .large(),
  
  richtext("description")
    .placeholder("Add task details...")
    .label("Description"),
  
  field("status", t.enum(["todo", "in_progress", "review", "done", "blocked"]).default("todo")),
  
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  
  field("type", t.enum(["bug", "feature", "improvement", "documentation"]).default("feature")),
  
  hgroup("Scheduling", [
    date("dueDate").label("Due Date"),
    number("estimatedHours")
      .min(0)
      .suffix(" hrs")
      .label("Estimate"),
    number("actualHours")
      .min(0)
      .default(0)
      .suffix(" hrs")
      .label("Actual"),
  ]),
  
  string("assignee")
    .placeholder("Assign to...")
    .label("Assignee")
    .width(0.5),
  
  string("tags")
    .placeholder("frontend, backend, urgent")
    .label("Tags")
    .width(0.5),
  
  boolean("completed")
    .default(false)
    .label("Mark as Complete"),
]);

// ============================================================================
// Entity 3: Customer with grouped information
// ============================================================================
const Customer = ownedEntity("Customer", [
  // Personal Information Group
  group("Personal Information", [
    string("firstName")
      .required()
      .placeholder("First name")
      .label("First Name")
      .width(0.5),
    
    string("lastName")
      .required()
      .placeholder("Last name")
      .label("Last Name")
      .width(0.5),
    
    string("email")
      .required()
      .placeholder("email@example.com")
      .label("Email Address"),
    
    string("phone")
      .placeholder("+1 (555) 000-0000")
      .label("Phone Number")
      .width(0.5),
    
    date("dateOfBirth")
      .label("Date of Birth")
      .width(0.5),
  ]),
  
  // Address Group
  group("Address", [
    string("street")
      .placeholder("123 Main St")
      .label("Street Address"),
    
    hgroup(null, [
      string("city").placeholder("City").label("City"),
      string("state").placeholder("State").label("State"),
      string("zipCode").placeholder("12345").label("ZIP Code"),
    ]),
    
    string("country")
      .default("USA")
      .label("Country"),
  ]).collapsible(),
  
  // Account Information
  group("Account Information", [
    field("accountType", t.enum(["individual", "business", "enterprise"]).default("individual")),
    
    field("status", t.enum(["active", "inactive", "suspended"]).default("active")),
    
    date("memberSince")
      .label("Member Since")
      .readOnly(),
    
    number("lifetimeValue")
      .prefix("$")
      .min(0)
      .default(0)
      .alignRight()
      .label("Lifetime Value"),
    
    boolean("vipStatus")
      .default(false)
      .label("VIP Status"),
  ]).collapsible(),
  
  // Notes
  richtext("notes")
    .placeholder("Add customer notes...")
    .label("Notes"),
]);

// ============================================================================
// Entity 4: Product with detailed fields
// ============================================================================
const Product = ownedEntity("Product", [
  string("name")
    .required()
    .minLength(2)
    .maxLength(150)
    .placeholder("Product name")
    .label("Product Name")
    .large(),
  
  string("sku")
    .required()
    .maxLength(50)
    .placeholder("SKU-12345")
    .label("SKU")
    .width(0.3),
  
  field("category", t.enum(["electronics", "clothing", "food", "books", "other"]).default("other")),
  
  field("status", t.enum(["draft", "active", "discontinued"]).default("draft")),
  
  richtext("description")
    .placeholder("Product description...")
    .label("Description"),
  
  hgroup("Pricing", [
    number("price")
      .required()
      .prefix("$")
      .min(0)
      .alignRight()
      .label("Price"),
    
    number("cost")
      .prefix("$")
      .min(0)
      .alignRight()
      .label("Cost"),
    
    number("margin")
      .suffix("%")
      .readOnly()
      .alignRight()
      .label("Margin"),
  ]),
  
  hgroup("Inventory", [
    number("stock")
      .default(0)
      .min(0)
      .label("Stock Level"),
    
    number("reorderPoint")
      .default(10)
      .min(0)
      .label("Reorder Point"),
    
    number("reorderQuantity")
      .default(50)
      .min(0)
      .label("Reorder Qty"),
  ]),
  
  hgroup("Physical", [
    number("weight")
      .min(0)
      .suffix(" lbs")
      .label("Weight"),
    
    number("length")
      .min(0)
      .suffix(" in")
      .label("Length"),
    
    number("width")
      .min(0)
      .suffix(" in")
      .label("Width"),
    
    number("height")
      .min(0)
      .suffix(" in")
      .label("Height"),
  ]).collapsible(),
  
  boolean("featured")
    .default(false)
    .label("Featured Product"),
  
  boolean("taxable")
    .default(true)
    .label("Taxable"),
]);

// ============================================================================
// Initialize and start the application
// ============================================================================
const app = new Matte({
  dbPath: ':memory:',
  port: 3002,
  defaultView: 'grid',
});

app.register(Project);
app.register(Task);
app.register(Customer);
app.register(Product);

await app.start();

console.log('✅ Test application started on http://localhost:3002');
console.log('   - Projects, Tasks, Customers, and Products registered');
console.log('   - All entities have customized fields and groups');
