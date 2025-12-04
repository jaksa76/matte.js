# Task 007 — Shorthands for Common Fields

Date: 2025-12-04

## Overview
Provide shorthands for frequently used fields (e.g., `name`, `image`, `email`). These aliases reduce boilerplate when defining models, forms, and APIs in matte.js, applying sensible defaults (validation, formatting, and UI widgets) out of the box.

  - name() - string, required, renders differently than a generic text field
  - title() - like name but for titles
  - subtitle() - string, optional, shorter text, renders under name
  - description() - string, multi-line text area by default
  - email() - string, matches pattern
  - image() - file upload with specific extensions, In the UI cards have a special slot for it
  - phone() - string, phone number format
  - url() - string, URL format
  - address() - object with street, city, state, zip, country subfields
