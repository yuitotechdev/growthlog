# 環境変数チェックリスト

## APIサーバー（Vercel）の環境変数確認

### 必須環境変数

#### 1. `DATABASE_URL`
- **説明**: Prismaが使用するPostgreSQL接続文字列
- **形式**: `postgres://ユーザー名:パスワード@ホスト:ポート/データベース名?sslmode=require`
- **確認方法**: Vercel Postgresダッシュボード → **Settings** → **Connection String**
- **注意**: Vercel Postgresをリンクしている場合、自動的に設定されます

#### 2. `POSTGRES_URL`
- **説明**: Vercel Postgresの接続文字列（DATABASE_URLと同じ値）
- **確認方法**: Vercel Postgresダッシュボード → **Settings** → **Connection String**
- **注意**: `DATABASE_URL`と同じ値を設定してください

#### 3. `PRISMA_DATABASE_URL`（オプション）
- **説明**: Prisma Accelerateを使用する場合の接続文字列
- **確認方法**: Prisma Accelerateダッシュボード
- **注意**: 使用していない場合は設定不要

#### 4. `JWT_SECRET`
- **説明**: JWTトークンの署名に使用するシークレットキー
- **形式**: ランダムな文字列（32文字以上推奨）
- **生成方法**: 
  ```bash
  openssl rand -base64 32
  ```
  または
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **注意**: 本番環境では必ず強力なランダム文字列を使用してください

#### 5. `NODE_ENV`
- **説明**: 実行環境
- **値**: `production`
- **注意**: 本番環境では必ず`production`に設定してください

#### 6. `FRONTEND_URL`
- **説明**: フロントエンドのURL（CORS設定で使用）
- **形式**: `https://your-frontend.vercel.app`（末尾に`/`なし）
- **確認方法**: フロントエンドのVercelデプロイURLを確認
- **注意**: 末尾に`/`を付けないでください

### オプション環境変数

#### 7. `OPENAI_API_KEY`
- **説明**: OpenAI APIキー（インサイト生成機能で使用）
- **確認方法**: OpenAIダッシュボード → **API Keys**
- **注意**: 使用しない場合は設定不要（空文字列でも動作します）

#### 8. `RESEND_API_KEY`
- **説明**: Resend APIキー（メール送信機能で使用）
- **確認方法**: Resendダッシュボード → **API Keys**
- **注意**: 使用しない場合は設定不要（空文字列でも動作します）

#### 9. `PORT`
- **説明**: サーバーポート
- **デフォルト**: `3001`
- **注意**: Vercelでは自動設定されるため、通常は設定不要

## 確認手順

### 1. Vercelダッシュボードで確認
1. Vercelダッシュボード → APIプロジェクトを開く
2. **Settings** → **Environment Variables**を開く
3. 上記の必須環境変数がすべて設定されているか確認

### 2. 値の確認方法
各環境変数の右側の**目アイコン**をクリックして、値を確認できます。

### 3. よくある問題

#### 問題1: `DATABASE_URL`が設定されていない
- **症状**: 500エラー、データベース接続エラー
- **解決**: Vercel Postgresをリンクするか、手動で`DATABASE_URL`を設定

#### 問題2: `FRONTEND_URL`が間違っている
- **症状**: CORSエラー
- **解決**: フロントエンドの正しいURLを設定（末尾に`/`なし）

#### 問題3: `JWT_SECRET`が弱い
- **症状**: セキュリティリスク
- **解決**: 強力なランダム文字列を生成して設定

#### 問題4: `NODE_ENV`が`production`になっていない
- **症状**: 開発環境の設定が適用される
- **解決**: `production`に設定

## 環境変数の設定方法

### Vercelダッシュボードで設定
1. **Settings** → **Environment Variables**を開く
2. **Add New**をクリック
3. **Key**と**Value**を入力
4. **Environment**で適用環境を選択（通常は「All Environments」）
5. **Save**をクリック

### 一括設定（推奨）
以下のコマンドで一括設定できます（Vercel CLIが必要）：

```bash
vercel env add DATABASE_URL production
vercel env add POSTGRES_URL production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production
vercel env add FRONTEND_URL production
```

## 確認コマンド

ローカル環境で環境変数を確認する場合：

```bash
# .envファイルを確認
cat apps/api/.env

# 特定の環境変数を確認
echo $DATABASE_URL
```

## トラブルシューティング

### 500エラーが発生する場合
1. Vercelのログを確認（**Logs**タブ）
2. データベース接続エラーがないか確認
3. 環境変数が正しく設定されているか確認
4. マイグレーションが実行されているか確認

### CORSエラーが発生する場合
1. `FRONTEND_URL`が正しく設定されているか確認
2. 末尾に`/`が付いていないか確認
3. フロントエンドのURLと一致しているか確認

