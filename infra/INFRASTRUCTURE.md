# インフラ構成図

## 全体アーキテクチャ

```
┌─────────────────┐
│     Users       │
└─────────┬───────┘
          │ Web Access
          ▼
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   localhost:3000│
└─────────┬───────┘
          │ HTTP API
          ▼
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Platform                      │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐│
│  │   Cloud Run     │    │     Artifact Registry       ││
│  │ transion-app-   │◄───┤   (server repository)       ││
│  │   server        │    │                             ││
│  │ asia-northeast1 │    └─────────────────────────────┘│
│  └─────────┬───────┘                                   │
│            │                                           │
│  ┌─────────┼─────────────────────────────────────────┐ │
│  │         ▼        Google APIs                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │ │
│  │  │ Translate   │ │Text-to-Speech│ │  Gemini AI  │  │ │
│  │  │    API      │ │     API     │ │     API     │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Cloud Storage                          │ │
│  │  ┌─────────────────┐  ┌─────────────────────────┐  │ │
│  │  │ Terraform State │  │     Audio Files         │  │ │
│  │  │     Bucket      │  │       Bucket            │  │ │
│  │  │ [project]-tfstate│  │   [project]-audio       │  │ │
│  │  └─────────────────┘  └─────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          │
          │ Query/Create Vocabulary
          ▼
┌─────────────────┐
│ Notion Database │
│  (Vocabulary)   │
└─────────────────┘
```

## リソース詳細

### Google Cloud Platform リソース

#### 1. Cloud Run Service
- **名前**: `transion-app-server`
- **リージョン**: `asia-northeast1`
- **イメージ**: `asia-northeast1-docker.pkg.dev/${project_id}/server/server`
- **アクセス**: すべてのトラフィック許可
- **用途**: FastAPI サーバーのホスティング

#### 2. Artifact Registry
- **名前**: `server`
- **リージョン**: `asia-northeast1`
- **フォーマット**: `DOCKER`
- **用途**: サーバーのDockerイメージ保存

#### 3. Cloud Storage Buckets

##### Terraform State Bucket
- **名前**: `${project_id}-tfstate`
- **リージョン**: `asia-northeast1`
- **用途**: Terraformの状態ファイル管理
- **権限**: `roles/storage.admin` (hirockysan1983@gmail.com)

##### Audio Files Bucket
- **名前**: `${project_id}-audio`
- **リージョン**: `asia-northeast1`
- **用途**: 音声ファイルの保存
- **権限**: `roles/storage.admin` (hirockysan1983@gmail.com)

### 外部サービス連携

#### Google APIs
- **Translate API**: 日本語→ベトナム語翻訳
- **Text-to-Speech API**: ベトナム語音声合成
- **Speech-to-Text API**: 音声認識（コードで使用）
- **Gemini AI API**: 会話機能

#### Notion API
- **用途**: 単語帳データベースの管理
- **機能**: 
  - 既存単語の検索
  - 新規単語の保存
  - 音声ファイルURL、タグの管理

## データフロー

1. **ユーザーアクセス**
   - ユーザー → Frontend (Next.js)
   - Frontend → Cloud Run (HTTP API)

2. **翻訳処理**
   - Cloud Run → Notion API (キャッシュ確認)
   - キャッシュなし → Google Translate API
   - 翻訳結果 → Text-to-Speech API (音声生成)

3. **データ保存**
   - 音声データ → Cloud Storage (Audio Bucket)
   - 単語データ → Notion Database

4. **デプロイメント**
   - Docker Image → Artifact Registry
   - Artifact Registry → Cloud Run (デプロイ)

## セキュリティ

- **認証**: Google Cloud認証
- **権限**: 最小権限の原則
- **ネットワーク**: Cloud Run はパブリックアクセス
- **データ**: 音声ファイルは署名付きURL（7日間有効）

## 運用・監視

- **Terraform State**: Cloud Storageで管理
- **ログ**: Cloud Run標準ログ
- **リージョン**: asia-northeast1 (東京)
- **スケーリング**: Cloud Run自動スケーリング