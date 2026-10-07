import { Role } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import prisma from '../utils/database';
import { AppError, AuthenticationError, ConflictError, NotFoundError } from '../middleware/errorHandler';
import type { RegisterInput, LoginInput, ChangePasswordInput, UpdateProfileInput } from '../validators/auth';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  type: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private generateTokens(user: { id: string; email: string; name: string; role: string }): AuthTokens {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'access',
    };

    const refreshPayload: TokenPayload = { ...payload, type: 'refresh' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry as any,
    });

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  private generateAdminTokens(admin: { id: string; email: string; name: string; role: string }): AuthTokens {
    const payload: TokenPayload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      type: 'admin_access',
    };

    const refreshPayload: TokenPayload = { ...payload, type: 'admin_refresh' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry as any,
    });

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictError('User with this email or phone already exists');
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        name: data.name,
        role: Role.CUSTOMER,
      },
    });

    const tokens = this.generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is disabled. Please contact support.');
    }

    const isValid = await argon2.verify(user.passwordHash, data.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async adminLogin(data: { email: string; password: string }) {
    const admin = await prisma.admin.findUnique({
      where: { email: data.email },
    });

    if (!admin || !admin.isActive) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await argon2.verify(admin.passwordHash, data.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const tokens = this.generateAdminTokens(admin);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is disabled');
      }

      const tokens = this.generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  async adminRefreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      if (decoded.type !== 'admin_refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
      });

      if (!admin || admin.refreshToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      if (!admin.isActive) {
        throw new AuthenticationError('Admin account is disabled');
      }

      const tokens = this.generateAdminTokens(admin);

      await prisma.admin.update({
        where: { id: admin.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async adminLogout(adminId: string) {
    await prisma.admin.update({
      where: { id: adminId },
      data: { refreshToken: null },
    });
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new AuthenticationError('User not found');
    }

    const isValid = await argon2.verify(user.passwordHash, data.currentPassword);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(data.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        avatar: data.avatar,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    return user;
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // TODO: Send email with reset link
    // emailService.sendPasswordReset(user.email, resetToken)
    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError(400, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        refreshToken: null, // Invalidate all sessions
      },
    });
  }
}

export const authService = new AuthService();
