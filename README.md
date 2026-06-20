# Game Spec Q&A Builder

質問に答えることで、ゲーム仕様と設定JSONを生成するブラウザ型ゲーム制作支援ツールです。

## v0.1

v0.1では、基本の避けゲーテンプレートに対応しています。

できること:

- Q&A形式で避けゲー仕様を入力
- `spec.md` 相当のMarkdownを生成
- `game-spec.json` 相当のJSONを生成
- Markdown / JSONをコピー
- 入力値を検証し、エラーをフォームに表示

## 起動方法

Node.jsとnpmを用意し、次のコマンドを実行してください。

```bash
npm install
npm run dev
```

本番用ビルドは次のコマンドで確認できます。

```bash
npm run build
```

## v0.1でやらないこと

- Canvasプレビュー
- コード生成
- ノードビュー
- AIチャット
- バックエンド
- ログイン
- データ保存
- 複数テンプレート
- テンプレート編集機能
