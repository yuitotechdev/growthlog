# GrowthLog アーキテクチャ設計ドキュメント

> **最終更新**: 2025年12月9日  
> **対象バージョン**: 現時点の実装ベース

このドキュメントは、GrowthLogプロジェクトの現時点での実装に基づいた設計書です。新しく開発に参加するメンバーや、Vercelへのデプロイ時の参考として活用してください。

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [データベース設計](#3-データベース設計)
4. [ドメイン／機能ごとの構成](#4-ドメイン機能ごとの構成)
5. [API / Server Actions](#5-api--server-actions)
6. [データフローの例](#6-データフローの例)
7. [設定・環境変数](#7-設定環境変数)
8. [今後の改善ポイント](#8-今後の改善ポイント)

---

## 1. プロジェクト概要

### アプリの目的

GrowthLogは、ユーザーが日々の活動を記録し、AIによるフィードバックを受けながら成長を可視化するWebアプリケーションです。

### 主要機能

コードベースから読み取れる主要機能：

- **認証・プロフィール管理**
  - ユーザー登録・ログイン（ユーザーIDまたはメールアドレス + パスワード）
  - プロフィール設定（表示名、ユーザーID、絵文字アイコン）
  - ユーザーIDは1ヶ月に1回のみ変更可能

- **活動ログ記録**
  - 日々の活動を記録（タイトル、カテゴリ、時間、気分、メモ）
  - カテゴリごとの管理（カスタムカテゴリ作成、並び順設定）
  - 活動の編集・削除

- **AIインサイト生成**
  - 指定期間の活動データを分析し、AI（OpenAI）が要約とアドバイスを生成
  - カテゴリフィルタリング対応

- **グループ機能**
  - グループ作成・参加（招待コードまたはユーザーIDで招待）
  - 活動のグループ内共有
  - グループ内チャット
  - メンバー間のランキング表示
  - 共有カテゴリの設定

- **管理者機能**
  - ユーザー管理（一覧、詳細、停止・有効化、管理者権限付与）
  - システムログ閲覧
  - 統計情報（ユーザー数、活動数など）
  - システム設定（AIモデル、トークン数など）

### 想定ユーザー像

※推測：以下のようなユーザーを想定していると推測されます。

- 日々の学習や活動を記録したい個人
- チームやグループで活動を共有し、モチベーションを高めたいユーザー
- AIによるフィードバックで自己成長を加速させたいユーザー

---

## 2. 技術スタック

### フロントエンド

- **Next.js 14.2.33** (App Router)
  - React 18.3.1
  - TypeScript 5.6.3
  - Client Components中心の構成
  - CSS-in-JS（styled-jsx）を使用

### バックエンド

- **Express 4.21.1**
  - TypeScript 5.6.3
  - RESTful API設計
  - JWT認証（jsonwebtoken）
  - CORS対応

### データベース

- **PostgreSQL** (Prisma Postgres)
  - Prisma ORM 5.22.0
  - Prisma Client自動生成

### 共通ライブラリ

- **packages/shared**
  - API Client（`ApiClient`）
  - DTO定義
  - Zodバリデーションスキーマ

### インフラ（想定）

- **Vercel**（デプロイ先想定）
  - サーバーレス関数として動作
  - Vercel Postgres（本番環境）

### その他の主要ライブラリ

- **認証**: bcryptjs（パスワードハッシュ化）
- **AI**: openai（OpenAI API）
- **メール**: resend（本番環境）、nodemailer（開発環境）
- **バリデーション**: zod

---

## 3. データベース設計

### 概要

PrismaスキーマベースのPostgreSQLデータベース。主要なモデルは以下の通りです。

### 主要モデル

#### User（ユーザー）

**役割**: アプリケーションのユーザー情報を管理

**主なフィールド**:
- `id`: String (CUID) - プライマリキー
- `email`: String (unique) - メールアドレス
- `password`: String - ハッシュ化されたパスワード
- `name`: String? - 名前（任意）
- `username`: String? - 表示名
- `uniqueId`: String (unique) - 公開用ユーザーID（例: @user123）
- `avatarEmoji`: String? - プロフィール絵文字
- `uniqueIdChangedAt`: DateTime? - ユーザーID変更日（1ヶ月制限用）
- `emailVerified`: Boolean - メール認証済みフラグ
- `emailVerificationToken`: String? (unique) - メール認証トークン
- `emailVerificationTokenExpires`: DateTime? - トークン有効期限
- `isAdmin`: Boolean - 管理者フラグ
- `isSuspended`: Boolean - 停止フラグ
- `lastLoginAt`: DateTime? - 最終ログイン日時
- `createdAt`, `updatedAt`: DateTime

**関連**:
- `activities`: Activity[] (1対多)
- `insights`: Insight[] (1対多)
- `categories`: Category[] (1対多)
- `ownedGroups`: Group[] (1対多、`GroupOwner`リレーション)
- `groupMemberships`: GroupMember[] (1対多)

#### Category（カテゴリ）

**役割**: ユーザーごとの活動カテゴリを管理

**主なフィールド**:
- `id`: String (CUID)
- `userId`: String - ユーザーID（外部キー）
- `name`: String - カテゴリ名
- `emoji`: String - 絵文字アイコン
- `color`: String - カラーコード（hex）
- `isDefault`: Boolean - デフォルトカテゴリフラグ
- `sortOrder`: Int - 並び順
- `createdAt`, `updatedAt`: DateTime

**関連**:
- `user`: User (多対1)

**制約**:
- `@@unique([userId, name])` - ユーザーごとにカテゴリ名は一意

#### Activity（活動ログ）

**役割**: ユーザーの日々の活動記録

**主なフィールド**:
- `id`: String (CUID)
- `userId`: String - ユーザーID（外部キー）
- `title`: String - 活動タイトル
- `category`: String - カテゴリ名（文字列として保存）
- `durationMinutes`: Int - 活動時間（分）
- `mood`: Int - 気分（1-5）
- `note`: String? - メモ
- `date`: String - 日付（YYYY-MM-DD形式）
- `createdAt`, `updatedAt`: DateTime

**関連**:
- `user`: User (多対1)
- `sharedToGroups`: GroupSharedActivity[] (1対多)

**インデックス**:
- `@@index([userId, date])` - ユーザーと日付での検索最適化

#### Insight（AIインサイト）

**役割**: AIが生成した活動分析結果

**主なフィールド**:
- `id`: String (CUID)
- `userId`: String - ユーザーID（外部キー）
- `summary`: String - 要約
- `advice`: String - アドバイス
- `startDate`: String - 開始日（YYYY-MM-DD）
- `endDate`: String - 終了日（YYYY-MM-DD）
- `category`: String? - カテゴリフィルタ（任意）
- `activityCount`: Int - 分析対象の活動数
- `createdAt`: DateTime

**関連**:
- `user`: User (多対1)

**インデックス**:
- `@@index([userId, createdAt])` - ユーザーと作成日時での検索最適化

#### Group（グループ）

**役割**: ユーザー間で活動を共有するグループ

**主なフィールド**:
- `id`: String (CUID)
- `name`: String - グループ名
- `description`: String? - 説明
- `ownerId`: String - オーナーユーザーID（外部キー）
- `inviteCode`: String (unique) - 招待URL用コード
- `createdAt`, `updatedAt`: DateTime

**関連**:
- `owner`: User (多対1、`GroupOwner`リレーション)
- `members`: GroupMember[] (1対多)
- `sharedCategories`: GroupCategory[] (1対多)
- `sharedActivities`: GroupSharedActivity[] (1対多)
- `groupInsights`: GroupInsight[] (1対多)

#### GroupMember（グループメンバー）

**役割**: グループとユーザーの多対多関係

**主なフィールド**:
- `id`: String (CUID)
- `groupId`: String - グループID（外部キー）
- `userId`: String - ユーザーID（外部キー）
- `role`: String - 役割（'owner' | 'member'）
- `joinedAt`: DateTime - 参加日時

**関連**:
- `group`: Group (多対1)
- `user`: User (多対1)

**制約**:
- `@@unique([groupId, userId])` - 1ユーザーは1グループに1回のみ参加

#### GroupSharedActivity（共有活動）

**役割**: グループに共有された活動

**主なフィールド**:
- `id`: String (CUID)
- `groupId`: String - グループID（外部キー）
- `activityId`: String - 活動ID（外部キー）
- `sharedAt`: DateTime - 共有日時

**関連**:
- `group`: Group (多対1)
- `activity`: Activity (多対1)

**制約**:
- `@@unique([groupId, activityId])` - 1活動は1グループに1回のみ共有

#### GroupMessage（グループチャット）

**役割**: グループ内のチャットメッセージ

**主なフィールド**:
- `id`: String (CUID)
- `groupId`: String - グループID
- `userId`: String - 送信者ユーザーID
- `content`: String - メッセージ内容
- `createdAt`: DateTime

**インデックス**:
- `@@index([groupId, createdAt])` - グループと作成日時での検索最適化

#### SystemLog（システムログ）

**役割**: API使用状況、エラーログなどのシステムログ

**主なフィールド**:
- `id`: String (CUID)
- `type`: String - ログタイプ（'api_call' | 'error' | 'llm_call' | 'auth'）
- `method`: String? - HTTPメソッド
- `path`: String? - APIパス
- `userId`: String? - リクエストしたユーザーID
- `status`: Int? - HTTPステータスコード
- `duration`: Int? - レスポンス時間（ms）
- `message`: String? - エラーメッセージまたは説明
- `metadata`: String? - 追加データ（JSON文字列）
- `createdAt`: DateTime

**インデックス**:
- `@@index([type, createdAt])`
- `@@index([userId, createdAt])`

#### SystemSetting（システム設定）

**役割**: アプリケーションのシステム設定（AIモデル、トークン数など）

**主なフィールド**:
- `id`: String (CUID)
- `key`: String (unique) - 設定キー
- `value`: String - 設定値
- `updatedAt`: DateTime

### ER図イメージ（テキストベース）

```
User 1 ──< Activity (活動ログ)
User 1 ──< Insight (AIインサイト)
User 1 ──< Category (カテゴリ)
User 1 ──< Group (作成したグループ)
User >──< GroupMember >──< Group (グループメンバー)
Group 1 ──< GroupMember
Group 1 ──< GroupCategory (共有カテゴリ)
Group 1 ──< GroupSharedActivity
Group 1 ──< GroupInsight (グループインサイト)
Group 1 ──< GroupMessage (チャット)
Activity 1 ──< GroupSharedActivity
```

---

## 4. ドメイン／機能ごとの構成

### ディレクトリ構造

```
apps/
├── api/                    # バックエンド（Express）
│   └── src/
│       ├── modules/        # 機能別モジュール
│       │   ├── auth/
│       │   ├── profile/
│       │   ├── activity/
│       │   ├── category/
│       │   ├── insight/
│       │   ├── group/
│       │   └── admin/
│       └── common/         # 共通機能
│           ├── config/
│           ├── db/
│           ├── errors/
│           ├── middleware/
│           └── services/
└── web/                    # フロントエンド（Next.js）
    └── src/
        ├── app/            # ページ（App Router）
        ├── components/     # 共通コンポーネント
        └── features/       # 機能別コンポーネント・フック
            ├── auth/
            ├── profile/
            ├── activity/
            ├── category/
            ├── insight/
            ├── group/
            └── admin/
```

### 機能別詳細

#### 1. 認証（Auth）

**関連ページ**:
- `apps/web/src/app/page.tsx` - ホーム（ログイン/サインアップフォーム）

**関連コンポーネント**:
- `apps/web/src/features/auth/components/LoginForm.tsx` - ログインフォーム（Client Component）
- `apps/web/src/features/auth/components/SignUpForm.tsx` - サインアップフォーム（Client Component）

**関連フック**:
- `apps/web/src/features/auth/hooks/useAuth.ts` - 認証状態管理（localStorageでトークン管理）

**API**:
- `POST /api/auth/signup` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/verify-email` - メール認証（※現在は使用されていない可能性）
- `POST /api/auth/resend-verification` - 認証メール再送（※現在は使用されていない可能性）

**バックエンドモジュール**:
- `apps/api/src/modules/auth/`
  - `auth.controller.ts` - ルーティング処理
  - `auth.service.ts` - ビジネスロジック（パスワードハッシュ化、JWT生成）
  - `auth.repository.ts` - データベース操作

#### 2. プロフィール・絵文字（Profile）

**関連ページ**:
- `apps/web/src/app/settings/profile/page.tsx` - プロフィール設定ページ（Client Component）

**関連コンポーネント**:
- 絵文字選択UI（ページ内に実装）

**関連フック**:
- `apps/web/src/features/profile/hooks/useProfile.ts` - プロフィール取得・更新

**API**:
- `GET /api/profile` - プロフィール取得
- `PUT /api/profile` - プロフィール更新（表示名、絵文字）
- `PUT /api/profile/unique-id` - ユーザーID更新
- `GET /api/profile/check-unique-id/:uniqueId` - ユーザーID利用可能性チェック
- `GET /api/users/:uniqueId` - 公開プロフィール取得

**バックエンドモジュール**:
- `apps/api/src/modules/profile/`
  - `profile.controller.ts`
  - `profile.service.ts` - ユーザーID変更制限（1ヶ月に1回）のロジック
  - `profile.repository.ts`

#### 3. 活動ログ（Activity）

**関連ページ**:
- `apps/web/src/app/activities/page.tsx` - 活動一覧ページ（Client Component）

**関連コンポーネント**:
- `apps/web/src/features/activity/components/` - 活動関連コンポーネント

**関連フック**:
- `apps/web/src/features/activity/hooks/useActivities.ts` - 活動取得・作成・更新・削除

**API**:
- `POST /api/activities` - 活動作成
- `GET /api/activities` - ユーザーの活動一覧取得
- `GET /api/activities/:id` - 活動詳細取得
- `PUT /api/activities/:id` - 活動更新
- `DELETE /api/activities/:id` - 活動削除
- `GET /api/activities/:activityId/shared-groups` - 活動が共有されているグループ取得

**バックエンドモジュール**:
- `apps/api/src/modules/activity/`
  - `activity.controller.ts`
  - `activity.service.ts`
  - `activity.repository.ts`

#### 4. カテゴリ（Category）

**関連ページ**:
- `apps/web/src/app/settings/categories/page.tsx` - カテゴリ設定ページ

**関連コンポーネント**:
- `apps/web/src/features/category/components/` - カテゴリ関連コンポーネント

**関連フック**:
- `apps/web/src/features/category/hooks/useCategories.ts` - カテゴリ取得・作成・更新・削除・並び替え

**API**:
- `GET /api/categories` - カテゴリ一覧取得
- `POST /api/categories` - カテゴリ作成
- `PUT /api/categories/reorder` - カテゴリ並び替え
- `GET /api/categories/:id` - カテゴリ詳細取得
- `PUT /api/categories/:id` - カテゴリ更新
- `DELETE /api/categories/:id` - カテゴリ削除

**バックエンドモジュール**:
- `apps/api/src/modules/category/`
  - `category.controller.ts`
  - `category.service.ts`
  - `category.repository.ts`

#### 5. インサイト（Insight）

**関連ページ**:
- `apps/web/src/app/insights/page.tsx` - インサイト一覧ページ（Client Component）

**関連コンポーネント**:
- `apps/web/src/features/insight/components/` - インサイト関連コンポーネント

**関連フック**:
- `apps/web/src/features/insight/hooks/useInsights.ts` - インサイト取得・生成・削除

**API**:
- `POST /api/insights` - インサイト生成（OpenAI API呼び出し）
- `GET /api/insights` - ユーザーのインサイト一覧取得
- `GET /api/insights/:id` - インサイト詳細取得
- `DELETE /api/insights/:id` - インサイト削除

**バックエンドモジュール**:
- `apps/api/src/modules/insight/`
  - `insight.controller.ts`
  - `insight.service.ts` - OpenAI API呼び出しロジック
  - `insight.repository.ts`

#### 6. グループ（Group）

**関連ページ**:
- `apps/web/src/app/groups/page.tsx` - グループ一覧ページ（Client Component）
- `apps/web/src/app/groups/[groupId]/page.tsx` - グループ詳細ページ（Client Component）
- `apps/web/src/app/groups/join/[inviteCode]/page.tsx` - 招待コードで参加するページ

**関連コンポーネント**:
- `apps/web/src/features/group/components/` - グループ関連コンポーネント

**関連フック**:
- `apps/web/src/features/group/hooks/useGroups.ts` - グループ取得・作成・参加・退出・削除

**API（グループ管理）**:
- `GET /api/groups` - 自分のグループ一覧取得
- `POST /api/groups` - グループ作成
- `GET /api/groups/invite/:inviteCode` - 招待コードでグループ情報取得
- `POST /api/groups/join/:inviteCode` - 招待コードで参加
- `GET /api/groups/:groupId` - グループ詳細取得
- `PUT /api/groups/:groupId` - グループ更新
- `DELETE /api/groups/:groupId` - グループ削除
- `PUT /api/groups/:groupId/categories` - 共有カテゴリ更新
- `POST /api/groups/:groupId/invite` - ユーザーIDで招待
- `POST /api/groups/:groupId/leave` - グループ退出
- `DELETE /api/groups/:groupId/members/:memberId` - メンバー削除
- `POST /api/groups/:groupId/regenerate-invite` - 招待コード再生成

**API（共有活動）**:
- `POST /api/shared-activities` - 活動をグループに共有
- `DELETE /api/shared-activities` - 活動の共有を解除
- `GET /api/groups/:groupId/activities` - グループの共有活動一覧取得
- `GET /api/groups/:groupId/member-summaries` - メンバーサマリー取得
- `GET /api/groups/:groupId/rankings` - メンバーランキング取得

**API（チャット）**:
- `GET /api/groups/:groupId/messages` - グループメッセージ一覧取得
- `POST /api/groups/:groupId/messages` - メッセージ送信
- `DELETE /api/messages/:messageId` - メッセージ削除

**バックエンドモジュール**:
- `apps/api/src/modules/group/`
  - `group.controller.ts` - グループ管理
  - `group.service.ts`
  - `group.repository.ts`
  - `shared-activity.controller.ts` - 共有活動
  - `shared-activity.service.ts`
  - `shared-activity.repository.ts`
  - `chat.controller.ts` - チャット
  - `chat.service.ts`
  - `chat.repository.ts`

#### 7. 管理者（Admin）

**関連ページ**:
- `apps/web/src/app/admin/page.tsx` - 管理者ダッシュボード
- `apps/web/src/app/admin/users/page.tsx` - ユーザー管理
- `apps/web/src/app/admin/logs/page.tsx` - ログ閲覧
- `apps/web/src/app/admin/analytics/page.tsx` - 統計情報
- `apps/web/src/app/admin/settings/page.tsx` - システム設定

**関連コンポーネント**:
- `apps/web/src/app/admin/layout.tsx` - 管理者レイアウト（認証チェック）

**関連フック**:
- `apps/web/src/features/admin/hooks/` - 管理者機能用フック

**API**:
- `GET /api/admin/users` - ユーザー一覧取得
- `GET /api/admin/users/:id` - ユーザー詳細取得
- `POST /api/admin/users/:id/suspend` - ユーザー停止
- `POST /api/admin/users/:id/activate` - ユーザー有効化
- `POST /api/admin/users/:id/toggle-admin` - 管理者権限切り替え
- `DELETE /api/admin/users/:id` - ユーザー削除
- `GET /api/admin/stats/overview` - 統計概要取得
- `GET /api/admin/stats/activities` - 活動統計取得
- `GET /api/admin/logs` - ログ一覧取得
- `GET /api/admin/logs/stats` - ログ統計取得
- `GET /api/admin/settings` - システム設定一覧取得
- `PUT /api/admin/settings/:key` - システム設定更新
- `DELETE /api/admin/settings/:key` - システム設定削除

**バックエンドモジュール**:
- `apps/api/src/modules/admin/`
  - `admin.controller.ts`
  - `admin.service.ts`
  - `admin.repository.ts`

**認証**:
- `adminMiddleware` - 管理者権限チェック（`isAdmin`フラグを確認）

---

## 5. API / Server Actions

### 認証系

#### `POST /api/auth/signup`
- **役割**: 新規ユーザー登録
- **主に利用するPrismaモデル**: `User`
- **バリデーション**: 
  - メールアドレス、パスワード、ユーザーID必須
  - ユーザーIDは3〜20文字、英数字とアンダースコアのみ
  - メールアドレス、ユーザーIDの重複チェック
- **エラーハンドリング**: `ConflictError`（重複時）、`BadRequestError`（バリデーションエラー）

#### `POST /api/auth/login`
- **役割**: ユーザーログイン
- **主に利用するPrismaモデル**: `User`
- **バリデーション**: ユーザーIDまたはメールアドレス + パスワード必須
- **エラーハンドリング**: `UnauthorizedError`（認証失敗時）

### プロフィール系

#### `GET /api/profile`
- **役割**: 現在のユーザーのプロフィール取得
- **主に利用するPrismaモデル**: `User`
- **認証**: 必須（`authMiddleware`）

#### `PUT /api/profile`
- **役割**: プロフィール更新（表示名、絵文字）
- **主に利用するPrismaモデル**: `User`
- **バリデーション**: 
  - 表示名は1〜50文字
  - 絵文字は10文字以内
- **認証**: 必須

#### `PUT /api/profile/unique-id`
- **役割**: ユーザーID更新
- **主に利用するPrismaモデル**: `User`
- **バリデーション**: 
  - ユーザーIDは3〜20文字、英数字とアンダースコアのみ
  - 重複チェック
  - 1ヶ月以内に変更していないかチェック
- **認証**: 必須

### 活動ログ系

#### `POST /api/activities`
- **役割**: 活動ログ作成
- **主に利用するPrismaモデル**: `Activity`
- **バリデーション**: タイトル、カテゴリ、時間、気分、日付必須
- **認証**: 必須

#### `GET /api/activities`
- **役割**: ユーザーの活動一覧取得
- **主に利用するPrismaモデル**: `Activity`
- **認証**: 必須

#### `PUT /api/activities/:id`
- **役割**: 活動ログ更新
- **主に利用するPrismaモデル**: `Activity`
- **バリデーション**: 所有者チェック（自分の活動のみ更新可能）
- **認証**: 必須

#### `DELETE /api/activities/:id`
- **役割**: 活動ログ削除
- **主に利用するPrismaモデル**: `Activity`
- **バリデーション**: 所有者チェック
- **認証**: 必須

### インサイト系

#### `POST /api/insights`
- **役割**: AIインサイト生成
- **主に利用するPrismaモデル**: `Activity`, `Insight`
- **外部API**: OpenAI API呼び出し
- **バリデーション**: 開始日・終了日必須
- **認証**: 必須

### グループ系

#### `POST /api/groups`
- **役割**: グループ作成
- **主に利用するPrismaモデル**: `Group`, `GroupMember`, `GroupCategory`
- **バリデーション**: グループ名、共有カテゴリ必須
- **認証**: 必須

#### `POST /api/groups/join/:inviteCode`
- **役割**: 招待コードでグループ参加
- **主に利用するPrismaモデル**: `Group`, `GroupMember`
- **バリデーション**: 既に参加していないかチェック
- **認証**: 必須

#### `POST /api/shared-activities`
- **役割**: 活動をグループに共有
- **主に利用するPrismaモデル**: `GroupSharedActivity`, `Activity`, `GroupMember`
- **バリデーション**: グループメンバーであること、既に共有されていないこと
- **認証**: 必須

#### `GET /api/groups/:groupId/rankings`
- **役割**: グループメンバーのランキング取得
- **主に利用するPrismaモデル**: `GroupSharedActivity`, `GroupMember`, `User`
- **認証**: 必須

### 管理者系

#### `GET /api/admin/users`
- **役割**: ユーザー一覧取得（ページネーション対応）
- **主に利用するPrismaモデル**: `User`
- **認証**: 必須（`authMiddleware` + `adminMiddleware`）

#### `POST /api/admin/users/:id/suspend`
- **役割**: ユーザー停止
- **主に利用するPrismaモデル**: `User`
- **認証**: 必須（管理者のみ）

---

## 6. データフローの例

### 例1: プロフィール絵文字を変更する

1. **ユーザー操作**
   - プロフィール設定ページ（`/settings/profile`）で絵文字を選択
   - 「保存」ボタンをクリック

2. **フロント側コンポーネント**
   - `apps/web/src/app/settings/profile/page.tsx`
   - `handleSaveEmoji`関数が実行される
   - `useProfile`フックの`updateProfile`を呼び出し

3. **呼ばれるAPI**
   - `PUT /api/profile`
   - リクエストボディ: `{ avatarEmoji: "😀" }`
   - ヘッダー: `Authorization: Bearer <JWT_TOKEN>`

4. **バックエンド処理**
   - `authMiddleware`で認証チェック
   - `ProfileController.updateProfile`が実行
   - `ProfileService.updateProfile`でバリデーション（絵文字10文字以内）
   - `ProfileRepository.updateProfile`でデータベース更新

5. **更新されるDBモデル**
   - `User.avatarEmoji`フィールドが更新される

6. **レスポンス**
   - 更新されたプロフィール情報が返される
   - フロントエンドで状態が更新され、UIに反映

### 例2: 活動ログを登録する

1. **ユーザー操作**
   - 活動一覧ページ（`/activities`）で「新規作成」をクリック
   - フォームに入力（タイトル、カテゴリ、時間、気分、メモ、日付）
   - 「保存」ボタンをクリック

2. **フロント側コンポーネント**
   - `apps/web/src/app/activities/page.tsx`または関連コンポーネント
   - `useActivities`フックの`createActivity`を呼び出し

3. **呼ばれるAPI**
   - `POST /api/activities`
   - リクエストボディ: `{ title, category, durationMinutes, mood, note, date }`
   - ヘッダー: `Authorization: Bearer <JWT_TOKEN>`

4. **バックエンド処理**
   - `authMiddleware`で認証チェック
   - `ActivityController.create`が実行
   - `ActivityService.create`でバリデーション
   - `ActivityRepository.create`でデータベースに保存

5. **更新されるDBモデル**
   - 新しい`Activity`レコードが作成される
   - `userId`が現在のユーザーIDに設定される

6. **レスポンス**
   - 作成された活動情報が返される
   - フロントエンドで一覧に追加表示

### 例3: グループに活動を共有する

1. **ユーザー操作**
   - グループ詳細ページ（`/groups/[groupId]`）で活動を選択
   - 「共有」ボタンをクリック

2. **フロント側コンポーネント**
   - `apps/web/src/app/groups/[groupId]/page.tsx`
   - 共有処理を実行

3. **呼ばれるAPI**
   - `POST /api/shared-activities`
   - リクエストボディ: `{ activityId, groupId }`
   - ヘッダー: `Authorization: Bearer <JWT_TOKEN>`

4. **バックエンド処理**
   - `authMiddleware`で認証チェック
   - `SharedActivityController.shareActivity`が実行
   - `SharedActivityService.shareActivity`で以下をチェック:
     - 活動の所有者が現在のユーザーであること
     - グループのメンバーであること
     - 既に共有されていないこと
   - `SharedActivityRepository.create`で`GroupSharedActivity`レコードを作成

5. **更新されるDBモデル**
   - 新しい`GroupSharedActivity`レコードが作成される

6. **レスポンス**
   - 共有成功のレスポンスが返される
   - フロントエンドでグループの共有活動一覧に追加表示

---

## 7. 設定・環境変数

### バックエンド（`apps/api/.env`）

#### 必須環境変数

- `DATABASE_URL` - PostgreSQL接続文字列
  - 例: `postgres://user:password@host:port/database?sslmode=require`
  - 本番環境: Vercel Postgresの接続文字列

- `JWT_SECRET` - JWTトークンの署名用シークレット
  - 本番環境では強力なランダム文字列を設定すること

- `OPENAI_API_KEY` - OpenAI APIキー
  - インサイト生成に使用

#### オプション環境変数

- `PORT` - サーバーポート（デフォルト: 3001）
- `NODE_ENV` - 環境（'development' | 'production'）
- `FRONTEND_URL` - フロントエンドURL（デフォルト: http://localhost:3000）
- `RESEND_API_KEY` - Resend APIキー（メール送信用、本番環境推奨）
- `POSTGRES_URL` - PostgreSQL接続文字列（Vercel Postgres用、`DATABASE_URL`と同じ値）
- `PRISMA_DATABASE_URL` - Prisma Accelerate用（オプション）

### フロントエンド（`apps/web/.env.local`）

#### 必須環境変数

- `NEXT_PUBLIC_API_URL` - APIサーバーのURL
  - 開発環境: `http://localhost:3001`
  - 本番環境: VercelのAPI URL

### 本番デプロイ（Vercel）での重要設定

1. **環境変数の設定**
   - Vercelダッシュボードで以下を設定:
     - `DATABASE_URL`（Vercel Postgresの接続文字列）
     - `JWT_SECRET`（強力なランダム文字列）
     - `OPENAI_API_KEY`
     - `RESEND_API_KEY`（メール送信が必要な場合）
     - `NEXT_PUBLIC_API_URL`（フロントエンド側）

2. **Vercel Postgresのセットアップ**
   - Vercelダッシュボード → Storage → Create Database → Postgres
   - Hobbyプラン（無料）: 256MBまで
   - 接続文字列を`DATABASE_URL`に設定

3. **Prismaマイグレーション**
   - デプロイ時に自動実行される（`vercel.json`で設定されている場合）
   - または手動で`pnpm prisma migrate deploy`を実行

---

## 8. 今後の改善ポイント

コードを読んで気づいた設計上の改善候補を以下にまとめます。

### 命名の統一

- **現状**: 一部で命名が統一されていない可能性
  - 例: `uniqueId`と`userId`の使い分けが明確でない箇所がある
- **提案**: 命名規則をドキュメント化し、コードレビューで確認

### バリデーションの強化

- **現状**: 一部のAPIでバリデーションが不十分な可能性
  - 例: 活動ログの`mood`が1-5の範囲外の場合のチェック
  - 例: 日付形式の厳密なチェック
- **提案**: Zodスキーマを全APIで統一使用

### N+1クエリの可能性

- **現状**: 一部のクエリでN+1が発生している可能性
  - 例: グループ一覧取得時にメンバー情報を個別に取得している可能性
- **提案**: Prismaの`include`や`select`を適切に使用し、必要に応じて`Promise.all`で並列化

### エラーハンドリングの統一

- **現状**: エラーレスポンスの形式が一部で統一されていない可能性
- **提案**: `HttpError`クラスを全APIで統一使用

### データベースインデックス追加候補

- **現状**: 基本的なインデックスは設定済み
- **提案**: 
  - `GroupMessage.userId`にインデックス追加（ユーザーごとのメッセージ検索）
  - `Activity.category`にインデックス追加（カテゴリ検索の高速化）

### セキュリティ強化

- **現状**: JWT認証は実装済み
- **提案**: 
  - レート制限の実装（API呼び出し頻度制限）
  - CORS設定の見直し（本番環境で特定ドメインのみ許可）

### パフォーマンス最適化

- **現状**: 基本的な最適化は実装済み
- **提案**: 
  - インサイト生成時のキャッシュ（同じ期間・カテゴリの場合は再生成不要）
  - ページネーションの統一（全一覧取得APIで実装）

### 型安全性の向上

- **現状**: TypeScriptは使用されているが、一部で`any`型が使用されている可能性
- **提案**: 厳密な型定義を徹底

### テストの追加

- **現状**: テストファイルが一部のみ存在（`insight/__tests__`）
- **提案**: 
  - 主要なAPIエンドポイントのユニットテスト
  - 統合テストの追加

### ドキュメント化

- **現状**: このドキュメントが初版
- **提案**: 
  - API仕様書（OpenAPI/Swagger）の追加
  - コンポーネントのStorybook化

---

## このドキュメントの読み方

1. **新規開発者向け**: まず「プロジェクト概要」「技術スタック」「データベース設計」を読んで全体像を把握
2. **機能開発時**: 「ドメイン／機能ごとの構成」と「API / Server Actions」を参照
3. **デプロイ時**: 「設定・環境変数」を参照
4. **リファクタリング時**: 「今後の改善ポイント」を参考に

## 今後更新するときの指針

- **実装変更時**: 該当セクションを必ず更新
- **新機能追加時**: 「ドメイン／機能ごとの構成」「API / Server Actions」に追加
- **データベース変更時**: 「データベース設計」を更新し、マイグレーション情報も追記
- **定期的な見直し**: 四半期ごとに「今後の改善ポイント」を見直し、実装済み項目を削除

---

**注意**: このドキュメントは現時点の実装に基づいています。コードと異なる場合は、コードを優先してください。

