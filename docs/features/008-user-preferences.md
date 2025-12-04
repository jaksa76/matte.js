# Feature: User Preferences (TaskNo: 008)

Overview
Users can persist individualized preferences (one preferences instance per user). Preferences are loaded on sign-in and applied across sessions and devices. The syntax should be the same as for defining entities.

Example Usage
```ts
app.userPreferences([
  field("theme", t.enum(["light", "dark"])).default("light"),
  field("language", t.lang()).default("en-US"),
  field("currency", t.enum(["USD", "EUR", "JPY"])).default("EUR"),
  group("notifications", [
    field("email", t.boolean()).default(true),
    field("sms", t.boolean()).default(false),
  ])
])
```

For now preferences are just per user data that can be edited by the user.