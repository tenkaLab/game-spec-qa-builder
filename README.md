# Q&A Builder

Q&A Builderは、選択式Q&Aでゲーム仕様を組み立て、確定仕様とParameterから実行可能コードを生成する設計支援・コード生成ツールです。

現在のv0.1では、仕様合成・診断・Parameter入力・最小Canvasゲーム生成・Artifact確認と保存までの経路を実装しています。

## 起動方法

```bash
npm install
npm run dev
```

## 確認コマンド

```bash
npm run check:resolver
npm run build
```

`npm run build`は依存関係を取得した環境で実行してください。

## Documents

- [Specification](docs/spec.md)
- [Design](docs/design.md)
- [Progress](docs/progress.md)
