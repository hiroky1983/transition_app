# 日本語-ベトナム語学習アプリケーション仕様書

## 概要

本アプリケーションは、日本語学習者がベトナム語を効率的に学習するためのマルチプラットフォーム対応学習支援システムです。翻訳機能、単語帳管理、AI 会話練習の 3 つの主要機能を提供し、Web 版とモバイル版（React Native）の両方で利用可能です。

## システム構成

### アーキテクチャ

- **フロントエンド**: Next.js (Web), React Native/Expo (Mobile)
- **バックエンド**: FastAPI (Python)
- **データベース**: Notion Database
- **AI/ML サービス**: Google Cloud (Translation, Speech-to-Text, Text-to-Speech, Gemini AI)
- **音声ストレージ**: Google Cloud Storage

### 技術スタック

- **Web**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile**: React Native, Expo, TypeScript
- **Backend**: FastAPI, Python 3.11+
- **外部サービス**: Google Cloud AI Platform, Notion API

## 主要機能

## 翻訳

### 機能概要

日本語の単語やフレーズをベトナム語に翻訳し、音声付きで学習できる機能です。翻訳結果は自動的にタグ付けして Notion データベースに保存できます。

### 機能詳細

#### 基本翻訳機能

- **入力**: 日本語テキスト（単語・フレーズ）
- **出力**: ベトナム語翻訳結果
- **音声合成**: 翻訳結果の音声再生（ベトナム語音声）
- **既存データ検索**: 過去に翻訳済みの単語は Notion から取得

#### データ保存機能

- **タグ付け**: 複数タグの選択・新規作成
- **自動保存**: 翻訳結果を Notion データベースに保存
- **重複チェック**: 既存データがある場合は既存情報を表示

#### ユーザーインターフェース

**Web 版**

- 単一入力フィールド（日本語）
- 翻訳ボタン
- 結果表示エリア（ベトナム語 + 音声プレーヤー）
- マルチセレクトタグ選択
- 保存ボタン

**モバイル版**

- ネイティブテキスト入力
- タッチ操作対応のタグ選択
- 音声再生ボタン
- レスポンシブデザイン

#### API 仕様

```
POST /api/translate
Request: { "text": "こんにちは" }
Response: { "translatedText": "Xin chào" } | { "translatedText": "Xin chào", "tag": "日常会話", "name_ja": "こんにちは" }

POST /api/text-to-speech
Request: { "translatedText": "Xin chào" }
Response: { "audioContent": "base64_encoded_audio" }

POST /api/create-notion
Request: { "title": "Xin chào", "name_ja": "こんにちは", "genre": "日常会話" }
Response: { "status": "OK", "response": {...} }
```

## 単語帳

### 機能概要

保存された翻訳データを一覧表示し、検索・フィルタリング機能を提供する単語帳システムです。学習進捗の確認と復習に活用できます。

### 機能詳細

#### 一覧表示機能

- **データ取得**: Notion データベースから全単語を取得
- **カード表示**: 日本語・ベトナム語・タグをカード形式で表示
- **統計情報**: 総単語数・表示中の単語数を表示

#### 検索・フィルタリング機能

- **リアルタイム検索**: 入力に応じて即座にフィルタリング
- **多言語対応**: 日本語・ベトナム語・タグでの検索
- **部分一致**: 大文字小文字を区別しない部分一致検索

#### データ構造

```typescript
type VocabularyItem = {
  id: string;
  name_ja: string; // 日本語
  name_vi: string; // ベトナム語
  tag: string; // カテゴリタグ
};
```

#### ユーザーインターフェース

**Web 版**

- サーバーサイドレンダリング（SSR）でのデータ取得
- 検索バー（アイコン付き）
- グリッドレイアウト（レスポンシブ）
- 統計情報バー
- 新規追加へのリンク

**モバイル版**

- ネイティブ FlatList 使用
- プルトゥリフレッシュ対応
- ローディング状態表示
- エラーハンドリング

#### API 仕様

```
GET /api/vocabulary-list
Response: {
  "vocabulary_list": [VocabularyItem[]],
  "total_count": number
}

GET /api/tags
Response: {
  "tags": string[],
  "total_count": number
}
```

