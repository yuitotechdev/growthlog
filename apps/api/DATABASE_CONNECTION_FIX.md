# データベース接続問題の解決方法

## 現在の問題

`db.prisma.io:5432`への接続が失敗しています。これはPrisma Data Platformの接続ですが、認証情報が正しくないか、接続が制限されている可能性があります。

## 解決策

### オプション1: Prisma Data Platformのダッシュボードから接続文字列を取得（推奨）

1. [Prisma Data Platform](https://console.prisma.io/)にログイン
2. プロジェクトを選択
3. **Settings** → **Connection Strings**を開く
4. **Direct Connection**（直接接続）の接続文字列をコピー
5. `.env`ファイルの`DATABASE_URL`を更新

```env
DATABASE_URL="postgres://ユーザー名:パスワード@ホスト:ポート/データベース名?sslmode=require"
```

### オプション2: Vercel Postgresを使用する場合

Vercel Postgresを使用している場合は、以下の環境変数を設定してください：

```env
DATABASE_URL="<POSTGRES_URL_NON_POOLINGの値>"
```

**注意**: マイグレーションには`POSTGRES_URL_NON_POOLING`（非プール接続）を使用する必要があります。

### オプション3: 本番環境でマイグレーションを実行

開発環境での接続問題は、本番環境（Vercel）でマイグレーションを実行することで回避できます。

1. Vercelにデプロイ
2. `build:deploy`スクリプトが自動的にマイグレーションを実行します

## 現在の設定確認

`.env`ファイルに以下が設定されていることを確認してください：

```env
DATABASE_URL="postgres://..."
POSTGRES_URL="postgres://..."
PRISMA_DATABASE_URL="prisma+postgres://..."  # 通常のクエリ用（マイグレーションには使用不可）
```

## 接続テスト

接続をテストするには：

```bash
npx prisma db execute --stdin --schema prisma/schema.prisma
```

または、Prisma Studioで接続を確認：

```bash
npx prisma studio
```

## トラブルシューティング

### エラー: `Can't reach database server at db.prisma.io:5432`

**原因**: 
- 接続文字列が正しくない
- 認証情報が期限切れ
- ネットワーク接続の問題

**解決策**:
1. Prisma Data Platformのダッシュボードから正しい接続文字列を取得
2. 認証情報を更新
3. ファイアウォール設定を確認

### Prisma Accelerateはマイグレーションに使用できない

**注意**: `PRISMA_DATABASE_URL`（Prisma Accelerate）は通常のクエリには使用できますが、マイグレーション（`prisma migrate`）には使用できません。マイグレーションには直接PostgreSQL接続（`DATABASE_URL`）が必要です。

## 次のステップ

1. Prisma Data Platformのダッシュボードから正しい接続文字列を取得
2. `.env`ファイルの`DATABASE_URL`を更新
3. 接続をテスト: `npx prisma db execute --stdin`
4. マイグレーションを実行: `npx prisma migrate deploy`

