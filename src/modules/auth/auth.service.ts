import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../prisma/db.ts';
import { config } from '../../config/env.ts';
import { AppError } from '../../middlewares/errorHandler.ts';
import type { RegisterInput, LoginInput } from './auth.validation.ts';

export class AuthService {
  async register(data: RegisterInput) {
    // 1. Check if user already exists
    const existing = await db.orm.public.User
      .where((u) => u.email.eq(data.email))
      .first();

    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Create user in database
    const newUser = await db.orm.public.User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'STUDENT',
    });

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role as 'STUDENT' | 'MENTOR',
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    // 1. Find user by email
    const user = await db.orm.public.User
      .where((u) => u.email.eq(data.email))
      .first();

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'STUDENT' | 'MENTOR',
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getMe(userId: number) {
    const user = await db.orm.public.User
      .where((u) => u.id.eq(userId))
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

export const authService = new AuthService();
