import { Matte } from './src/framework';
import { ownedEntity, string, richtext, field, t, date, number, file } from './src/framework/entities';

// Define the Task entity
const Task = ownedEntity("Task", [
  string("title").required(),
  richtext("description"),
  field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array(),
]);

// Create the framework
const app = new Matte({
  dbPath: './data.db',
  port: 3000,
});

// Register the entity
app.register(Task);

// Start the framework (initialize is now called internally)
await app.start();
