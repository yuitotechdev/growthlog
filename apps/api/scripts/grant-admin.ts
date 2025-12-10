/**
 * ユーザーに管理者権限を付与するスクリプト
 * 
 * 使用方法:
 *   pnpm ts-node scripts/grant-admin.ts <uniqueId>
 * 
 * 例:
 *   pnpm ts-node scripts/grant-admin.ts yuito
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantAdmin(uniqueId: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { uniqueId },
      select: {
        id: true,
        email: true,
        name: true,
        uniqueId: true,
        isAdmin: true,
      },
    });

    if (!user) {
      console.error(`❌ ユーザー "${uniqueId}" が見つかりませんでした。`);
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`ℹ️  ユーザー "${uniqueId}" は既に管理者権限を持っています。`);
      return;
    }

    // 管理者権限を付与
    await prisma.user.update({
      where: { uniqueId },
      data: { isAdmin: true },
    });

    console.log(`✅ ユーザー "${uniqueId}" に管理者権限を付与しました！`);
    console.log(`📧 メールアドレス: ${user.email}`);
    console.log(`👤 名前: ${user.name || '未設定'}`);
    console.log(`🆔 ユーザーID: ${user.uniqueId}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数からuniqueIdを取得
const uniqueId = process.argv[2];

if (!uniqueId) {
  console.error('❌ 使用方法: pnpm ts-node scripts/grant-admin.ts <uniqueId>');
  console.error('例: pnpm ts-node scripts/grant-admin.ts yuito');
  process.exit(1);
}

// 実行
grantAdmin(uniqueId).catch((error) => {
  console.error(error);
  process.exit(1);
});

