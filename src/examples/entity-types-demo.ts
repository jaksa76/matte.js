/**
 * Example demonstrating entity types: access levels and lifecycle modes
 */

import { Matte } from '../framework';
import { 
  entity, 
  ownedEntity, 
  privateEntity, 
  sharedEntity, 
  singletonEntity,
  string, 
  number, 
  richtext, 
  boolean, 
  date,
  field,
  t
} from '../framework/entities';

// ============================================================================
// Example 1: Public Blog - Anyone can read, authenticated users can write
// ============================================================================
const BlogPost = sharedEntity("BlogPost", [
  string("title").required(),
  string("slug").required(),
  richtext("content"),
  field("status", t.enum(["draft", "published"]).default("draft")),
  date("publishedAt"),
  number("viewCount").default(0),
]);

// ============================================================================
// Example 2: Private Notes - Only owner can read and write
// ============================================================================
const PrivateNote = privateEntity("PrivateNote", [
  string("title").required(),
  richtext("content"),
  string("tags"),
  date("createdAt"),
  boolean("pinned").default(false),
]);

// ============================================================================
// Example 3: User Profile - One instance per user, owner access only
// ============================================================================
const UserProfile = entity("UserProfile", [
  string("displayName").required(),
  string("bio"),
  string("avatar"),
  string("website"),
  string("location"),
])
  .lifecycle('instancePerUser')
  .readLevel('owner')
  .writeLevel('owner');

// ============================================================================
// Example 4: Application Settings - Single instance, any authenticated user can access
// ============================================================================
const AppSettings = singletonEntity("AppSettings", [
  string("appName").default("My App"),
  string("theme").default("light"),
  boolean("maintenanceMode").default(false),
  string("welcomeMessage"),
  number("maxUploadSize").default(5 * 1024 * 1024), // 5MB
]);

// ============================================================================
// Example 5: Custom access control - Public read, owner write
// ============================================================================
const Comment = entity("Comment", [
  string("content").required(),
  string("author").required(),
  date("createdAt"),
  number("likes").default(0),
])
  .readLevel('unauthenticated')
  .writeLevel('owner');

// ============================================================================
// Example 6: Team Wiki - Authenticated read/write (default)
// ============================================================================
const WikiPage = entity("WikiPage", [
  string("title").required(),
  string("slug").required(),
  richtext("content"),
  date("lastModified"),
  string("lastModifiedBy"),
  number("version").default(1),
]);

// ============================================================================
// Example 7: User Dashboard - One per user, user can read/write
// ============================================================================
const Dashboard = entity("Dashboard", [
  string("layout").default("default"),
  string("widgets"), // JSON string of widget configuration
  string("theme").default("light"),
  boolean("compactMode").default(false),
])
  .lifecycle('instancePerUser')
  .readLevel('owner')
  .writeLevel('owner');

// ============================================================================
// Example 8: Feature Flags - Singleton, authenticated users can read, admins write
// ============================================================================
const FeatureFlags = entity("FeatureFlags", [
  boolean("newUIEnabled").default(false),
  boolean("betaFeatures").default(false),
  boolean("experimentalAPI").default(false),
])
  .lifecycle('singleton')
  .readLevel('authenticated')
  .writeLevel('authenticated'); // In real app, you'd add admin check in API layer

// ============================================================================
// Setup application
// ============================================================================
const app = new Matte({
  appName: "Entity Types Demo",
  port: 3000,
});

// Register all entities
app.register(BlogPost);
app.register(PrivateNote);
app.register(UserProfile);
app.register(AppSettings);
app.register(Comment);
app.register(WikiPage);
app.register(Dashboard);
app.register(FeatureFlags);

// Register some test users
app.auth.registerUser('alice', 'password123');
app.auth.registerUser('bob', 'password123');

app.start();

console.log(`
Entity Types Demo started!

Access Levels:
- BlogPost: Public read, authenticated write (sharedEntity)
- PrivateNote: Owner read/write (privateEntity)
- Comment: Public read, owner write (custom)
- WikiPage: Authenticated read/write (default)

Lifecycle Modes:
- UserProfile: One instance per user
- Dashboard: One instance per user
- AppSettings: Single instance for entire app
- FeatureFlags: Single instance for entire app

Test Users:
- Username: alice, Password: password123
- Username: bob, Password: password123

Try it out:
1. Visit http://localhost:3000
2. Register or login with test users
3. Create different types of entities
4. Observe access control in action!
`);
