# Vercel デプロイガイド

このドキュメントは、GrowthLogをVercel + Vercel Postgresにデプロイするための手順書です。

## 📋 前提条件

- GitHubアカウント
- Vercelアカウント（無料）
- Vercel Postgresデータベース（無料プラン: 256MB）

## 🚀 デプロイ手順

### 1. GitHubリポジトリの準備

```bash
# リポジトリをGitHubにプッシュ
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercel Postgresの作成

1. [Vercel](https://vercel.com)にログイン
2. ダッシュボードで「Storage」タブを開く
3. 「Create Database」→「Postgres」を選択
4. データベース名: `growthlog`（任意）
5. プラン: **Hobby**（無料）を選択
6. リージョン: 最寄りのリージョンを選択
7. 「Create」をクリック

### 3. 環境変数の確認

Vercel Postgresを作成すると、以下の環境変数が自動的に設定されます：
- `POSTGRES_URL` - PostgreSQL接続文字列
- `POSTGRES_PRISMA_URL` - Prisma用接続文字列
- `POSTGRES_URL_NON_POOLING` - マイグレーション用接続文字列

**重要**: 
- Prismaスキーマは`env("DATABASE_URL")`を参照しているため、`DATABASE_URL`を必ず設定してください
- `DATABASE_URL`は`POSTGRES_URL`と同じ値を使用してください
- Vercel Postgresから自動設定される環境変数は、プロジェクトにリンクすると自動的に利用可能になります

### 4. APIサーバーのデプロイ

#### 4.1 Vercelでプロジェクトを作成

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

#### 4.2 環境変数の設定

Vercelプロジェクト設定で以下の環境変数を追加：

**必須環境変数**:
```
# Vercel Postgresから自動設定される環境変数（データベースをリンクすると自動設定）
POSTGRES_URL=<Vercel Postgresから自動設定>
POSTGRES_PRISMA_URL=<Vercel Postgresから自動設定>
POSTGRES_URL_NON_POOLING=<Vercel Postgresから自動設定>

# Prismaスキーマがenv("DATABASE_URL")を参照しているため、必ず設定が必要
# Vercel Postgresをリンクした後、POSTGRES_URLと同じ値を設定
DATABASE_URL=<POSTGRES_URLと同じ値>

# その他の必須環境変数
JWT_SECRET=<強力なランダム文字列（例: openssl rand -base64 32）>
NODE_ENV=production
FRONTEND_URL=<フロントエンドのURL（後で設定）>
```

**重要**: 
- Vercel Postgresを作成後、プロジェクト設定でデータベースをリンクすると、`POSTGRES_URL`、`POSTGRES_PRISMA_URL`、`POSTGRES_URL_NON_POOLING`が自動的に設定されます
- `DATABASE_URL`は`POSTGRES_URL`と同じ値を手動で設定してください（Prismaスキーマが`env("DATABASE_URL")`を参照しているため）

**オプション環境変数**:
```
OPENAI_API_KEY=<OpenAI APIキー（インサイト生成に使用）>
RESEND_API_KEY=<Resend APIキー（メール送信に使用、オプション）>
PORT=3001
```

#### 4.3 デプロイ

1. 「Deploy」をクリック
2. ビルドが完了するまで待機
3. デプロイURLを確認（例: `https://your-api.vercel.app`）

#### 4.4 データベースマイグレーションの実行

初回デプロイ後、データベースマイグレーションを実行：

```bash
# ローカルから実行（推奨）
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLINGの値> pnpm prisma migrate deploy

# または、Vercel CLIを使用
vercel env pull
cd apps/api
pnpm prisma migrate deploy
```

**注意**: マイグレーションは`POSTGRES_URL_NON_POOLING`を使用してください。

### 5. フロントエンドのデプロイ

#### 5.1 Vercelでプロジェクトを作成

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. 同じGitHubリポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

#### 5.2 環境変数の設定

```
NEXT_PUBLIC_API_URL=<APIサーバーのURL（例: https://your-api.vercel.app）>
```

#### 5.3 デプロイ

1. 「Deploy」をクリック
2. ビルドが完了するまで待機
3. デプロイURLを確認（例: `https://your-web.vercel.app`）

#### 5.4 APIサーバーの環境変数を更新

フロントエンドのURLが確定したら、APIサーバーの環境変数を更新：

```
FRONTEND_URL=<フロントエンドのURL（例: https://your-web.vercel.app）>
```

### 6. 動作確認

1. **APIサーバー**
   - `https://your-api.vercel.app/health` にアクセス
   - `{ "status": "ok" }` が返ればOK

2. **フロントエンド**
   - `https://your-web.vercel.app` にアクセス
   - ログイン/サインアップが動作するか確認

3. **データベース**
   - 新規ユーザー登録をテスト
   - データが正しく保存されるか確認

## 🔧 トラブルシューティング

### ビルドエラー: Prisma Client not found

**原因**: Prisma Clientが生成されていない

**解決策**:
```bash
# package.jsonのbuildスクリプトに`prisma generate`が含まれているか確認
# 含まれていない場合は、`"build": "prisma generate && tsc"`に修正
```

### データベース接続エラー

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. Vercelダッシュボードで環境変数を確認
2. `DATABASE_URL`が`POSTGRES_URL`と同じ値であることを確認
3. マイグレーションが実行されているか確認

### CORSエラー

**原因**: フロントエンドとAPIサーバーのドメインが異なる

**解決策**:
1. APIサーバーの`FRONTEND_URL`環境変数を確認
2. `apps/api/src/index.ts`でCORS設定を確認

### マイグレーションエラー

**原因**: マイグレーションが実行されていない、または接続文字列が間違っている

**解決策**:
```bash
# POSTGRES_URL_NON_POOLINGを使用してマイグレーションを実行
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma migrate deploy
```

## 📝 環境変数一覧

### APIサーバー（必須）

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続文字列 | Vercel Postgresから自動設定（`POSTGRES_URL`と同じ値） |
| `POSTGRES_URL` | PostgreSQL接続文字列 | Vercel Postgresから自動設定 |
| `POSTGRES_PRISMA_URL` | Prisma用接続文字列 | Vercel Postgresから自動設定 |
| `POSTGRES_URL_NON_POOLING` | マイグレーション用接続文字列 | Vercel Postgresから自動設定 |
| `JWT_SECRET` | JWT署名用シークレット | 自分で生成（`openssl rand -base64 32`） |
| `NODE_ENV` | 環境 | `production` |
| `FRONTEND_URL` | フロントエンドURL | フロントエンドデプロイ後に設定 |

### APIサーバー（オプション）

| 変数名 | 説明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI APIキー（インサイト生成に使用） |
| `RESEND_API_KEY` | Resend APIキー（メール送信に使用） |
| `PORT` | サーバーポート（デフォルト: 3001） |

### フロントエンド（必須）

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_API_URL` | APIサーバーのURL |

## 🔄 継続的デプロイ

GitHubにpushすると、自動的にVercelがデプロイを実行します。

**注意**: データベーススキーマを変更した場合は、手動でマイグレーションを実行してください：

```bash
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma migrate deploy
```

## 📚 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計ドキュメント

