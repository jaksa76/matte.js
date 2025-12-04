# Feature: User Registration (TaskNo: 002)

Date: 2025-12-04T08:51:12.867Z

## Overview
There should be an option to enable users to create accounts using email/password and optional profile fields. 

## Simple Example
```ts
matte.auth.enableUserRegistration();
matte.start();
```

## Custom User Fields
```ts
import { userEntity, string, date, field } from "matte/fields";

matte.auth.enableUserRegistration(userEntity[
  // email and password are included by default
  string("First Name").max(50).required(),
  string("Surname").max(50).required(),
  date("Date of Birth").optional(),
  string("Phone Number").pattern(/^\+\d{10,15}$/).unique().optional(),
  field("Document Type").enum(["passport", "id_card", "driver_license"]).required(),
  field("Issuing Country").country().required(),
  field("Document Image").image().required(),
]);
matte.start();
```

## Application Flow
If a user is not signed in, they will see a "Sign Up" button next to the "Login" button on the login screen. Clicking "Sign Up" opens a registration form with fields for email, password, and any custom fields defined in the user entity.
Upon submitting the form, the system validates the input, creates a new user account. The user is then redirected to the main application interface.

## Other:
- No email verification for now.
- No Rate limiting and CAPTCHA thresholds for now.
