# Authentication Feature

The authentication feature in Matte.js provides simple username/password authentication with session management. Users can sign in, sign out, and their session state persists across page reloads.

## Quick Start

```typescript
import { Matte } from 'mattejs';

const app = new Matte();

// Register users programmatically
app.auth.registerUser('alice', 'password123');
app.auth.registerUser('bob', 'securepass');

await app.start();
```

## Features

- ✅ Username/password authentication
- ✅ Secure password hashing (using Bun's built-in bcrypt)
- ✅ HTTP-only cookie sessions
- ✅ Login/logout UI in navigation drawer
- ✅ Automatic owner tracking for entities
- ✅ Session persistence across page reloads

## UI Components

### Navigation Drawer

When authentication is enabled, the navigation drawer automatically displays:

- **Login button** - Shows at the bottom when not authenticated
- **Username display** - Shows the logged-in user's name
- **Logout button** - Allows users to sign out

### Login Dialog

Clicking the login button opens a modal dialog with:
- Username input field
- Password input field
- Login/Cancel buttons
- Error message display

## API Endpoints

The framework automatically registers these authentication endpoints:

### POST /api/auth/login
Login with username and password.

**Request:**
```json
{
  "username": "alice",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "session-token-uuid",
  "username": "alice"
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### GET /api/auth/session
Check current session status.

**Response:**
```json
{
  "authenticated": true,
  "username": "alice"
}
```

### POST /api/auth/logout
Logout and destroy the current session.

**Response:**
```json
{
  "success": true
}
```

## Ownership Tracking

When a user is authenticated, their username is automatically attached to entities they create:

```typescript
// Define an owned entity
const Task = ownedEntity('Task', [
  string('title').required(),
  richtext('description'),
]);

// When user 'alice' creates a task, it will have:
// { id: 'xxx', title: 'My Task', owner_id: 'alice', ... }
```

The `owner_id` field is automatically added to all entities created with `ownedEntity()`.

## Session Management

Sessions are managed via HTTP-only cookies:
- Cookie name: `matte_session`
- Secure: Yes (in production)
- HttpOnly: Yes
- SameSite: Strict
- Max-Age: 86400 seconds (24 hours)

## Security

### Password Hashing
Passwords are hashed using Bun's built-in password hashing (bcrypt-based):
```typescript
const hash = Bun.password.hashSync(password);
const isValid = Bun.password.verifySync(password, hash);
```

### Session Tokens
- Generated using `crypto.randomUUID()`
- Stored in HTTP-only cookies
- Validated on each API request

### HTTPS Recommendation
For production deployments, always use HTTPS to protect credentials in transit.

## Example Usage

### Basic Authentication

```typescript
import { Matte, ownedEntity, string } from 'mattejs';

const app = new Matte({ port: 3000 });

// Register users
app.auth.registerUser('alice', 'password123');
app.auth.registerUser('bob', 'securepass');

// Define owned entity
const Note = ownedEntity('Note', [
  string('title').required(),
  string('content'),
]);

app.register(Note);
await app.start();
```

### Checking Session in Custom Code

```typescript
// The AuthManager is accessible via app.auth
const username = app.auth.validateSession(token);
if (username) {
  console.log(`User ${username} is authenticated`);
}
```

## Testing

### Unit Tests
Test the AuthManager directly:

```typescript
import { AuthManager } from 'mattejs';

const auth = new AuthManager();
auth.registerUser('test', 'password');
const token = auth.login('test', 'password');
const username = auth.validateSession(token);
```

### Integration Tests
Test the authentication endpoints:

```typescript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test', password: 'password' }),
});
```

## Future Enhancements

Potential improvements for future versions:

- [ ] User registration UI
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Role-based access control
- [ ] OAuth/SSO integration
- [ ] Session timeout configuration
- [ ] Remember me functionality
- [ ] Account lockout after failed attempts

## Backward Compatibility

This feature introduces a **breaking change** to the `Server` and `APIServer` constructors:

**Before:**
```typescript
new Server(apiServer, entities, pages, { port })
```

**After:**
```typescript
new Server(apiServer, entities, pages, authManager, { port })
```

**Before:**
```typescript
await apiServer.handle(req)
```

**After:**
```typescript
await apiServer.handle(req, authManager)
```

If you were directly instantiating these classes (not recommended), you'll need to update your code. The recommended way is to use the `Matte` class, which handles this automatically.
