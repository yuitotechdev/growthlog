-- データベースリセット用SQLスクリプト
-- すべてのテーブルを削除します（外部キー制約を無視）

-- 注意: このスクリプトはすべてのデータを削除します！
-- 実行前に必ずバックアップを取ってください。

-- すべてのテーブルを削除
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

-- 完了メッセージ
SELECT 'Database reset complete. Run: pnpm prisma migrate deploy' AS message;


