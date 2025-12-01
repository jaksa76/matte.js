/**
 * Example demonstrating different view types for entities
 */

import { Matte, listView, gridView, show, hgroup } from '../framework';
import { ownedEntity, string, number, date, richtext } from '../framework/entities';

const app = new Matte();

// Register entity with default view (grid)
app.register(ownedEntity("Product", [
  string("name").required(),
  string("category"),
  number("price").required().min(0),
  date("releaseDate"),
  richtext("description"),
]));

// Register entity with list view
const Task = ownedEntity("Task", [
  string("title").required(),
  string("assignee"),
  string("status"),
  date("dueDate"),
]);
app.register(listView(Task));

// Register entity with explicit grid view
const Article = ownedEntity("Article", [
  string("title").required(),
  string("author"),
  richtext("content"),
  date("publishedAt"),
]);
app.register(gridView(Article));

// Custom view with field customization
const Event = ownedEntity("Event", [
  string("name").required(),
  date("date").required(),
  string("location"),
  richtext("details"),
]);

const EventSimpleView = gridView(Event, {
  pageName: "Events",
  customFields: [
    // Change the structure and styling of fields
    hgroup(null, [
      show("date").alignLeft().hideLabel(),
      show("location").alignRight().hideLabel(),
    ]),
    show("name").large().bold().alignCenter().hideLabel(),
    // details are hidden in this view
  ],
});
app.register(EventSimpleView);

app.start();
