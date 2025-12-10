# 🚀 GrowthLog 本番環境デプロイガイド

このドキュメントは、GrowthLogを本番環境（Vercel）にデプロイするための完全ガイドです。

---

## 📋 目次

1. [前提条件](#前提条件)
2. [デプロイの流れ](#デプロイの流れ)
3. [ステップ1: データベースの準備](#ステップ1-データベースの準備)
4. [ステップ2: APIサーバーのデプロイ](#ステップ2-apiサーバーのデプロイ)
5. [ステップ3: フロントエンドのデプロイ](#ステップ3-フロントエンドのデプロイ)
6. [ステップ4: 動作確認](#ステップ4-動作確認)
7. [環境変数一覧](#環境変数一覧)
8. [よくある問題と解決方法](#よくある問題と解決方法)
9. [運用・管理](#運用管理)

---

## 前提条件

デプロイを開始する前に、以下を準備してください：

- ✅ **GitHubアカウント** - コードをホストするため
- ✅ **Vercelアカウント** - [vercel.com](https://vercel.com)で無料登録
- ✅ **GitHubリポジトリ** - コードがプッシュされていること

---

## デプロイの流れ

```
1. データベース作成 (Vercel Postgres)
   ↓
2. APIサーバーデプロイ
   ↓
3. データベースマイグレーション実行
   ↓
4. フロントエンドデプロイ
   ↓
5. 環境変数の最終調整
   ↓
6. 動作確認
```

**所要時間**: 約15-20分

---

## ステップ1: データベースの準備

### 1.1 Vercel Postgresを作成

1. [Vercel](https://vercel.com)にログイン
2. ダッシュボードで **「Storage」** タブをクリック
3. **「Create Database」** をクリック
4. **「Postgres」** を選択
5. 設定を入力：
   - **Database Name**: `growthlog`（任意の名前）
   - **Region**: 最寄りのリージョン（例: `N. Virginia (us-east-1)`）
   - **Plan**: **Hobby**（無料プラン、256MB）
6. **「Create」** をクリック

### 1.2 データベース情報を確認

データベース作成後、以下の情報が表示されます：

- `POSTGRES_URL` - 通常の接続用
- `POSTGRES_PRISMA_URL` - Prisma用（接続プール付き）
- `POSTGRES_URL_NON_POOLING` - マイグレーション用

**重要**: これらの値は後で使用するので、メモしておいてください。

---

## ステップ2: APIサーバーのデプロイ

### 2.1 Vercelでプロジェクトを作成

1. Vercelダッシュボードで **「Add New...」** → **「Project」** をクリック
2. GitHubリポジトリを選択（またはインポート）
3. プロジェクト名を入力（例: `growthlog-api`）

### 2.2 プロジェクト設定

**Framework Preset**: `Other`

**Root Directory**: `apps/api`

**Build Command**: 
```
pnpm --filter @growthlog/shared build && pnpm build:deploy
```

**Output Directory**: （空欄のまま）

**Install Command**: 
```
pnpm install
```

### 2.3 データベースをリンク

1. プロジェクト設定画面で **「Storage」** タブを開く
2. 作成したVercel Postgresデータベースを選択
3. **「Link」** をクリック

これにより、以下の環境変数が自動的に設定されます：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 2.4 環境変数を設定

プロジェクト設定の **「Environment Variables」** で以下を追加：

#### 必須環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `DATABASE_URL` | `POSTGRES_URL`と同じ値 | Prismaが使用する接続文字列 |
| `JWT_SECRET` | ランダム文字列 | JWT署名用（後述の生成方法を参照） |
| `NODE_ENV` | `production` | 実行環境 |
| `FRONTEND_URL` | （後で設定） | フロントエンドのURL |

#### JWT_SECRETの生成方法

```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Mac/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### オプション環境変数

| 変数名 | 説明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI APIキー（インサイト生成機能用） |
| `RESEND_API_KEY` | Resend APIキー（メール送信機能用） |

### 2.5 デプロイ実行

1. **「Deploy」** をクリック
2. ビルドが完了するまで待機（約2-3分）
3. デプロイURLを確認（例: `https://growthlog-api.vercel.app`）

### 2.6 データベースマイグレーション実行

デプロイ完了後、データベーススキーマを適用します：

```bash
# ローカル環境で実行
cd apps/api

# 環境変数を設定（.envファイルに追加）
DATABASE_URL=<POSTGRES_URL_NON_POOLINGの値>

# マイグレーション実行
pnpm prisma migrate deploy
```

**重要**: 
- `POSTGRES_URL_NON_POOLING`を使用してください
- マイグレーションは初回のみ実行すればOKです

---

## ステップ3: フロントエンドのデプロイ

### 3.1 Vercelでプロジェクトを作成

1. Vercelダッシュボードで **「Add New...」** → **「Project」** をクリック
2. **同じGitHubリポジトリ**を選択
3. プロジェクト名を入力（例: `growthlog-web`）

### 3.2 プロジェクト設定

**Framework Preset**: `Next.js`（自動検出）

**Root Directory**: `apps/web`

**Build Command**: 
```
pnpm --filter @growthlog/web build
```

**Output Directory**: （空欄のまま、Next.jsのデフォルトを使用）

**Install Command**: 
```
pnpm install
```

### 3.3 環境変数を設定

**必須環境変数**:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | APIサーバーのURL | 例: `https://growthlog-api.vercel.app` |

**注意**: 
- 末尾に`/`を付けないでください
- `NEXT_PUBLIC_`プレフィックスが必要です（Next.jsの仕様）

### 3.4 デプロイ実行

1. **「Deploy」** をクリック
2. ビルドが完了するまで待機（約3-5分）
3. デプロイURLを確認（例: `https://growthlog-web.vercel.app`）

### 3.5 APIサーバーの環境変数を更新

フロントエンドのURLが確定したら、APIサーバーの環境変数を更新：

1. APIサーバーのプロジェクト設定を開く
2. **「Environment Variables」** を開く
3. `FRONTEND_URL`を更新：
   - 値: フロントエンドのURL（例: `https://growthlog-web.vercel.app`）
   - 末尾に`/`を付けない
4. **「Save」** をクリック
5. **「Redeploy」** をクリック（環境変数の変更を反映）

---

## ステップ4: 動作確認

### 4.1 APIサーバーの確認

ブラウザで以下にアクセス：

```
https://your-api.vercel.app/health
```

**期待される結果**:
```json
{
  "status": "ok"
}
```

### 4.2 フロントエンドの確認

ブラウザで以下にアクセス：

```
https://your-web.vercel.app
```

**期待される結果**:
- ログイン/サインアップ画面が表示される
- エラーが表示されない

### 4.3 機能テスト

1. **新規アカウント作成**
   - サインアップページでアカウントを作成
   - メールアドレス、ユーザーID、パスワードを入力
   - 登録が成功することを確認

2. **ログイン**
   - 作成したアカウントでログイン
   - ホーム画面が表示されることを確認

3. **管理者権限の付与**（必要に応じて）
   ```bash
   cd apps/api
   pnpm admin:grant <ユーザーID>
   ```

---

## 環境変数一覧

### APIサーバー（必須）

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続文字列 | `POSTGRES_URL`と同じ値 |
| `POSTGRES_URL` | Vercel Postgres接続文字列 | データベースリンク時に自動設定 |
| `POSTGRES_PRISMA_URL` | Prisma用接続文字列 | データベースリンク時に自動設定 |
| `POSTGRES_URL_NON_POOLING` | マイグレーション用接続文字列 | データベースリンク時に自動設定 |
| `JWT_SECRET` | JWT署名用シークレット | 自分で生成 |
| `NODE_ENV` | 実行環境 | `production` |
| `FRONTEND_URL` | フロントエンドURL | フロントエンドデプロイ後に設定 |

### APIサーバー（オプション）

| 変数名 | 説明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI APIキー |
| `RESEND_API_KEY` | Resend APIキー |
| `PORT` | サーバーポート（通常は設定不要） |

### フロントエンド（必須）

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_API_URL` | APIサーバーのURL |

---

## よくある問題と解決方法

### ❌ 問題1: APIサーバーが500エラーを返す

**原因**: 
- データベース接続エラー
- 環境変数が設定されていない
- マイグレーションが実行されていない

**解決方法**:
1. Vercelのログを確認（**「Logs」**タブ）
2. `DATABASE_URL`が正しく設定されているか確認
3. マイグレーションを実行：
   ```bash
   cd apps/api
   DATABASE_URL=<POSTGRES_URL_NON_POOLING> pnpm prisma migrate deploy
   ```

### ❌ 問題2: CORSエラーが発生する

**原因**: 
- `FRONTEND_URL`が設定されていない
- `FRONTEND_URL`の値が間違っている

**解決方法**:
1. APIサーバーの環境変数で`FRONTEND_URL`を確認
2. フロントエンドのURLと完全一致しているか確認（末尾に`/`なし）
3. 環境変数を更新後、**「Redeploy」**を実行

### ❌ 問題3: フロントエンドからAPIに接続できない

**原因**: 
- `NEXT_PUBLIC_API_URL`が設定されていない
- APIサーバーのURLが間違っている

**解決方法**:
1. フロントエンドの環境変数で`NEXT_PUBLIC_API_URL`を確認
2. APIサーバーのURLと完全一致しているか確認
3. ブラウザの開発者ツール（F12）でネットワークエラーを確認

### ❌ 問題4: ビルドエラー: `@growthlog/shared` not found

**原因**: 
- モノレポの依存関係が正しく解決されていない

**解決方法**:
1. `apps/api/package.json`に以下が含まれているか確認：
   ```json
   {
     "dependencies": {
       "@growthlog/shared": "workspace:*"
     }
   }
   ```
2. ルートで`pnpm install`を実行
3. ビルドコマンドに`pnpm --filter @growthlog/shared build`が含まれているか確認

### ❌ 問題5: プレビューURLに他人がアクセスできない

**原因**: 
- プレビューURLは一時的なURLで、プライベート設定の場合がある
- プレビューURLは各デプロイごとに異なる

**解決方法**:
1. **Production URLを使用**:
   - Vercelダッシュボード → プロジェクト → **「Settings」** → **「Domains」**
   - Production URLを確認（例: `growthlog-web.vercel.app`）
   - このURLを他人に共有

2. **カスタムドメインを設定**（推奨）:
   - 上記の「ドメインとURLの設定」セクションを参照
   - カスタムドメインを設定すると、固定URLで共有可能

3. **プレビューURLの設定を確認**:
   - **「Settings」** → **「General」** → **「Deployment Protection」**
   - 必要に応じて設定を変更

### ❌ 問題6: データベース接続エラー

**原因**: 
- `DATABASE_URL`が設定されていない
- `DATABASE_URL`の値が間違っている

**解決方法**:
1. Vercel Postgresが正しくリンクされているか確認
2. `DATABASE_URL`が`POSTGRES_URL`と同じ値であることを確認
3. データベースが作成されているか確認

---

## ドメインとURLの設定

### プレビューURLとProduction URLの違い

Vercelには2種類のURLがあります：

1. **プレビューURL**（例: `growthlog-web-7q9j-a1guazpid-dekaos-projects.vercel.app`）
   - 各デプロイごとに生成される一時的なURL
   - プルリクエストやブランチごとに異なる
   - **他人には共有できない場合がある**（プライベート設定の場合）

2. **Production URL**（例: `growthlog-web.vercel.app`）
   - メイン（`main`）ブランチの本番環境URL
   - 固定URLで、誰でもアクセス可能
   - **他人に共有する場合はこちらを使用**

### Production URLの確認方法

1. Vercelダッシュボードでプロジェクトを開く
2. **「Settings」** → **「Domains」** を開く
3. **Production URL**を確認（例: `growthlog-web.vercel.app`）

### カスタムドメインの設定（推奨）

他人に共有しやすいURLにするため、カスタムドメインを設定できます：

1. Vercelダッシュボードでプロジェクトを開く
2. **「Settings」** → **「Domains」** を開く
3. **「Add Domain」** をクリック
4. ドメイン名を入力（例: `growthlog.com`）
5. DNS設定を確認（Vercelが自動的に設定方法を表示）
6. DNS設定を反映後、数分待つと自動的にSSL証明書が発行される

**注意**: 
- カスタムドメインにはドメインの所有権が必要です
- 無料のドメインサービス（例: Freenom、.tkドメイン）も使用可能

### プレビューURLを公開する方法

プレビューURLを他人に共有したい場合：

1. Vercelダッシュボードでプロジェクトを開く
2. **「Settings」** → **「General」** を開く
3. **「Deployment Protection」** セクションを確認
4. 必要に応じて設定を変更

**推奨**: 本番環境ではProduction URLまたはカスタムドメインを使用してください。

---

## 運用・管理

### データベースのリセット

開発中にデータベースをリセットする場合：

```bash
cd apps/api
pnpm db:reset
```

**注意**: 本番環境では使用しないでください！

### 管理者権限の付与

ユーザーに管理者権限を付与する場合：

```bash
cd apps/api
pnpm admin:grant <ユーザーID>
```

例：
```bash
pnpm admin:grant yuito
```

### ログの確認

Vercelダッシュボードで：
1. プロジェクトを選択
2. **「Logs」**タブを開く
3. リアルタイムでログを確認

### 環境変数の更新

1. プロジェクト設定 → **「Environment Variables」**
2. 変数を編集または追加
3. **「Save」**をクリック
4. **「Redeploy」**をクリック（変更を反映）

### 継続的デプロイ

GitHubにpushすると、自動的にVercelがデプロイを実行します。

**注意**: 
- データベーススキーマを変更した場合は、手動でマイグレーションを実行してください
- 環境変数を変更した場合は、**「Redeploy」**を実行してください

---

## 📚 関連ドキュメント

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - 詳細なデプロイ手順
- [ENV_CHECKLIST.md](./ENV_CHECKLIST.md) - 環境変数チェックリスト
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計ドキュメント
- [README_DB_RESET.md](./apps/api/README_DB_RESET.md) - データベースリセット方法

---

## ✅ デプロイチェックリスト

デプロイ完了後、以下を確認してください：

- [ ] APIサーバーが正常に動作している（`/health`エンドポイント）
- [ ] フロントエンドが正常に表示される
- [ ] 新規アカウント作成ができる
- [ ] ログインができる
- [ ] データが正しく保存される
- [ ] CORSエラーが発生しない
- [ ] 環境変数がすべて設定されている
- [ ] データベースマイグレーションが実行されている

---

## 🆘 サポート

問題が解決しない場合は：

1. Vercelのログを確認
2. ブラウザの開発者ツール（F12）でエラーを確認
3. GitHubのIssuesで報告

---

**最終更新**: 2025年12月9日

