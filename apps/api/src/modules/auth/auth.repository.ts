import { prisma } from '../../common/db/prisma';

export class AuthRepository {
  async findByEmail(email: string) {
    // メールアドレスを小文字に正規化して検索
    const normalizedEmail = email.toLowerCase().trim();
    // PostgreSQLで大文字小文字を区別しない検索
    // Prisma 5.xでは、findFirstとmode: 'insensitive'が使える
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
      });
      return user;
    } catch (error) {
      // mode: 'insensitive'が使えない場合は、生SQLクエリを使用
      const users = await prisma.$queryRaw<Array<{ id: string; email: string; password: string; name: string | null; uniqueId: string; isAdmin: boolean; isSuspended: boolean; emailVerified: boolean; createdAt: Date; updatedAt: Date; lastLoginAt: Date | null; avatarEmoji: string | null; emailVerificationToken: string | null; emailVerificationTokenExpires: Date | null }>>`
        SELECT * FROM "User" WHERE LOWER(TRIM(email)) = ${normalizedEmail} LIMIT 1
      `;
      return users.length > 0 ? users[0] : null;
    }
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


