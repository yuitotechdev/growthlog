# GrowthLog デプロイクイックスタート

このドキュメントは、GrowthLogをVercelにデプロイするための簡易手順書です。詳細は [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) を参照してください。

## 🚀 5分でデプロイ

### 1. GitHubにプッシュ

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercel Postgresを作成

1. [Vercel](https://vercel.com)にログイン
2. ダッシュボード → **Storage** → **Create Database** → **Postgres**
3. データベース名: `growthlog`、プラン: **Hobby**（無料）
4. 作成完了後、環境変数が自動設定されます

### 3. APIサーバーをデプロイ

1. Vercelダッシュボード → **Add New...** → **Project**
2. GitHubリポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
4. **Vercel Postgresをリンク**:
   - プロジェクト設定で「Storage」タブを開く
   - 作成したVercel Postgresデータベースをリンク
   - これにより`POSTGRES_URL`、`POSTGRES_PRISMA_URL`、`POSTGRES_URL_NON_POOLING`が自動設定されます

5. 環境変数を設定:
   ```
   DATABASE_URL=<POSTGRES_URLと同じ値>
   JWT_SECRET=<強力なランダム文字列>
   NODE_ENV=production
   FRONTEND_URL=<後で設定>
   ```
6. **Deploy**をクリック

### 4. データベースマイグレーション

デプロイ後、マイグレーションを実行：

```bash
cd apps/api
DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma migrate deploy
```

### 5. フロントエンドをデプロイ

1. Vercelダッシュボード → **Add New...** → **Project**
2. 同じGitHubリポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm build`
4. 環境変数を設定:
   ```
   NEXT_PUBLIC_API_URL=<APIサーバーのURL>
   ```
5. **Deploy**をクリック

### 6. APIサーバーの環境変数を更新

フロントエンドのURLが確定したら、APIサーバーの環境変数を更新：

```
FRONTEND_URL=<フロントエンドのURL>
```

## ✅ 動作確認

- API: `https://your-api.vercel.app/health` → `{ "status": "ok" }`
- フロントエンド: `https://your-web.vercel.app` → ログイン画面が表示される

## 📚 詳細ドキュメント

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - 詳細なデプロイ手順
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計ドキュメント

