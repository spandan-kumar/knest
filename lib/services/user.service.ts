import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import type { User } from '@prisma/client';
import type { CreateUserRequest, LoginRequest } from '@/lib/types/user.types';

const ALLOWED_DOMAIN = 'appointy.com';

export class UserService {
  private static validateEmailDomain(email: string): boolean {
    return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
  }

  static async createUser(request: CreateUserRequest): Promise<User> {
    const { email, name, password } = request;

    // Validate email domain
    if (!this.validateEmailDomain(email)) {
      throw new Error(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

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
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        hashedPassword,
      },
    });

    return newUser;
  }

  static async authenticateUser(request: LoginRequest): Promise<User | null> {
    const { email, password } = request;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return updatedUser;
  }

  static async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  static async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
