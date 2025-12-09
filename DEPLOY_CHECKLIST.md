# Vercelデプロイチェックリスト

このチェックリストを使用して、Vercelへのデプロイ準備を確認してください。

## ✅ デプロイ前チェック

### データベース

- [ ] PrismaスキーマがPostgreSQL用に設定されている（`provider = "postgresql"`）
- [ ] マイグレーションファイルが存在する（`apps/api/prisma/migrations/`）
- [ ] `migration_lock.toml`が`provider = "postgresql"`になっている

### コード

- [ ] SQLiteの参照がコード内にない
- [ ] すべての環境変数が適切に設定されている
- [ ] CORS設定が本番環境に対応している
- [ ] Prisma Clientがビルド時に生成される（`package.json`の`build`スクリプトに`prisma generate`が含まれている）

### ビルド設定

- [ ] `apps/api/package.json`の`build`スクリプトに`prisma generate`が含まれている
- [ ] `apps/api/package.json`に`postinstall`スクリプトがある（`prisma generate`）
- [ ] `apps/api/vercel.json`が正しく設定されている
- [ ] `apps/api/api/index.ts`が存在し、正しくエクスポートされている

### 環境変数

- [ ] `.env.example`ファイルが存在する
- [ ] 必要な環境変数がすべてドキュメント化されている

## 🚀 デプロイ手順

### 1. GitHubにプッシュ

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercel Postgresの作成

- [ ] VercelダッシュボードでPostgresデータベースを作成
- [ ] データベース名: `growthlog`
- [ ] プラン: Hobby（無料）

### 3. APIサーバーのデプロイ

- [ ] Vercelでプロジェクトを作成（Root Directory: `apps/api`）
- [ ] Vercel Postgresをリンク（プロジェクト設定 → Storage → データベースをリンク）
- [ ] 環境変数を設定:
  - [ ] `DATABASE_URL` = `POSTGRES_URL`と同じ値
  - [ ] `JWT_SECRET` = 強力なランダム文字列
  - [ ] `NODE_ENV` = `production`
  - [ ] `FRONTEND_URL` = （後で設定）
- [ ] デプロイを実行
- [ ] ビルドが成功することを確認

### 4. データベースマイグレーション

- [ ] マイグレーションを実行:
  ```bash
  cd apps/api
  DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma migrate deploy
  ```

### 5. フロントエンドのデプロイ

- [ ] Vercelでプロジェクトを作成（Root Directory: `apps/web`）
- [ ] 環境変数を設定:
  - [ ] `NEXT_PUBLIC_API_URL` = APIサーバーのURL
- [ ] デプロイを実行
- [ ] ビルドが成功することを確認

### 6. 環境変数の最終設定

- [ ] APIサーバーの`FRONTEND_URL`をフロントエンドのURLに更新

## ✅ デプロイ後チェック

### APIサーバー

- [ ] `https://your-api.vercel.app/health` が `{ "status": "ok" }` を返す
- [ ] ログにエラーがない

### フロントエンド

- [ ] `https://your-web.vercel.app` が正常に表示される
- [ ] ログイン画面が表示される

### データベース

- [ ] 新規ユーザー登録が動作する
- [ ] データが正しく保存される
- [ ] Prisma Studioでデータを確認できる（オプション）

### 機能テスト

- [ ] ユーザー登録・ログインが動作する
- [ ] プロフィール設定が動作する
- [ ] 活動ログの作成・編集・削除が動作する
- [ ] グループ機能が動作する（オプション）

## 🔧 トラブルシューティング

問題が発生した場合は、[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)の「トラブルシューティング」セクションを参照してください。

