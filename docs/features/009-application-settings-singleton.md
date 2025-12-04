# TaskNo: 009 — Application Settings (Singleton)

## Overview
A global, editable settings object. Designed for environment config and default behaviors. The settings object is a singleton and the syntax mirrors entity definitions. It is a changeable object. Settings do not change the application behaviour at the moment, in future the app will be able to be retrieve them at runtime.
Settings are stored in a conf file. Changing a setting and saving it updates the conf file.

## Usage Example
```ts
app.settings([
  field("featureFlagX", t.boolean()).default(false),
  field("maxUploadSizeMB", t.number()).default(50),
  group("3rdPartyApi", [
    field("baseUrl", t.url()).default("https://api.example.com"),
    field("timeoutMs", t.number()).default(5000),
    field("apiKey", t.string()).default("")
  ])
])
```

## Notes
- Mutable singleton: one settings instance per app.
- For now all users can edit the settngs. We will add permissions later.
- No support for injecting settings via env vars at the moment.
