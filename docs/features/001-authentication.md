# Authentication (Username/Password)

Overview:
Matte.js provides simple username/password authentication for apps. Users can sign in, sign out, and check session state with minimal code. Credentials are transmitted securely and sessions are stored in the browser. Usernames and passwords can be provided via code.

```typescript
import { Matte } from 'mattejs';
const app = new Matte();
app.auth.registerUser('username', 'password');
app.start();
```

If a user is not signed in a login button will be shown in at the bottom of the navigation drawer. Clicking the button will open a login dialog.
When a user is signed in, the user's username will be displayed at the bottom of the navigation drawer along with a logout button.