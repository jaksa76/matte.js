# Authentication (Username/Password)

## Overview
Matte.js provides simple username/password authentication for apps. Users can sign in, sign out, and check session state with minimal code. Credentials are transmitted securely and sessions are stored in the browser. Usernames and passwords can be provided via code.

```typescript
import { Matte } from 'mattejs';
const app = new Matte();
app.auth.registerUser('username', 'password');
app.start();
```

If a user is not signed in a login button will be shown in at the bottom of the navigation drawer. Clicking the button will open a login dialog.
When a user is signed in, the user's username will be displayed at the bottom of the navigation drawer along with a logout button.

## Implementation Plan

### Server-Side Components

#### `src/framework/Matte.ts` (MODIFY)
- Add `auth` property (instance of `AuthManager`)
- Initialize `AuthManager` in constructor
- Pass `authManager` to `Server` instance
- Expose `registerUser()` method as public API

#### `src/framework/Server.ts` (MODIFY)
- Add `authManager` property
- Register auth API routes in constructor
- Add session middleware for validating requests
- Handle auth endpoints alongside existing API routes

#### `src/framework/AuthManager.ts` (NEW)
- `registerUser(username: string, password: string): void` - hash and store credentials
- `login(username: string, password: string): string | null` - verify credentials AND create session, return token (or null if invalid)
- `validateSession(token: string): string | null` - verify session, return username
- `logout(token: string): void` - destroy session
- Store credentials map (username -> hashed password)
- Store sessions map (token -> username)

#### Auth API Endpoints (in Server.ts)
- `POST /api/auth/login` - calls `authManager.login()`, sets cookie, returns token
- `POST /api/auth/logout` - calls `authManager.logout()`, clears cookie
- `GET /api/auth/session` - returns `{ authenticated: boolean, username?: string }` for initial page load

### Client-Side Components

#### `src/framework/ui/NavigationDrawer.tsx` (NEW or MODIFY)
- Fetch session status on component mount
- Show login button when not authenticated
- Show username + logout button when authenticated
- Handle login/logout button clicks

#### `src/framework/ui/LoginDialog.tsx` (NEW)
- Material Design dialog with username/password inputs
- Submit credentials to `POST /api/auth/login`
- Store session token (automatically via cookie)
- Close dialog on success, show error message on failure

### Session Management
- Session tokens attached via HTTP-only cookies (automatic with each request)
- Server validates session on protected routes via middleware
- Middleware attaches username to request object for entity ownership enforcement