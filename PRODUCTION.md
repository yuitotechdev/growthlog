# GrowthLog 本番環境運用ガイド

このドキュメントは、GrowthLogを本番環境で運用するための包括的なガイドです。

> 💡 **初めてデプロイする場合**: より詳細で分かりやすい手順は [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) を参照してください。

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [アーキテクチャ概要](#アーキテクチャ概要)
3. [デプロイ手順](#デプロイ手順)
4. [環境変数の設定](#環境変数の設定)
5. [データベース管理](#データベース管理)
6. [運用・保守](#運用保守)
7. [トラブルシューティング](#トラブルシューティング)
8. [セキュリティ](#セキュリティ)

---

## プロジェクト概要

**GrowthLog**は、個人の成長を記録・可視化するためのWebアプリケーションです。

### 主な機能

- 📝 **活動ログ**: 日々の活動を記録（時間、カテゴリ、気分など）
- 📊 **インサイト生成**: AIによる活動分析とアドバイス
- 👥 **グループ機能**: 仲間と活動を共有・比較
- 📈 **統計・ランキング**: 活動の可視化とランキング表示
- ⚙️ **管理機能**: 管理者向けのユーザー・システム管理

### 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **バックエンド**: Express.js, TypeScript
- **データベース**: PostgreSQL (Vercel Postgres)
- **デプロイ**: Vercel (Serverless Functions)
- **認証**: JWT
- **ORM**: Prisma

---

## アーキテクチャ概要

```
┌─────────────────┐
│   フロントエンド   │  Next.js (Vercel)
│  (apps/web)     │  https://your-web.vercel.app
└────────┬────────┘
         │ HTTPS
         │ API Calls
         ▼
┌─────────────────┐
│   APIサーバー    │  Express.js (Vercel)
│  (apps/api)     │  https://your-api.vercel.app
└────────┬────────┘
         │
         │ Prisma ORM
         ▼
┌─────────────────┐
│  Vercel Postgres │  PostgreSQL
│   (Database)     │  256MB (無料プラン)
└─────────────────┘
```

### プロジェクト構造

```
GrowthLog/
├── apps/
│   ├── api/          # APIサーバー (Express.js)
│   └── web/          # フロントエンド (Next.js)
├── packages/
│   └── shared/       # 共有パッケージ (型定義、バリデーション)
└── pnpm-workspace.yaml
```

---

## デプロイ手順

### 前提条件

- ✅ GitHubアカウント
- ✅ Vercelアカウント（無料）
- ✅ リポジトリがGitHubにプッシュ済み

### ステップ1: Vercel Postgresの作成

1. [Vercel](https://vercel.com)にログイン
2. ダッシュボード → **Storage** → **Create Database**
3. **Postgres**を選択
4. 設定:
   - **Database Name**: `growthlog`（任意）
   - **Plan**: **Hobby**（無料、256MB）
   - **Region**: 最寄りのリージョン（例: `Tokyo`）
5. **Create**をクリック

### ステップ2: APIサーバーのデプロイ

#### 2.1 プロジェクト作成

1. Vercelダッシュボード → **Add New...** → **Project**
2. GitHubリポジトリを選択
3. プロジェクト設定:
   - **Framework Preset**: `Other`
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build:deploy`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

#### 2.2 データベースのリンク

1. プロジェクト設定 → **Storage**タブ
2. 作成したVercel Postgresを**Link**
3. これにより以下が自動設定されます:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

#### 2.3 環境変数の設定

**Settings** → **Environment Variables**で以下を設定:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `DATABASE_URL` | `POSTGRES_URL`と同じ値 | Prisma用接続文字列 |
| `JWT_SECRET` | ランダム文字列（32文字以上） | JWT署名用シークレット |
| `NODE_ENV` | `production` | 実行環境 |
| `FRONTEND_URL` | 後で設定 | フロントエンドURL |

**JWT_SECRETの生成方法**:
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 2.4 デプロイ

1. **Deploy**をクリック
2. ビルド完了を待機（約2-3分）
3. デプロイURLを確認（例: `https://growthlog-api.vercel.app`）

#### 2.5 動作確認

```
https://your-api.vercel.app/health
```

レスポンス: `{ "status": "ok" }` が返ればOK

### ステップ3: フロントエンドのデプロイ

#### 3.1 プロジェクト作成

1. Vercelダッシュボード → **Add New...** → **Project**
2. **同じGitHubリポジトリ**を選択
3. プロジェクト設定:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `.next`（自動検出）
   - **Install Command**: `pnpm install`

#### 3.2 環境変数の設定

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.vercel.app` | APIサーバーのURL |

#### 3.3 デプロイ

1. **Deploy**をクリック
2. ビルド完了を待機（約3-5分）
3. デプロイURLを確認（例: `https://growthlog-web.vercel.app`）

#### 3.4 APIサーバーの環境変数を更新

フロントエンドのURLが確定したら、APIサーバーの環境変数を更新:

1. APIサーバーのプロジェクト設定 → **Environment Variables**
2. `FRONTEND_URL`を更新:
   ```
   FRONTEND_URL=https://your-web.vercel.app
   ```
3. **Redeploy**を実行（環境変数変更後は再デプロイが必要）

---

## 環境変数の設定

### APIサーバー（必須）

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続文字列 | Vercel Postgresから自動設定（`POSTGRES_URL`と同じ値） |
| `POSTGRES_URL` | PostgreSQL接続文字列 | Vercel Postgresから自動設定 |
| `POSTGRES_PRISMA_URL` | Prisma用接続文字列 | Vercel Postgresから自動設定 |
| `POSTGRES_URL_NON_POOLING` | マイグレーション用接続文字列 | Vercel Postgresから自動設定 |
| `JWT_SECRET` | JWT署名用シークレット | 自分で生成（32文字以上推奨） |
| `NODE_ENV` | 実行環境 | `production` |
| `FRONTEND_URL` | フロントエンドURL | フロントエンドデプロイ後に設定 |

### APIサーバー（オプション）

| 変数名 | 説明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI APIキー（インサイト生成に使用） |
| `RESEND_API_KEY` | Resend APIキー（メール送信に使用） |
| `PORT` | サーバーポート（Vercelでは自動設定） |

### フロントエンド（必須）

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_API_URL` | APIサーバーのURL |

### 環境変数の確認方法

1. Vercelダッシュボード → プロジェクト → **Settings** → **Environment Variables**
2. 各変数の右側の**目アイコン**をクリックして値を確認

---

## データベース管理

### マイグレーションの実行

データベーススキーマを変更した場合、マイグレーションを実行:

```bash
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma migrate deploy
```

**注意**: `POSTGRES_URL_NON_POOLING`を使用してください（通常の`POSTGRES_URL`は接続プールを使用するため、マイグレーションには適しません）

### データベースのリセット

⚠️ **警告**: すべてのデータが削除されます！

```bash
cd apps/api
pnpm db:reset
```

### 管理者権限の付与

特定のユーザーに管理者権限を付与:

```bash
cd apps/api
pnpm admin:grant <ユーザーID>
```

例:
```bash
pnpm admin:grant yuito
```

### Prisma Studio（データベースGUI）

ローカル環境でデータベースを確認・編集:

```bash
cd apps/api
pnpm prisma:studio
```

ブラウザで `http://localhost:5555` が開きます。

---

## 運用・保守

### 継続的デプロイ

GitHubの`main`ブランチにpushすると、自動的にVercelがデプロイを実行します。

**注意**: データベーススキーマを変更した場合は、手動でマイグレーションを実行してください。

### ログの確認

1. Vercelダッシュボード → プロジェクト → **Logs**タブ
2. リアルタイムでログを確認できます

### パフォーマンス監視

- **Vercel Analytics**: ダッシュボードで自動的に収集
- **Function Logs**: 各サーバーレス関数の実行時間・メモリ使用量を確認

### バックアップ

Vercel Postgresは自動的にバックアップされます（無料プランでも利用可能）。

手動バックアップが必要な場合:
```bash
# pg_dumpを使用（ローカル環境）
pg_dump $DATABASE_URL > backup.sql
```

### スケーリング

- **無料プラン**: 256MBストレージ、制限あり
- **有料プラン**: 必要に応じてアップグレード可能

---

## トラブルシューティング

### 500エラーが発生する

**原因**: データベース接続エラー、環境変数の不備

**解決策**:
1. Vercelの**Logs**タブでエラー内容を確認
2. 環境変数が正しく設定されているか確認
3. マイグレーションが実行されているか確認

### CORSエラーが発生する

**原因**: `FRONTEND_URL`が正しく設定されていない

**解決策**:
1. APIサーバーの`FRONTEND_URL`環境変数を確認
2. 末尾に`/`が付いていないか確認
3. フロントエンドのURLと完全一致しているか確認

### ビルドエラー: Prisma Client not found

**原因**: Prisma Clientが生成されていない

**解決策**:
1. `apps/api/package.json`の`build:deploy`スクリプトに`prisma generate`が含まれているか確認
2. 含まれていない場合は追加:
   ```json
   "build:deploy": "pnpm --filter @growthlog/shared build && prisma generate && prisma migrate deploy && tsc"
   ```

### データベース接続エラー

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `DATABASE_URL`が`POSTGRES_URL`と同じ値であることを確認
2. Vercel Postgresがプロジェクトにリンクされているか確認
3. マイグレーションが実行されているか確認

### ログインできない

**原因**: データベースにユーザーが存在しない、パスワードが間違っている

**解決策**:
1. 新規ユーザー登録を試す
2. データベースをリセットして再登録
3. Prisma Studioでユーザーデータを確認

---

## セキュリティ

### 推奨事項

1. **JWT_SECRET**: 強力なランダム文字列を使用（32文字以上）
2. **環境変数**: 機密情報は環境変数で管理（コードに直接書かない）
3. **HTTPS**: Vercelは自動的にHTTPSを有効化
4. **CORS**: `FRONTEND_URL`を正しく設定して、許可されたオリジンのみアクセス可能に
5. **データベース**: 接続文字列は環境変数で管理

### 定期的な確認事項

- [ ] 環境変数が正しく設定されているか
- [ ] 不要な環境変数が残っていないか
- [ ] データベースの使用量（256MB制限）
- [ ] ログに異常なアクセスがないか

---

## 参考リンク

### ドキュメント

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - 詳細なデプロイ手順
- [README_DEPLOY.md](./README_DEPLOY.md) - クイックスタートガイド
- [ENV_CHECKLIST.md](./ENV_CHECKLIST.md) - 環境変数チェックリスト
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計ドキュメント

### 外部リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## サポート

問題が発生した場合:

1. **ログを確認**: Vercelダッシュボードの**Logs**タブ
2. **環境変数を確認**: **Settings** → **Environment Variables**
3. **ドキュメントを参照**: 上記の参考リンク
4. **GitHub Issues**: バグ報告や機能要望はGitHub Issuesで

---

**最終更新**: 2025年12月9日

