# Vercel Postgres接続文字列の設定方法

## 現在の状況

`.env`ファイルに`DATABASE_URL`が設定されていないため、データベースに接続できません。

## 解決方法：Vercel Postgresの接続文字列を取得

### ステップ1: Vercelダッシュボードで接続文字列を取得

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. **Storage**タブを開く
4. **Postgres**データベースを選択（または作成）
5. **Settings**タブを開く
6. **Connection String**セクションで以下の接続文字列をコピー：
   - **Non-pooling**（マイグレーション用）: `POSTGRES_URL_NON_POOLING`
   - **Pooled**（通常のクエリ用）: `POSTGRES_URL`

### ステップ2: .envファイルに設定

`apps/api/.env`ファイルに以下を追加：

```env
# マイグレーション用（重要：マイグレーションには非プール接続が必要）
DATABASE_URL="<POSTGRES_URL_NON_POOLINGの値>"

# 通常のクエリ用（オプション、アプリケーションがPOSTGRES_URLを参照する場合）
POSTGRES_URL="<POSTGRES_URLの値>"
```

**重要**: マイグレーション（`prisma migrate`）には`POSTGRES_URL_NON_POOLING`を使用する必要があります。

### ステップ3: 接続をテスト

```bash
cd apps/api

# Prisma Studioで接続を確認（推奨）
npx prisma studio

# または、マイグレーションを実行
npx prisma migrate deploy
```

## 開発環境と本番環境の違い

### 開発環境（.envファイル）

```env
# 開発環境用の接続文字列
DATABASE_URL="<POSTGRES_URL_NON_POOLING>"
```

### 本番環境（Vercel）

Vercel Postgresをプロジェクトにリンクすると、以下の環境変数が自動的に設定されます：

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

**注意**: Vercelでは`DATABASE_URL`を手動で設定する必要はありません。`POSTGRES_URL_NON_POOLING`が自動的に設定されます。

## トラブルシューティング

### エラー: `Can't reach database server`

**原因**: 接続文字列が正しく設定されていない

**解決策**:
1. Vercelダッシュボードで`POSTGRES_URL_NON_POOLING`を確認
2. `.env`ファイルの`DATABASE_URL`を更新
3. 接続文字列に引用符が正しく含まれているか確認

### マイグレーションが失敗する

**原因**: プール接続を使用している可能性

**解決策**: `POSTGRES_URL_NON_POOLING`（非プール接続）を使用してください。

## 次のステップ

1. Vercelダッシュボードで`POSTGRES_URL_NON_POOLING`を取得
2. `.env`ファイルの`DATABASE_URL`を更新
3. 接続をテスト: `npx prisma studio`
4. マイグレーションを実行: `npx prisma migrate deploy`

