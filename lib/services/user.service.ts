import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';
import type { User, CreateUserRequest, LoginRequest } from '@/lib/types/user.types';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const ALLOWED_DOMAIN = 'appointy.com';

export class UserService {
  private static async ensureDataDir(): Promise<void> {
    const dataDir = path.dirname(USERS_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private static async loadUsers(): Promise<User[]> {
    try {
      await this.ensureDataDir();
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      const users = JSON.parse(data);
      // Convert date strings back to Date objects
      return users.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      }));
    } catch (error) {
      // File doesn't exist or is empty, return empty array
      return [];
    }
  }

  private static async saveUsers(users: User[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static validateEmailDomain(email: string): boolean {
    return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
  }

  static async createUser(request: CreateUserRequest): Promise<User> {
    const { email, name, password } = request;
    
    // Validate email domain
    if (!this.validateEmailDomain(email)) {
      throw new Error(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
    }

    // Load existing users
    const users = await this.loadUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser: User = {
      id: this.generateId(),
      email: email.toLowerCase(),
      name,
      hashedPassword,
      createdAt: new Date(),
    };

    // Save user
    users.push(newUser);
    await this.saveUsers(users);

    return newUser;
  }

  static async authenticateUser(request: LoginRequest): Promise<User | null> {
    const { email, password } = request;
    
    // Load users
    const users = await this.loadUsers();
    
    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return null;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    user.lastLogin = new Date();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    await this.saveUsers(users);

    return user;
  }

  static async getUserById(id: string): Promise<User | null> {
    const users = await this.loadUsers();
    return users.find(u => u.id === id) || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async getAllUsers(): Promise<User[]> {
    return this.loadUsers();
  }
}