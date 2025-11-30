import { Framework } from '../framework';
import { ownedEntity, t, field, string, richtext, date, number, file } from '../framework/entities';

// Define the Task entity (entities are no longer auto-registered)
const Task = ownedEntity("Task", [
  string("title").required(),
  richtext("description"),
  field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array(),
]);

// To use this entity, register it with a Framework instance:
const app = new Framework();
app.register(Task);
await app.start();