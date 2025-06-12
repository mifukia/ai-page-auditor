# Vercel用 OpenAI APIラッパー

## 概要
Chrome拡張からのリクエストを受けて、OpenAI APIに投げて返答を返すAPIエンドポイントです。

## ディレクトリ構成

```
/api/analyze.js   # エンドポイント本体
/api/package.json # openai依存
.env              # OpenAI APIキー（プロジェクトルート）
```

## 使い方

1. プロジェクトルートに `.env` を作成し、以下を記載

```
OPENAI_API_KEY=sk-xxxxxxx仮キー
```

2. Vercelにデプロイ
   - Vercelの「環境変数」にも `OPENAI_API_KEY` を設定

3. Chrome拡張のAPIエンドポイントを
   - `https://<your-vercel-app>.vercel.app/api/analyze`
   に変更

---

- `openai`パッケージはVercelが自動でインストールします
- ローカルでテストする場合は `npm install` して `vercel dev` でOK 