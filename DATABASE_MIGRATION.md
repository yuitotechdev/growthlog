# データベース移行ガイド: SQLite → PostgreSQL

## 概要

このプロジェクトはSQLiteからPostgreSQL（Vercel Postgres）に移行しました。

## 変更内容

1. **Prismaスキーマ**: `provider = "sqlite"` → `provider = "postgresql"`
2. **avatarUrlフィールド**: `avatarUrl` → `avatarEmoji`（絵文字選択に変更）

## 本番環境でのセットアップ（Vercel Postgres）

### 1. Vercel Postgresの作成

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Storage」タブを開く
4. 「Create Database」→「Postgres」を選択
5. Hobbyプラン（無料）を選択
6. データベースを作成

### 2. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

この接続文字列は、Vercel Postgresのダッシュボードで確認できます。

### 3. マイグレーションの実行

Vercelにデプロイすると、自動的にマイグレーションが実行されます。

または、ローカルで実行する場合：

```bash
cd apps/api
pnpm prisma migrate deploy
```

## 開発環境での注意事項

開発環境でもPostgreSQLを使う場合は、`.env`ファイルにPostgreSQLの接続文字列を設定してください：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/growthlog_dev
```

SQLiteを使い続ける場合は、スキーマファイルを一時的に変更する必要があります（非推奨）。

## マイグレーションファイル

- `20251209044300_change_to_postgres_and_emoji/migration.sql`: PostgreSQL用のマイグレーション

## データ移行

既存のSQLiteデータベースからPostgreSQLにデータを移行する場合は、手動でデータをエクスポート/インポートする必要があります。

```bash
# SQLiteからデータをエクスポート
sqlite3 apps/api/prisma/prisma/dev.db .dump > backup.sql

# PostgreSQLにインポート（適宜修正が必要）
psql $DATABASE_URL < backup.sql
```

## トラブルシューティング

### エラー: "the URL must start with the protocol `postgresql://`"

`DATABASE_URL`が正しく設定されていない可能性があります。Vercel Postgresの接続文字列を確認してください。

### エラー: "relation does not exist"

マイグレーションが実行されていない可能性があります。`pnpm prisma migrate deploy`を実行してください。

