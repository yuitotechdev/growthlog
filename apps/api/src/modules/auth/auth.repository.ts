import { prisma } from '../../common/db/prisma';

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUniqueId(uniqueId: string) {
    return prisma.user.findUnique({
      where: { uniqueId },
    });
  }

  async findByVerificationToken(token: string) {
    return prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { 
    email: string; 
    password: string; 
    name?: string; 
    uniqueId: string;
    emailVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationTokenExpires?: Date;
  }) {
    return prisma.user.create({
      data,
    });
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async verifyEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });
  }

  async updateVerificationToken(userId: string, token: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: expiresAt,
      },
    });
  }
}