## 会話練習

### 機能概要

AI（Google Gemini）を活用したベトナム語会話練習機能です。音声入力・音声認識・AI 応答を組み合わせた対話型学習システムを提供します。

### 機能詳細

#### 音声入力機能

- **音声録音**: ブラウザ/モバイルのマイク機能を使用
- **音声認識**: Google Speech-to-Text API でベトナム語音声をテキスト化
- **編集機能**: 認識結果の手動編集が可能
- **録音状態管理**: アイドル・録音中・処理中の状態表示

#### AI 会話機能

- **AI 応答**: Google Gemini API を使用したベトナム語での応答生成
- **会話履歴**: ユーザーと AI の会話を時系列で保存・表示
- **コンテキスト保持**: 会話の文脈を考慮した自然な応答

#### 音声出力機能（予定）

- **Text-to-Speech**: AI 応答の音声化
- **音声再生**: ベトナム語の正しい発音学習

#### ユーザーインターフェース

**Web 版**

- 会話履歴表示エリア（チャット形式）
- 音声入力ボタン（録音状態に応じて変化）
- テキスト編集モード切り替え
- 送信ボタン

**モバイル版**

- ネイティブ音声録音機能
- チャットバブル形式の会話表示
- 音声権限管理
- ハプティックフィードバック

#### 会話フロー

1. ユーザーが音声入力ボタンを押下
2. 音声録音開始
3. 録音停止後、Speech-to-Text で文字起こし
4. ユーザーがテキストを確認・編集
5. メッセージ送信
6. Gemini AI が応答生成
7. 会話履歴に追加表示

#### API 仕様

```
POST /api/speech-to-text
Request: FormData with audio file
Response: { "transcripts": string[] }

POST /api/gemini
Request: { "text": "Xin chào" }
Response: { "text": "Xin chào! Bạn có khỏe không?" }
```

## データモデル

### Notion Database Schema

```
Properties:
- name_vi (Title): ベトナム語（主キー）
- name_ja (Rich Text): 日本語
- tag (Multi-select): カテゴリタグ
- created_at (Created Time): 作成日時
- example (Rich Text): 使用例（オプション）
```

### API Response Types

```typescript
// 翻訳レスポンス
type TranslateResponse =
  | { translatedText: string; tag: string; name_ja: string } // 既存データ
  | { translatedText: string }; // 新規翻訳

// 単語帳アイテム
type VocabularyItem = {
  id: string;
  name_ja: string;
  name_vi: string;
  tag: string;
};

// 会話メッセージ
type Message = {
  role: "user" | "model";
  content: string;
  translation?: string;
};
```

## セキュリティ・プライバシー

### API セキュリティ

- CORS 設定による適切なオリジン制限
- 環境変数による機密情報管理
- ファイルサイズ制限（音声ファイル: 10MB 以下）

### データプライバシー

- 音声データの一時的な処理（永続化なし）
- Notion API キーの適切な管理
- Google Cloud サービスの利用規約準拠

## パフォーマンス要件

### レスポンス時間

- 翻訳 API: < 2 秒
- 音声認識: < 5 秒
- 単語帳読み込み: < 3 秒

### 可用性

- アップタイム: 99.5%以上
- エラーハンドリング: 全 API エンドポイントで適切なエラーレスポンス

## 今後の拡張予定

### 機能拡張

- リアルタイム会話システム（WebSocket）
- 発音評価機能
- 学習進捗トラッキング
- オフライン対応（モバイル）

### UI/UX 改善

- ダークモード対応
- アクセシビリティ向上
- 多言語 UI 対応

### インフラ改善

- 音声データの永続化システム
- CDN 導入によるパフォーマンス向上
- 自動スケーリング対応

## 運用・保守

### 監視

- API レスポンス時間監視
- エラー率監視
- 外部サービス依存性監視

### バックアップ

- Notion データベースの定期バックアップ
- 設定ファイルのバージョン管理

### デプロイメント

- 継続的インテグレーション/デプロイメント（CI/CD）
- 段階的リリース（カナリアデプロイメント）
