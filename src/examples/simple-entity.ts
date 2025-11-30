import { ownedEntity, t } from '../framework/entities';

ownedEntity("Task", {
  title: t.string().required(),
  description: t.richtext(),
  status: t.enum(["open", "in_progress", "blocked", "done"]).default("open"),
  priority: t.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: t.date(),
  estimate: t.number().min(0),
  attachments: t.file().array(),
});