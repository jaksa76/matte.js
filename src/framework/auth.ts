/**
 * Authentication Manager
 * Handles user registration, login, session management, and logout
 */

export interface AuthSession {
  username: string;
  token: string;
  createdAt: Date;
}

export class AuthManager {
  // Map of username -> hashed password
  private credentials = new Map<string, string>();
  
  // Map of session token -> username
  private sessions = new Map<string, string>();

  /**
   * Register a new user with username and password
   * Password is hashed before storage
   */
  registerUser(username: string, password: string): void {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (this.credentials.has(username)) {
      throw new Error('Username already exists');
    }

    const hashedPassword = this.hashPassword(password);
    this.credentials.set(username, hashedPassword);
  }

  /**
   * Authenticate user and create a session
   * Returns session token if successful, null if invalid credentials
   */
  login(username: string, password: string): string | null {
    if (!username || !password) {
      return null;
    }

    const storedHash = this.credentials.get(username);
    if (!storedHash) {
      return null;
    }

    // Verify password using Bun's password verification
    const isValid = Bun.password.verifySync(password, storedHash);
    if (!isValid) {
      return null;
    }

    // Create session token
    const token = this.generateToken();
    this.sessions.set(token, username);
    
    return token;
  }

  /**
   * Validate a session token and return the associated username
   * Returns username if valid, null if invalid or expired
   */
  validateSession(token: string): string | null {
    if (!token) {
      return null;
    }

    return this.sessions.get(token) || null;
  }

  /**
   * Logout user and destroy session
   */
  logout(token: string): void {
    if (token) {
      this.sessions.delete(token);
    }
  }

  /**
   * Hash password using a simple algorithm
   * In production, use bcrypt or similar
   */
  private hashPassword(password: string): string {
    // Simple hash for now - in production, use bcrypt
    const hash = Bun.password.hashSync(password);
    return hash;
  }

  /**
   * Generate a random session token
   */
  private generateToken(): string {
    return crypto.randomUUID();
  }

  /**
   * Get all registered usernames (for testing)
   */
  getRegisteredUsers(): string[] {
    return Array.from(this.credentials.keys());
  }

  /**
   * Get active session count (for testing)
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
