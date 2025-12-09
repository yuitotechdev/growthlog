# データベース管理ガイド

## データベース構成

GrowthLogは**Vercel Postgres**（PostgreSQL）を使用しています。

### 本番環境（Vercel Postgres）

- **データベース**: Vercel Postgres（PostgreSQL）
- **プラン**: Hobby（無料プラン: 256MB）
- **設定**: Vercelダッシュボードで自動設定
- **接続文字列**: Vercel Postgresから自動生成される環境変数を使用

### 開発環境

開発環境でもVercel Postgresを使用することを推奨します。ローカル開発の場合は、以下のいずれかを使用できます：

1. **Vercel Postgres**（推奨）- 本番環境と同じデータベースを使用
2. **ローカルPostgreSQL** - ローカルにPostgreSQLをインストールして使用

## 環境変数

### 本番環境（Vercel）

Vercel Postgresを作成すると、以下の環境変数が自動的に設定されます：

- `POSTGRES_URL` - PostgreSQL接続文字列（プール接続）
- `POSTGRES_PRISMA_URL` - Prisma用接続文字列（プール接続、pgbouncer対応）
- `POSTGRES_URL_NON_POOLING` - マイグレーション用接続文字列（非プール接続）

**重要**: Prismaスキーマは`env("DATABASE_URL")`を参照しているため、`DATABASE_URL`を`POSTGRES_URL`と同じ値に設定してください。

### 開発環境

`.env`ファイルに以下を設定：

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

または、Vercel Postgresを使用する場合：

```env
DATABASE_URL=<POSTGRES_URLの値>
POSTGRES_URL=<Vercel Postgresから取得>
POSTGRES_PRISMA_URL=<Vercel Postgresから取得>
POSTGRES_URL_NON_POOLING=<Vercel Postgresから取得>
```

## データベースの確認方法

### Prisma Studio（推奨）

Prisma Studioは、データベースを視覚的に確認・編集できるツールです。

```bash
cd apps/api
pnpm prisma:studio
```

または

```bash
cd apps/api
npx prisma studio
```

ブラウザで `http://localhost:5555` が自動的に開きます。

**機能**:
- すべてのテーブルを視覚的に表示
- データの閲覧・編集・削除
- 検索・フィルタリング
- データの追加

### PostgreSQLコマンドラインツール

```bash
# psqlを使用して接続
psql $DATABASE_URL
```

SQLコマンドで直接操作できます：

```sql
\dt                    -- テーブル一覧
\d users               -- usersテーブルの構造
SELECT * FROM users;   -- データの確認
```

## マイグレーション

### 開発環境でのマイグレーション

```bash
cd apps/api
pnpm prisma:migrate
```

または

```bash
cd apps/api
npx prisma migrate dev
```

### 本番環境でのマイグレーション

```bash
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma:migrate:deploy
```

または

```bash
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLING> npx prisma migrate deploy
```

**重要**: 本番環境のマイグレーションは`POSTGRES_URL_NON_POOLING`を使用してください。

## データベーススキーマ

スキーマ定義は `apps/api/prisma/schema.prisma` にあります。

### 主要なモデル

- **User** - ユーザー情報
- **Activity** - 活動ログ
- **Insight** - AIインサイト
- **Category** - カテゴリ
- **Group** - グループ
- **GroupMember** - グループメンバー
- **GroupSharedActivity** - 共有活動
- **GroupMessage** - グループチャット
- **SystemLog** - システムログ
- **SystemSetting** - システム設定

詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) の「データベース設計」セクションを参照してください。

## バックアップ

### Vercel Postgresのバックアップ

Vercel Postgresは自動的にバックアップを取得します。手動でバックアップを取得する場合：

```bash
# pg_dumpを使用してバックアップを取得
pg_dump $POSTGRES_URL_NON_POOLING > backup.sql
```

### リストア

```bash
# バックアップからリストア
psql $POSTGRES_URL_NON_POOLING < backup.sql
```

## トラブルシューティング

### 接続エラー

**エラー**: `P1001: Can't reach database server`

**解決策**:
1. `DATABASE_URL`が正しく設定されているか確認
2. Vercel Postgresのステータスを確認
3. ファイアウォール設定を確認（ローカルPostgreSQLの場合）

### マイグレーションエラー

**エラー**: `Migration failed`

**解決策**:
1. `POSTGRES_URL_NON_POOLING`を使用しているか確認
2. マイグレーションファイルにエラーがないか確認
3. データベースの状態を確認

### Prisma Client生成エラー

**エラー**: `Prisma Client has not been generated yet`

**解決策**:
```bash
cd apps/api
pnpm prisma:generate
```

または

```bash
cd apps/api
npx prisma generate
```

## パフォーマンス最適化

### インデックスの確認

```sql
-- インデックス一覧を確認
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### クエリの最適化

Prisma StudioやPostgreSQLの`EXPLAIN`を使用してクエリを分析：

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'example@example.com';
```

## 参考リンク

- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計ドキュメント
