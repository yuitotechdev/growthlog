# 命名規則

## ユーザー識別子の使い分け

### `userId` (String, CUID)
- **用途**: 内部的なユーザー識別子（データベースの主キー）
- **使用箇所**: 
  - データベースの外部キー（`Activity.userId`, `Group.ownerId`など）
  - 認証トークン（JWT）のペイロード
  - リポジトリ・サービス層でのユーザー検索
- **特徴**: 
  - 自動生成される（CUID形式）
  - 変更不可
  - ユーザーには公開しない（セキュリティ上の理由）

### `uniqueId` (String, 3-20文字)
- **用途**: 公開用ユーザー識別子（@username形式）
- **使用箇所**:
  - ユーザープロフィールの公開URL（`/users/:uniqueId`）
  - グループへの招待（`inviteByUniqueId`）
  - ログイン時の識別子（メールアドレスまたはuniqueId）
- **特徴**:
  - ユーザーが設定可能
  - 1ヶ月に1回のみ変更可能
  - 英数字とアンダースコアのみ（正規表現: `/^[a-zA-Z0-9_]{3,20}$/`）
  - 一意性が保証される（`@unique`制約）

## 命名規則の例

### 良い例
```typescript
// データベース操作
async findByUserId(userId: string) { ... }
async findByUniqueId(uniqueId: string) { ... }

// APIエンドポイント
GET /api/users/:uniqueId  // 公開プロフィール
GET /api/profile          // 自分のプロフィール（userIdを使用）
```

### 悪い例
```typescript
// ❌ 混同している
async findByUserId(uniqueId: string) { ... }
async findByUniqueId(userId: string) { ... }
```

