# GitHub → Vercel 一発デプロイガイド

このドキュメントは、GitHubにpushするだけでVercelに自動デプロイするための手順です。

## 📋 前提条件

- [ ] GitHubリポジトリが作成されている
- [ ] Vercelアカウントが作成されている
- [ ] Vercel Postgresデータベースが作成されている（または作成予定）

## 🚀 デプロイ手順

### Step 1: コードをGitHubにプッシュ

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Vercel Postgresの作成（初回のみ）

1. [Vercel](https://vercel.com)にログイン
2. ダッシュボード → **Storage** → **Create Database** → **Postgres**
3. データベース名: `growthlog`
4. プラン: **Hobby**（無料）
5. 「Create」をクリック

### Step 3: APIサーバーのデプロイ

1. Vercelダッシュボード → **Add New...** → **Project**
2. GitHubリポジトリを選択
3. **プロジェクト設定**:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api` ⚠️ 重要
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
4. **Vercel Postgresをリンク**:
   - プロジェクト設定で「Storage」タブを開く
   - 作成したVercel Postgresデータベースをリンク
   - これにより`POSTGRES_URL`、`POSTGRES_PRISMA_URL`、`POSTGRES_URL_NON_POOLING`が自動設定されます

5. **環境変数の設定**:
   - 手動で以下を追加:
     ```
     DATABASE_URL=<POSTGRES_URLと同じ値>
     JWT_SECRET=<強力なランダム文字列>
     NODE_ENV=production
     FRONTEND_URL=<後で設定>
     ```
5. **Deploy**をクリック
6. デプロイ完了後、URLを確認（例: `https://your-api.vercel.app`）

### Step 4: データベースマイグレーション（初回のみ）

デプロイ後、マイグレーションを実行：

```bash
# ローカルから実行
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLINGの値> pnpm prisma migrate deploy
```

または、Vercel CLIを使用：

```bash
vercel env pull
cd apps/api
pnpm prisma migrate deploy
```

### Step 5: フロントエンドのデプロイ

1. Vercelダッシュボード → **Add New...** → **Project**
2. 同じGitHubリポジトリを選択
3. **プロジェクト設定**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` ⚠️ 重要
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
4. **環境変数の設定**:
   ```
   NEXT_PUBLIC_API_URL=<APIサーバーのURL>
   ```
5. **Deploy**をクリック
6. デプロイ完了後、URLを確認（例: `https://your-web.vercel.app`）

### Step 6: 環境変数の最終設定

フロントエンドのURLが確定したら、APIサーバーの環境変数を更新：

1. Vercelダッシュボード → APIサーバーのプロジェクト → **Settings** → **Environment Variables**
2. `FRONTEND_URL`を更新: `<フロントエンドのURL>`
3. **Save**をクリック
4. 必要に応じて再デプロイ

## ✅ 動作確認

### APIサーバー

```bash
curl https://your-api.vercel.app/health
# 期待される結果: { "status": "ok" }
```

### フロントエンド

ブラウザで `https://your-web.vercel.app` にアクセスし、以下を確認：
- [ ] ログイン画面が表示される
- [ ] 新規登録が動作する
- [ ] ログインが動作する

## 🔄 継続的デプロイ

GitHubにpushすると、自動的にVercelがデプロイを実行します。

**注意事項**:
- データベーススキーマを変更した場合は、手動でマイグレーションを実行してください
- 環境変数を変更した場合は、再デプロイが必要な場合があります

## 📚 関連ドキュメント

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - 詳細なデプロイ手順とトラブルシューティング
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - デプロイ前チェックリスト
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計ドキュメント

