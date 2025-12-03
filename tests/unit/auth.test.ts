import { describe, it, expect, beforeEach } from 'bun:test';
import { AuthManager } from '../../src/framework/auth';

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager();
  });

  describe('registerUser', () => {
    it('should register a new user', () => {
      authManager.registerUser('testuser', 'password123');
      const users = authManager.getRegisteredUsers();
      expect(users).toContain('testuser');
    });

    it('should throw error if username already exists', () => {
      authManager.registerUser('testuser', 'password123');
      expect(() => {
        authManager.registerUser('testuser', 'newpassword');
      }).toThrow('Username already exists');
    });

    it('should throw error if username is empty', () => {
      expect(() => {
        authManager.registerUser('', 'password123');
      }).toThrow('Username and password are required');
    });

    it('should throw error if password is empty', () => {
      expect(() => {
        authManager.registerUser('testuser', '');
      }).toThrow('Username and password are required');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      authManager.registerUser('testuser', 'password123');
    });

    it('should return token on successful login', () => {
      const token = authManager.login('testuser', 'password123');
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should return null for invalid username', () => {
      const token = authManager.login('nonexistent', 'password123');
      expect(token).toBeNull();
    });

    it('should return null for invalid password', () => {
      const token = authManager.login('testuser', 'wrongpassword');
      expect(token).toBeNull();
    });

    it('should return null for empty username', () => {
      const token = authManager.login('', 'password123');
      expect(token).toBeNull();
    });

    it('should return null for empty password', () => {
      const token = authManager.login('testuser', '');
      expect(token).toBeNull();
    });

    it('should create a session on successful login', () => {
      const initialSessions = authManager.getActiveSessionCount();
      authManager.login('testuser', 'password123');
      const finalSessions = authManager.getActiveSessionCount();
      expect(finalSessions).toBe(initialSessions + 1);
    });

    it('should create unique tokens for multiple logins', () => {
      const token1 = authManager.login('testuser', 'password123');
      const token2 = authManager.login('testuser', 'password123');
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateSession', () => {
    let validToken: string;

    beforeEach(() => {
      authManager.registerUser('testuser', 'password123');
      validToken = authManager.login('testuser', 'password123')!;
    });

    it('should return username for valid token', () => {
      const username = authManager.validateSession(validToken);
      expect(username).toBe('testuser');
    });

    it('should return null for invalid token', () => {
      const username = authManager.validateSession('invalid-token');
      expect(username).toBeNull();
    });

    it('should return null for empty token', () => {
      const username = authManager.validateSession('');
      expect(username).toBeNull();
    });
  });

  describe('logout', () => {
    let validToken: string;

    beforeEach(() => {
      authManager.registerUser('testuser', 'password123');
      validToken = authManager.login('testuser', 'password123')!;
    });

    it('should destroy session on logout', () => {
      authManager.logout(validToken);
      const username = authManager.validateSession(validToken);
      expect(username).toBeNull();
    });

    it('should reduce active session count', () => {
      const initialSessions = authManager.getActiveSessionCount();
      authManager.logout(validToken);
      const finalSessions = authManager.getActiveSessionCount();
      expect(finalSessions).toBe(initialSessions - 1);
    });

    it('should handle logout of non-existent token gracefully', () => {
      expect(() => {
        authManager.logout('non-existent-token');
      }).not.toThrow();
    });

    it('should handle logout of empty token gracefully', () => {
      expect(() => {
        authManager.logout('');
      }).not.toThrow();
    });
  });

  describe('multiple users', () => {
    it('should support multiple registered users', () => {
      authManager.registerUser('user1', 'pass1');
      authManager.registerUser('user2', 'pass2');
      authManager.registerUser('user3', 'pass3');

      const users = authManager.getRegisteredUsers();
      expect(users).toHaveLength(3);
      expect(users).toContain('user1');
      expect(users).toContain('user2');
      expect(users).toContain('user3');
    });

    it('should support multiple concurrent sessions', () => {
      authManager.registerUser('user1', 'pass1');
      authManager.registerUser('user2', 'pass2');

      const token1 = authManager.login('user1', 'pass1');
      const token2 = authManager.login('user2', 'pass2');

      expect(authManager.validateSession(token1!)).toBe('user1');
      expect(authManager.validateSession(token2!)).toBe('user2');
    });

    it('should not affect other sessions when logging out', () => {
      authManager.registerUser('user1', 'pass1');
      authManager.registerUser('user2', 'pass2');

      const token1 = authManager.login('user1', 'pass1');
      const token2 = authManager.login('user2', 'pass2');

      authManager.logout(token1!);

      expect(authManager.validateSession(token1!)).toBeNull();
      expect(authManager.validateSession(token2!)).toBe('user2');
    });
  });
});
