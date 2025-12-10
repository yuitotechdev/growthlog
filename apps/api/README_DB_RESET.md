# データベースリセット方法

データベースをリセットする方法は以下の通りです。

## 方法1: Prismaコマンドを使用（推奨）

```bash
cd apps/api
pnpm db:reset
```

このコマンドは以下を実行します：
1. すべてのテーブルを削除
2. マイグレーションを再実行

## 方法2: SQLスクリプトを使用

```bash
cd apps/api
# PostgreSQLに接続してSQLスクリプトを実行
psql $DATABASE_URL -f scripts/reset-db-simple.sql
# その後、マイグレーションを実行
pnpm prisma migrate deploy
```

## 方法3: Prisma Studioを使用

```bash
cd apps/api
pnpm prisma:studio
```

Prisma Studioが開いたら、各テーブルのデータを手動で削除できます。

## 注意事項

⚠️ **本番環境では使用しないでください！**

データベースをリセットすると、すべてのデータが削除されます：
- ユーザーアカウント
- 活動ログ
- グループ
- その他すべてのデータ

## リセット後の手順

1. データベースをリセット
2. 新しいアカウントを作成
3. 必要に応じてテストデータを追加



