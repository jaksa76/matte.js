# 004 – Entity Relationships

## Overview
Add first‑class relationship primitives so entities can reference each other declaratively: one‑to‑one, one‑to‑many, and many‑to‑many. Goal: concise schema syntax, automatic foreign key management, lazy loading, no cascading, and UI auto‑generation (linked pickers, embedded tables, chips).

## Proposed Usage
```ts
import { entity, string, relation } from 'matte';

const Author = entity('Author', [
  string('name').required(),
]);

const Book = entity('Book', [
  string('title').required(),
  date('publishedDate'),
]);

const Tag = entity('Tag', [string('label').required()]);

oneToMany(Author, Book);
manyToMany(Book, Tag);
```
