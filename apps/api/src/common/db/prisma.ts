import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Vercel Postgres対応: DATABASE_URLまたはPOSTGRES_URLを使用
// Prismaスキーマではenv("DATABASE_URL")を使用しているが、
// Vercel Postgresの場合はPOSTGRES_URLも使用可能にするため、環境変数を設定
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.error('❌ DATABASE_URL or POSTGRES_URL is required in production');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;






