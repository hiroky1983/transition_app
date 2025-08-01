# Transition App - 日本語ベトナム語単語帳アプリ

日本語の単語をベトナム語に翻訳し、音声付きで学習できる単語帳アプリケーションです。

## 機能概要

### 主要機能
- **日本語→ベトナム語翻訳**: Google Translate APIを使用した高精度翻訳
- **音声合成**: ベトナム語の翻訳結果を音声で再生
- **単語帳保存**: Notion データベースに単語とタグを保存
- **キャッシュ機能**: 一度翻訳した単語はNotionから取得してレスポンス向上
- **音声認識**: 日本語音声をテキストに変換
- **AI会話**: Gemini AIを使用したベトナム語での会話機能

### 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Python FastAPI, Google Cloud Services
- **データベース**: Notion Database
- **インフラ**: Google Cloud Platform, Docker

## アーキテクチャ

```
Frontend (Next.js)
    ↓ HTTP API
Backend (FastAPI)
    ↓
├── Google Cloud Services
│   ├── Translate API
│   ├── Text-to-Speech API  
│   ├── Speech-to-Text API
│   ├── Cloud Storage
│   └── Gemini AI
└── Notion API
    └── Database (単語帳データ)
```

## セットアップ

### 前提条件
- Node.js 18以上
- Python 3.11以上
- Poetry
- Docker & Docker Compose
- Google Cloud Platform アカウント
- Notion アカウントとIntegration

### 環境変数設定

#### サーバー側 (`server/.env`)
```env
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
NOTION_API_KEY=your-notion-integration-key
NOTION_DATABASE_ID=your-notion-database-id
GOOGLE_APPLICATION_CREDENTIALS=./certificates/certificates.json
```

### インストール・起動

#### Docker での起動（推奨）
```bash
# サーバー起動
docker-compose up

# フロントエンド起動（別ターミナル）
cd web
npm install
npm run dev
```

#### ローカル開発
```bash
# バックエンド
cd server
poetry install
poetry run python main.py

# フロントエンド
cd web
npm install
npm run dev
```

## API エンドポイント

### 翻訳・音声関連
- `POST /api/translate` - 日本語をベトナム語に翻訳
- `POST /api/text-to-speech` - ベトナム語テキストを音声に変換
- `POST /api/speech-to-text` - 音声をテキストに変換
- `POST /api/gemini` - AI会話機能

### データ管理
- `POST /api/create-notion` - Notionデータベースに単語を保存

## データ構造

### Notion データベース構造
| プロパティ名 | 型 | 説明 |
|-------------|-----|-----|
| name_vi | Title | ベトナム語（翻訳結果） |
| name_ja | Rich Text | 日本語（元の単語） |
| tag | Multi-select | カテゴリ・タグ |
| audio | Files | 音声ファイル |

## 使用方法

1. **単語翻訳**
   - 日本語の単語を入力
   - 「翻訳」ボタンをクリック
   - ベトナム語翻訳と音声が表示される

2. **単語帳保存** 
   - 翻訳後、タグを入力
   - 「保存」ボタンで Notion データベースに保存

3. **既存単語の確認**
   - 保存済みの単語は自動的にNotionから取得
   - 翻訳APIを使わずに高速表示

## 開発コマンド

### フロントエンド
```bash
cd web
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # ESLint実行
```

### バックエンド
```bash
cd server
poetry run python main.py    # サーバー起動
poetry run ruff check        # リント実行
poetry run ruff format       # コード整形
```

## ライセンス

このプロジェクトはプライベート用途です。