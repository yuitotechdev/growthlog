# データベース接続の設定方法

## 現在の問題

`.env`ファイルに`db.prisma.io`（Prisma Data Platform）の接続文字列が設定されていますが、Prisma Postgresを使用していないとのことです。

## 使用しているデータベースを確認

以下のいずれかを使用している可能性があります：

1. **Vercel Postgres**（推奨・本番環境）
2. **ローカルPostgreSQL**
3. **その他のPostgreSQLサービス**（Supabase、Neon、AWS RDSなど）

## 解決方法

### オプション1: Vercel Postgresを使用している場合

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. **Storage**タブを開く
4. **Postgres**データベースを選択
5. **Settings** → **Connection String**を開く
6. 以下の接続文字列をコピー：
   - `POSTGRES_URL`（通常のクエリ用）
   - `POSTGRES_URL_NON_POOLING`（マイグレーション用）

`.env`ファイルを以下のように更新：

```env
# マイグレーション用（重要：マイグレーションには非プール接続が必要）
DATABASE_URL="<POSTGRES_URL_NON_POOLINGの値>"

# 通常のクエリ用（オプション）
POSTGRES_URL="<POSTGRES_URLの値>"
```

### オプション2: ローカルPostgreSQLを使用する場合

ローカルにPostgreSQLをインストールしている場合：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/growthlog?sslmode=disable"
```

**PostgreSQLのインストール方法（Windows）**:
1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からダウンロード
2. インストール時にパスワードを設定
3. デフォルトポートは`5432`

### オプション3: その他のPostgreSQLサービスを使用する場合

使用しているサービスの接続文字列を`.env`ファイルに設定：

```env
DATABASE_URL="postgresql://ユーザー名:パスワード@ホスト:ポート/データベース名?sslmode=require"
```

## 接続テスト

接続文字列を設定した後、以下のコマンドでテスト：

```bash
# Prisma Studioで接続を確認（推奨）
npx prisma studio

# または、マイグレーションを実行
npx prisma migrate deploy
```

## 現在の.envファイルの整理

`.env`ファイルから不要な接続文字列を削除：

```env
# 削除する行（Prisma Data Platform関連）
POSTGRES_URL="postgres://...@db.prisma.io:5432/..."
PRISMA_DATABASE_URL="prisma+postgres://..."
```

## 次のステップ

1. 使用しているデータベースサービスを確認
2. 正しい接続文字列を取得
3. `.env`ファイルの`DATABASE_URL`を更新
4. 接続をテスト
5. マイグレーションを実行

