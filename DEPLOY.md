# Vercelデプロイ手順

## 前提条件

1. GitHubアカウント
2. Vercelアカウント（無料）
3. Resendアカウント（無料プランあり）

## 1. Resendアカウントの作成と設定

1. [Resend](https://resend.com) にアクセスしてアカウントを作成
2. ダッシュボードでAPIキーを生成
3. ドメインを追加（またはデフォルトの `onboarding@resend.dev` を使用）

## 2. GitHubにプッシュ

```bash
git add .
git commit -m "Add email verification with Resend"
git push origin main
```

## 3. Vercelでプロジェクトを作成

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定：
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

## 4. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を追加：

### 必須環境変数

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=your-database-url
RESEND_API_KEY=re_74huwXMu_3V5DcehESXS82fercpXHLaq4
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**注意**: `RESEND_FROM_EMAIL` は `onboarding@resend.dev` で問題ありません。ドメイン設定は不要です。

### オプション環境変数

```
OPENAI_API_KEY=your-openai-api-key
PORT=3001
```

## 5. データベースの設定

VercelではSQLiteは使えないため、以下のいずれかを使用：

### オプション1: Vercel Postgres（推奨）

1. Vercelダッシュボードで「Storage」タブを開く
2. 「Create Database」→「Postgres」を選択
3. データベースを作成
4. 接続文字列を `DATABASE_URL` に設定

### オプション2: 外部データベース

- Supabase（無料プランあり）
- PlanetScale（無料プランあり）
- Railway（無料プランあり）

**注意**: SQLiteからPostgresに移行する場合は、Prismaスキーマを更新する必要があります。

## 6. フロントエンドのデプロイ

1. Vercelで新しいプロジェクトを作成
2. リポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

### フロントエンドの環境変数

```
NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app
```

## 7. デプロイ後の確認

1. APIサーバーが正常に起動しているか確認
2. 新規登録機能をテスト
3. メールが正しく送信されるか確認

## トラブルシューティング

### メールが送信されない

- Resend APIキーが正しく設定されているか確認
- Resendダッシュボードで送信ログを確認
- 環境変数 `RESEND_FROM_EMAIL` が正しく設定されているか確認

### データベース接続エラー

- `DATABASE_URL` が正しく設定されているか確認
- データベースがVercelのリージョンと近い場所にあるか確認
- Prismaマイグレーションが実行されているか確認

### ビルドエラー

- `package.json` の依存関係が正しいか確認
- TypeScriptの型エラーがないか確認
- ビルドログを確認してエラーを特定

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

