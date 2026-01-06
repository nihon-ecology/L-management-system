# LP Builder

代理店別計測タグを自動挿入してLPを生成するビルドシステムです。

## 🚀 クイックスタート

```bash
# 依存関係のインストール
npm install

# 全LP生成（本番用 + テスト用）
npm run build

# 本番用のみ生成
npm run build:prod

# テスト用のみ生成  
npm run build:test
```

## 📁 ディレクトリ構成

```
LP/
├── config/                 # 設定ファイル
│   ├── agencies.json       # 代理店別計測タグ設定
│   ├── regions.json        # 地域別設定（電話番号等）
│   └── lp-types.json       # LP種類の定義
│
├── src/                    # ソースファイル
│   ├── templates/          # EJSテンプレート
│   │   ├── partials/       # 共通パーツ（計測タグ等）
│   │   └── pages/          # LP種類別テンプレート
│   └── assets/             # 静的資産（CSS/画像/JS）
│       └── {lp-type}/
│
├── scripts/                # ビルドスクリプト
│   └── build.js
│
├── dist/                   # 生成物（Git管理外）
│   ├── prod/               # 本番用
│   │   └── {lp-type}/{region}/{agency}/
│   └── test/               # テスト用（計測タグ無効）
│
└── .github/workflows/      # CI/CD設定
    └── lp-build.yml
```

## 🔧 npm scripts

| コマンド | 説明 |
|---------|------|
| `npm run build` | 全LP生成（prod + test） |
| `npm run build:prod` | 本番用のみ生成 |
| `npm run build:test` | テスト用のみ生成 |
| `npm run build -- --lp tokyo-subsidy` | 特定LP種類のみ生成 |
| `npm run build -- --agency A8` | 特定代理店のみ生成 |
| `npm run clean` | dist/ディレクトリを削除 |

## 📝 新代理店の追加方法

1. `config/agencies.json` に代理店情報を追加
2. `config/lp-types.json` の該当LPに代理店を追加
3. `npm run build` を実行

## 🧪 テスト環境について

`dist/test/` に出力されるHTMLは以下の対策が適用されています：

- `<meta name="robots" content="noindex, nofollow">` が自動付与
- 全ての計測タグ（Meta Pixel/Google Ads/Yahoo/GTM等）が無効化
- 計測汚染が発生しない安全なプレビュー環境

## 🔄 CI/CD（GitHub Actions）

| ブランチ | 動作 |
|---------|------|
| `main` | 本番用ビルド → 本番サーバーへデプロイ |
| `develop` | テスト用ビルド → ステージングへデプロイ |
| Pull Request | ビルド検証のみ（デプロイなし） |

## ⚠️ 注意事項

- `dist/` はGit管理対象外です（ビルドで生成）
- 機密情報は `.env` または GitHub Secrets で管理してください
- 既存のLPフォルダ（`東京都補助金LP/`等）は参照用として残っています
