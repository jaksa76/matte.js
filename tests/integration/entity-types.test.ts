import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Matte } from '../../src/framework/framework';
import { 
  entity, 
  ownedEntity, 
  privateEntity, 
  sharedEntity, 
  singletonEntity,
  string, 
  number, 
  boolean 
} from '../../src/framework/entities';

describe('Entity Types Integration Tests', () => {
  let app: Matte;
  let baseUrl: string;
  const testPort = 3002;

  beforeAll(async () => {
    // Define test entities with different access levels
    const PublicArticle = sharedEntity('PublicArticle', [
      string('title').required(),
      string('content'),
    ]);

    const PrivateNote = privateEntity('PrivateNote', [
      string('title').required(),
      string('content'),
    ]);

    const UserProfile = entity('UserProfile', [
      string('bio'),
      string('avatar'),
    ])
      .lifecycle('instancePerUser')
      .readLevel('owner')
      .writeLevel('owner');

    const AppSettings = singletonEntity('AppSettings', [
      string('theme').default('light'),
      boolean('maintenanceMode').default(false),
    ]);

    app = new Matte({
      dbPath: ':memory:',
      port: testPort,
    });

    app.register(PublicArticle);
    app.register(PrivateNote);
    app.register(UserProfile);
    app.register(AppSettings);

    // Register test users
    app.auth.registerUser('user1', 'password1');
    app.auth.registerUser('user2', 'password2');

    await app.start();
    
    baseUrl = `http://localhost:${testPort}`;
  });

  afterAll(() => {
    if (app) {
      app.close();
    }
  });

  beforeEach(async () => {
    // Clear all data between tests
    // Need to authenticate to clean up owner-level entities
    const users = ['user1', 'user2'];
    
    for (const username of users) {
      try {
        const token = await login(username, `password${username.slice(-1)}`);
        const entities = ['public-article', 'private-note', 'user-profile', 'app-settings'];
        
        for (const entity of entities) {
          const items = await fetch(`${baseUrl}/api/${entity}`, {
            headers: { 'Cookie': `matte_session=${token}` }
          }).then(r => r.ok ? r.json() : []).catch(() => []) as any[];
          
          for (const item of items) {
            await fetch(`${baseUrl}/api/${entity}/${item.id}`, { 
              method: 'DELETE',
              headers: { 'Cookie': `matte_session=${token}` }
            });
          }
        }
      } catch (e) {
        // User might not be logged in yet, that's okay
      }
    }
    
    // Also clean up unauthenticated entities
    const publicEntities = ['public-article'];
    for (const entity of publicEntities) {
      const items = await fetch(`${baseUrl}/api/${entity}`).then(r => r.ok ? r.json() : []).catch(() => []) as any[];
      for (const item of items) {
        // Public articles can be deleted by anyone
        const token = await login('user1', 'password1');
        await fetch(`${baseUrl}/api/${entity}/${item.id}`, { 
          method: 'DELETE',
          headers: { 'Cookie': `matte_session=${token}` }
        });
      }
    }
  });

  async function login(username: string, password: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const cookies = res.headers.get('Set-Cookie');
    if (!cookies) throw new Error('No session cookie');
    
    const match = cookies.match(/matte_session=([^;]+)/);
    if (!match) throw new Error('Invalid session cookie');
    
    return match[1];
  }

  describe('Shared Entity (Public Read, Authenticated Write)', () => {
    test('allows unauthenticated read', async () => {
      // First, create an article as authenticated user
      const token1 = await login('user1', 'password1');
      await fetch(`${baseUrl}/api/public-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'Public Article',
          content: 'Everyone can read this',
        }),
      });

      // Now try to read without authentication
      const res = await fetch(`${baseUrl}/api/public-article`);
      
      expect(res.status).toBe(200);
      const articles = await res.json();
      expect(articles.length).toBe(1);
      expect(articles[0].title).toBe('Public Article');
    });

    test('requires authentication for write', async () => {
      // Try to create without authentication
      const res = await fetch(`${baseUrl}/api/public-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Article',
          content: 'This should fail',
        }),
      });

      expect(res.status).toBe(403);
      const error = await res.json();
      expect(error.error).toBe('Access denied');
    });

    test('allows authenticated users to write', async () => {
      const token1 = await login('user1', 'password1');
      
      const res = await fetch(`${baseUrl}/api/public-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'Authenticated Article',
          content: 'Created by user1',
        }),
      });

      expect(res.status).toBe(201);
      const article = await res.json();
      expect(article.title).toBe('Authenticated Article');
    });
  });

  describe('Private Entity (Owner Read/Write)', () => {
    test('prevents unauthenticated read', async () => {
      const res = await fetch(`${baseUrl}/api/private-note`);
      
      expect(res.status).toBe(403);
      const error = await res.json();
      expect(error.error).toBe('Access denied');
    });

    test('prevents unauthenticated write', async () => {
      const res = await fetch(`${baseUrl}/api/private-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Note',
          content: 'This should fail',
        }),
      });

      expect(res.status).toBe(403);
    });

    test('allows owner to create and read own notes', async () => {
      const token1 = await login('user1', 'password1');
      
      // Create note
      const createRes = await fetch(`${baseUrl}/api/private-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'User1 Note',
          content: 'Private to user1',
        }),
      });

      expect(createRes.status).toBe(201);

      // Read notes
      const listRes = await fetch(`${baseUrl}/api/private-note`, {
        headers: { 'Cookie': `matte_session=${token1}` },
      });

      expect(listRes.status).toBe(200);
      const notes = await listRes.json();
      expect(notes.length).toBe(1);
      expect(notes[0].title).toBe('User1 Note');
    });

    test('prevents other users from reading owner notes', async () => {
      const token1 = await login('user1', 'password1');
      const token2 = await login('user2', 'password2');
      
      // User1 creates note
      await fetch(`${baseUrl}/api/private-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'User1 Note',
          content: 'Private to user1',
        }),
      });

      // User2 tries to read
      const listRes = await fetch(`${baseUrl}/api/private-note`, {
        headers: { 'Cookie': `matte_session=${token2}` },
      });

      expect(listRes.status).toBe(200);
      const notes = await listRes.json();
      expect(notes.length).toBe(0); // User2 sees no notes
    });

    test('allows owner to update own notes', async () => {
      const token1 = await login('user1', 'password1');
      
      // Create note
      const createRes = await fetch(`${baseUrl}/api/private-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'Original Title',
          content: 'Original content',
        }),
      });

      const note = await createRes.json();

      // Update note
      const updateRes = await fetch(`${baseUrl}/api/private-note/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      expect(updateRes.status).toBe(200);
      const updated = await updateRes.json();
      expect(updated.title).toBe('Updated Title');
    });

    test('prevents other users from updating owner notes', async () => {
      const token1 = await login('user1', 'password1');
      const token2 = await login('user2', 'password2');
      
      // User1 creates note
      const createRes = await fetch(`${baseUrl}/api/private-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'User1 Note',
          content: 'Private to user1',
        }),
      });

      const note = await createRes.json();

      // User2 tries to update
      const updateRes = await fetch(`${baseUrl}/api/private-note/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token2}`,
        },
        body: JSON.stringify({
          title: 'Hacked Title',
        }),
      });

      expect(updateRes.status).toBe(403);
    });
  });

  describe('Instance Per User Lifecycle', () => {
    test('allows creating one instance per user', async () => {
      const token1 = await login('user1', 'password1');
      
      const res = await fetch(`${baseUrl}/api/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          bio: 'User1 bio',
          avatar: 'avatar1.png',
        }),
      });

      expect(res.status).toBe(201);
      const profile: any = await res.json();
      expect(profile.bio).toBe('User1 bio');
    });

    test('prevents creating multiple instances per user', async () => {
      const token1 = await login('user1', 'password1');
      
      // Create first instance
      await fetch(`${baseUrl}/api/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          bio: 'First profile',
        }),
      });

      // Try to create second instance
      const res = await fetch(`${baseUrl}/api/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          bio: 'Second profile',
        }),
      });

      expect(res.status).toBe(400);
      const error: any = await res.json();
      expect(error.error).toContain('already has an instance');
    });

    test('allows different users to have their own instances', async () => {
      const token1 = await login('user1', 'password1');
      const token2 = await login('user2', 'password2');
      
      // User1 creates profile
      const res1 = await fetch(`${baseUrl}/api/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          bio: 'User1 bio',
        }),
      });

      expect(res1.status).toBe(201);

      // User2 creates profile
      const res2 = await fetch(`${baseUrl}/api/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token2}`,
        },
        body: JSON.stringify({
          bio: 'User2 bio',
        }),
      });

      expect(res2.status).toBe(201);
    });
  });

  describe('Singleton Lifecycle', () => {
    test('allows creating one instance', async () => {
      const token1 = await login('user1', 'password1');
      
      const res = await fetch(`${baseUrl}/api/app-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          theme: 'dark',
          maintenanceMode: false,
        }),
      });

      expect(res.status).toBe(201);
      const settings: any = await res.json();
      expect(settings.theme).toBe('dark');
    });

    test('prevents creating multiple instances', async () => {
      const token1 = await login('user1', 'password1');
      
      // Create first instance
      await fetch(`${baseUrl}/api/app-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          theme: 'light',
        }),
      });

      // Try to create second instance
      const res = await fetch(`${baseUrl}/api/app-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          theme: 'dark',
        }),
      });

      expect(res.status).toBe(400);
      const error: any = await res.json();
      expect(error.error).toContain('already has an instance');
    });

    test('allows any authenticated user to read singleton', async () => {
      const token1 = await login('user1', 'password1');
      const token2 = await login('user2', 'password2');
      
      // User1 creates settings
      await fetch(`${baseUrl}/api/app-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          theme: 'dark',
          maintenanceMode: true,
        }),
      });

      // User2 reads settings
      const res = await fetch(`${baseUrl}/api/app-settings`, {
        headers: { 'Cookie': `matte_session=${token2}` },
      });

      expect(res.status).toBe(200);
      const settings: any = await res.json();
      expect(settings.length).toBe(1);
      expect(settings[0].theme).toBe('dark');
    });

    test('allows any authenticated user to update singleton', async () => {
      const token1 = await login('user1', 'password1');
      const token2 = await login('user2', 'password2');
      
      // User1 creates settings
      const createRes = await fetch(`${baseUrl}/api/app-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          theme: 'light',
        }),
      });

      const settings: any = await createRes.json();

      // User2 updates settings
      const updateRes = await fetch(`${baseUrl}/api/app-settings/${settings.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token2}`,
        },
        body: JSON.stringify({
          theme: 'dark',
        }),
      });

      expect(updateRes.status).toBe(200);
      const updated: any = await updateRes.json();
      expect(updated.theme).toBe('dark');
    });
  });

  describe('Mixed Access Scenarios', () => {
    test('handles multiple entity types in same app', async () => {
      const token1 = await login('user1', 'password1');
      
      // Create public article (shared entity)
      const articleRes = await fetch(`${baseUrl}/api/public-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'Public Article',
          content: 'Content',
        }),
      });
      expect(articleRes.status).toBe(201);

      // Create private note (private entity)
      const noteRes = await fetch(`${baseUrl}/api/private-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          title: 'Private Note',
          content: 'Secret',
        }),
      });
      expect(noteRes.status).toBe(201);

      // Create user profile (instancePerUser)
      const profileRes = await fetch(`${baseUrl}/api/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          bio: 'My bio',
        }),
      });
      expect(profileRes.status).toBe(201);

      // Create app settings (singleton)
      const settingsRes = await fetch(`${baseUrl}/api/app-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `matte_session=${token1}`,
        },
        body: JSON.stringify({
          theme: 'light',
        }),
      });
      expect(settingsRes.status).toBe(201);

      // Verify all created successfully
      expect(articleRes.ok).toBe(true);
      expect(noteRes.ok).toBe(true);
      expect(profileRes.ok).toBe(true);
      expect(settingsRes.ok).toBe(true);
    });
  });
});
