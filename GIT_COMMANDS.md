# Gitコマンド集 - GitHubプッシュ手順

このドキュメントは、GitHubにプッシュするまでの基本的なコマンドをまとめたものです。

## 📋 基本的な流れ

```bash
# 1. 変更をステージング
git add .

# 2. コミット
git commit -m "コミットメッセージ"

# 3. GitHubにプッシュ
git push origin main
```

## 🚀 よく使うコマンド

### 変更状況の確認

```bash
# 変更されたファイルを確認
git status

# 変更内容を確認
git diff

# 変更されたファイル名のみ確認
git status --short
```

### ファイルの追加

```bash
# すべての変更を追加
git add .

# 特定のファイルを追加
git add apps/web/src/app/page.tsx

# 複数のファイルを追加
git add apps/web/src/app/page.tsx apps/api/src/index.ts
```

### コミット

```bash
# コミットメッセージを指定してコミット
git commit -m "機能追加: ユーザー停止機能を実装"

# 例: バグ修正
git commit -m "Fix: ユーザー停止機能の修正"

# 例: 新機能追加
git commit -m "Add: システムログ機能を実装"
```

### プッシュ

```bash
# mainブランチにプッシュ
git push origin main

# 初回プッシュの場合（ブランチを設定）
git push -u origin main
```

## 📝 コミットメッセージの例

### 機能追加
```bash
git commit -m "Add: システムログ機能を実装"
git commit -m "Add: ユーザー停止機能を追加"
```

### バグ修正
```bash
git commit -m "Fix: ユーザー停止機能の修正"
git commit -m "Fix: システムログが404エラーになる問題を修正"
```

### 改善
```bash
git commit -m "Improve: エラーハンドリングを改善"
git commit -m "Improve: ダッシュボードのプロンプト表示を改善"
```

### 削除
```bash
git commit -m "Remove: グループ作成フォームの不要な入力欄を削除"
```

### 複数の変更をまとめる
```bash
git commit -m "Fix: ユーザー停止機能とシステムログ機能を実装"
```

## 🔄 よくある操作

### 変更を取り消す

```bash
# ステージングを取り消す（ファイルは変更されたまま）
git reset HEAD <ファイル名>

# 変更を取り消す（注意: 変更が失われます）
git checkout -- <ファイル名>
```

### 直前のコミットを修正

```bash
# コミットメッセージを変更
git commit --amend -m "新しいメッセージ"

# ファイルを追加してコミットを修正
git add <ファイル名>
git commit --amend --no-edit
```

### ブランチの確認

```bash
# 現在のブランチを確認
git branch

# すべてのブランチを確認
git branch -a
```

## ⚠️ 注意事項

1. **コミット前に確認**: `git status`で変更内容を確認してからコミット
2. **意味のあるメッセージ**: コミットメッセージは変更内容が分かるように記述
3. **小さなコミット**: 関連する変更をまとめて、小さな単位でコミット
4. **プッシュ前の確認**: プッシュ前に`git log`でコミット履歴を確認

## 🎯 実践例

### 例1: 新機能を追加した場合

```bash
# 1. 変更を確認
git status

# 2. 変更を追加
git add .

# 3. コミット
git commit -m "Add: システムログ機能を実装"

# 4. プッシュ
git push origin main
```

### 例2: バグ修正した場合

```bash
# 1. 特定のファイルのみ追加
git add apps/api/src/common/middleware/auth.middleware.ts

# 2. コミット
git commit -m "Fix: ユーザー停止機能の修正"

# 3. プッシュ
git push origin main
```

### 例3: 複数の変更をまとめる場合

```bash
# 1. すべての変更を追加
git add .

# 2. コミット（複数の変更をまとめて記述）
git commit -m "Fix: ユーザー停止機能とシステムログ機能を実装

- 認証ミドルウェアでisSuspendedをチェック
- ログミドルウェアでデータベースに保存
- LLM呼び出しログを追加"

# 3. プッシュ
git push origin main
```

## 🔗 関連ドキュメント

- [GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md) - GitHub → Vercel デプロイ手順
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - デプロイ前チェックリスト

