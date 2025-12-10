# 本番環境へのデプロイ手順

## 現在の状況

✅ **GitHubへのプッシュは完了しています**
- 最新のコミット: `e61b182` (fix: Wrap useSearchParams in Suspense boundary for Next.js 14)
- Vercelが自動的にデプロイを開始しているはずです

## 確認手順

### 1. Vercelダッシュボードでデプロイ状況を確認

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. GrowthLogプロジェクトを選択
3. **Deployments**タブで最新のデプロイメントを確認
4. 以下の2つのデプロイメントが表示されるはずです：
   - **API** (`apps/api`)
   - **Web** (`apps/web`)

### 2. ビルドログの確認

各デプロイメントのビルドログを確認して、以下を確認してください：

#### API のビルドログで確認すべき点：
- ✅ `pnpm --filter @growthlog/shared build` が成功
- ✅ `prisma generate` が成功
- ✅ `prisma migrate deploy` が成功（マイグレーションが適用される）
- ✅ `tsc` が成功（TypeScriptコンパイル）

#### Web のビルドログで確認すべき点：
- ✅ `next build` が成功
- ✅ 型チェックが成功
- ✅ 静的ページの生成が成功

### 3. データベースマイグレーションの確認

APIのビルドログに以下のようなメッセージが表示されているはずです：

```
Applying migration `20251210031437_add_is_sample_and_streak`
The following migration(s) have been applied:
  migrations/
    └─ 20251210031437_add_is_sample_and_streak/
      └─ migration.sql
All migrations have been successfully applied.
```

これが表示されていれば、データベースに以下のカラムが追加されています：
- `activities.isSample` (Boolean)
- `users.streak` (Int)
- `users.lastActiveDate` (String?)

### 4. 環境変数の確認

Vercelダッシュボードで、以下の環境変数が正しく設定されているか確認してください：

#### API プロジェクトの環境変数：
- `DATABASE_URL`: Vercel Postgresの**非プーリング接続文字列**（マイグレーション用）
- `PRISMA_DATABASE_URL`: Prisma Accelerateの接続文字列（アプリケーション用、オプション）
- `JWT_SECRET`: JWTトークンの署名用シークレット
- `OPENAI_API_KEY`: OpenAI APIキー（AIインサイト生成用）
- その他の必要な環境変数

#### Web プロジェクトの環境変数：
- `NEXT_PUBLIC_API_URL`: APIサーバーのURL（例: `https://your-api.vercel.app`）

### 5. 本番環境での動作確認

デプロイが完了したら、以下の機能を確認してください：

#### ✅ オンボーディング機能
1. 新規ユーザー登録
2. テンプレート選択（複数選択可能）
3. サンプルデータの自動生成
4. AIインサイトの生成
5. サンプルデータの削除

#### ✅ 基本機能
1. 活動の追加（FABボタン）
2. カテゴリの表示・選択
3. ストリーク表示（連続記録日数）
4. AIインサイトの表示（3階層構造）

#### ✅ グループ機能
1. グループ作成
2. カテゴリのカスタマイズ
3. グループ一覧の表示

#### ✅ アカウント管理
1. プロフィール設定
2. アカウント削除

## トラブルシューティング

### ビルドが失敗する場合

1. **APIのビルドエラー**:
   - ビルドログを確認
   - TypeScriptエラーがないか確認
   - データベース接続エラーがないか確認

2. **Webのビルドエラー**:
   - ビルドログを確認
   - TypeScriptエラーがないか確認
   - `useSearchParams()`のSuspenseエラーがないか確認

### マイグレーションが適用されない場合

手動でマイグレーションを実行する場合：

```bash
# ローカルで実行（本番データベースに接続）
cd apps/api
npx prisma migrate deploy
```

**注意**: 本番データベースに直接接続する場合は、`DATABASE_URL`環境変数が本番用に設定されていることを確認してください。

### 環境変数が正しく設定されていない場合

1. Vercelダッシュボードで環境変数を確認
2. 必要に応じて環境変数を追加・更新
3. 環境変数を更新したら、**再デプロイ**が必要です

## 再デプロイの方法

### 自動デプロイ（推奨）
- GitHubにプッシュすると自動的にデプロイされます

### 手動デプロイ
1. Vercelダッシュボードでプロジェクトを選択
2. **Deployments**タブを開く
3. 最新のデプロイメントの「...」メニューから「Redeploy」を選択

## 次のステップ

デプロイが成功したら：
1. ✅ 本番環境で動作確認
2. ✅ ユーザーに新機能を通知（必要に応じて）
3. ✅ モニタリングとエラートラッキングの設定確認

