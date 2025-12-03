import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Matte } from '../../src/framework/framework';
import { ownedEntity, string } from '../../src/framework/entities';

describe('Authentication Integration', () => {
  let app: Matte;
  const port = 3456; // Use different port for tests
  const baseUrl = `http://localhost:${port}`;

  beforeAll(async () => {
    // Create a test app
    app = new Matte({ port, dbPath: ':memory:' });

    // Register test users
    app.auth.registerUser('testuser', 'password123');
    app.auth.registerUser('admin', 'adminpass');

    // Register a simple entity
    const TestEntity = ownedEntity('TestItem', [
      string('title').required(),
    ]);

    app.register(TestEntity);

    // Start server
    await app.start();

    // Wait a bit for server to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(() => {
    app.stop();
    app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { token: string; username: string };
      expect(data.token).toBeTruthy();
      expect(data.username).toBe('testuser');

      // Check Set-Cookie header
      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('matte_session=');
      expect(setCookie).toContain('HttpOnly');
    });

    it('should reject invalid username', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json() as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json() as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject malformed request', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return authenticated status when logged in', async () => {
      // First login
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const setCookie = loginResponse.headers.get('Set-Cookie');
      const cookieMatch = setCookie?.match(/matte_session=([^;]+)/);
      const sessionCookie = cookieMatch ? cookieMatch[0] : '';

      // Check session
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(sessionResponse.status).toBe(200);
      const data = await sessionResponse.json() as { authenticated: boolean; username?: string };
      expect(data.authenticated).toBe(true);
      expect(data.username).toBe('testuser');
    });

    it('should return unauthenticated status when not logged in', async () => {
      const response = await fetch(`${baseUrl}/api/auth/session`);

      expect(response.status).toBe(200);
      const data = await response.json() as { authenticated: boolean; username?: string };
      expect(data.authenticated).toBe(false);
      expect(data.username).toBeUndefined();
    });

    it('should return unauthenticated status with invalid token', async () => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          Cookie: 'matte_session=invalid-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { authenticated: boolean };
      expect(data.authenticated).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const setCookie = loginResponse.headers.get('Set-Cookie');
      const cookieMatch = setCookie?.match(/matte_session=([^;]+)/);
      const sessionCookie = cookieMatch ? cookieMatch[0] : '';

      // Logout
      const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(logoutResponse.status).toBe(200);
      const data = await logoutResponse.json() as { success: boolean };
      expect(data.success).toBe(true);

      // Check cookie is cleared
      const logoutSetCookie = logoutResponse.headers.get('Set-Cookie');
      expect(logoutSetCookie).toContain('matte_session=;');
      expect(logoutSetCookie).toContain('Max-Age=0');

      // Verify session is invalid
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          Cookie: sessionCookie,
        },
      });

      const sessionData = await sessionResponse.json() as { authenticated: boolean };
      expect(sessionData.authenticated).toBe(false);
    });

    it('should handle logout without session', async () => {
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { success: boolean };
      expect(data.success).toBe(true);
    });
  });

  describe('Authenticated API requests', () => {
    it('should attach username to requests when authenticated', async () => {
      // Login
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const setCookie = loginResponse.headers.get('Set-Cookie');
      const cookieMatch = setCookie?.match(/matte_session=([^;]+)/);
      const sessionCookie = cookieMatch ? cookieMatch[0] : '';

      // Create an item
      const createResponse = await fetch(`${baseUrl}/api/test-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          title: 'Test Item',
        }),
      });

      expect(createResponse.status).toBe(201);
      const item = await createResponse.json() as { owner_id: string };
      
      // The owner_id should be set to the authenticated username
      expect(item.owner_id).toBe('testuser');
    });

    it('should use default owner when not authenticated', async () => {
      const createResponse = await fetch(`${baseUrl}/api/test-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Anonymous Item',
        }),
      });

      expect(createResponse.status).toBe(201);
      const item = await createResponse.json() as { owner_id: string };
      
      // Should use default owner
      expect(item.owner_id).toBe('default-user');
    });
  });
});
