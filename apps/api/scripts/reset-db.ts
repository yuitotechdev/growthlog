/**
 * データベースリセットスクリプト
 * すべてのテーブルを削除して、マイグレーションを再実行します
 * 
 * 使用方法:
 *   pnpm ts-node scripts/reset-db.ts
 * 
 * 注意: 本番環境では使用しないでください！
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 データベースをリセットしています...');

  try {
    // すべてのテーブルを削除（外部キー制約を無視）
    console.log('📋 テーブルを削除しています...');
    
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log('✅ テーブルを削除しました');

    // マイグレーションを再実行
    console.log('📦 マイグレーションを実行しています...');
    const prismaPath = path.join(__dirname, '..', 'prisma');
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });

    console.log('✅ データベースのリセットが完了しました！');
    console.log('💡 新しいアカウントを作成してください。');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
resetDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});


