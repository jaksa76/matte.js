import { ownedEntity, t, field, string, richtext, date, number, file } from '../framework/entities';

ownedEntity("Task", [
  string("title").required(),
  richtext("description"),
  field("status", t.enum(["open", "in_progress", "blocked", "done"]).default("open")),
  field("priority", t.enum(["low", "medium", "high", "urgent"]).default("medium")),
  date("dueDate"),
  number("estimate").min(0),
  file("attachments").array(),
]);