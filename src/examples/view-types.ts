/**
 * Example demonstrating different view types for entities
 */

import { Matte, listView, gridView, customGridView, show } from '../framework';
import { ownedEntity, string, number, date, richtext, hgroup, field } from '../framework/entities';

const app = new Matte();

// Default view (grid)
app.register(ownedEntity("Product", [
  string("name").required(),
  string("category"),
  number("price").required().min(0),
  date("releaseDate"),
  richtext("description"),
]));

// Override to use list view
app.register(listView(ownedEntity("Task", [
  string("title").required(),
  string("assignee"),
  string("status"),
  date("dueDate"),
])));

// Explicitly use grid view
app.register(gridView(ownedEntity("Article", [
  string("title").required(),
  string("author"),
  richtext("content"),
  date("publishedAt"),
])));

// Custom view definition
const Event = ownedEntity("Event", [
  string("name").required(),
  date("date").required(),
  string("location"),
  richtext("details"),
]);

const EventSimpleView = customGridView(Event, [
  show("name").large().bold().alignCenter().hideLabel(),
  hgroup(null, [
    show("date").alignLeft(),
    show("location").alignRight(),
  ]),
  // details are hidden in this view
]);
app.register(EventSimpleView);

app.start();
