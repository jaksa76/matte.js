import { boolean, date, number, ownedEntity, string, group, hgroup, Matte } from "../framework";

// Example usage: customizing how fields are displayed in the UI
const Person = ownedEntity("Person", [
  // First name with no label, half width, and placeholder
  string("firstName").hideLabel().width(0.5).placeholder("Enter first name..."),
  
  // Last name aligned right, no label
  string("lastName").hideLabel().alignRight().width(0.5).placeholder("Enter last name..."),
  
  // Age with suffix and centered alignment
  number("age").suffix(" years").alignCenter().large().width(0.25),
  
  // Birth date with custom styling
  date("birthDate").label("Date of Birth").help("Enter your birth date in MM/DD/YYYY format").floatingLabel().width(0.5),
  
  // Active status with prefix
  boolean("isActive").label("Active User").prefix("Status:").bold().color('#00aa00'),
  
  // Email with full width and validation hint
  string("email").width(1).placeholder("user@example.com").help("We'll never share your email").floatingLabel(),
  
  // Salary - hidden from regular view, read-only when shown
  number("salary").hidden().readOnly().prefix("$").alignRight(),
]);

// Example: Conditional field styling based on value
// This shows the API design, actual implementation would be in the framework
const Order = ownedEntity("Order", [
  string("status").bold().color((value) => value === 'completed' ? 'green' : 'orange'),
  number("total").prefix("$").alignRight().large().bold(),
]);

// Example: CSS-like style object for advanced customization
const Task = ownedEntity("Task", [
  // Responsive and state-based styling
  string("title").style({
    base: { gridColumn: "span 2", fontSize: "var(--font-lg)" },
    "@md": { gridColumn: "span 1" },
    ":invalid": { outlineColor: "var(--danger)" },
  }),
  
  // View-specific styling
  string("status").style({
    ":table": { textTransform: "uppercase" },
    ":form": { minWidth: 120 },
  }),
]);

// Example: Field grouping for layout organization
const Project = ownedEntity("Project", [
  string("name").label("Project Name"),
  
  // Named horizontal group - columns implicit from children count
  hgroup("Timeline", [
    date("startDate").label("Start"),
    date("endDate").label("End"),
    string("status").label("Status"),
  ]),
  
  // Named vertical group (default) with collapsible option
  group("Budget Details", [
    number("estimatedCost").prefix("$"),
    number("actualCost").prefix("$"),
    number("variance").prefix("$").readOnly(),
  ]).collapsible().id("budget"),
  
  // Nameless group - just for layout organization
  group([
    string("description"),
    string("notes"),
  ]),
  
  // Nested groups with fluent API
  group("Team", [
    string("manager"),
    hgroup(null, [
      string("leadDeveloper"),
      string("leadDesigner"),
    ]),
  ]).collapsible().border("1px solid var(--border)").padding("10px"),
]);

const app = new Matte();
app.register(Person);
app.register(Order);
app.register(Task);
app.register(Project);
app.start();