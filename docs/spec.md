# Q&A Builder Specification

## プロダクト定義

Q&A Builderは、ゲーム開発初心者が設計上の選択肢をたどり、ゲーム仕様を段階的に確定して実行可能コードを生成するための設計支援・コード生成ツールです。

Q&Aは自由入力フォームではありません。用途・構造・ルール・必要機能を限定する選択式分岐であり、選択結果によってゲームを構成する仕様パーツを追加・除外します。

名称、速度、色、サイズなどの具体値はQ&Aでは扱いません。仕様が生成可能な状態に確定した後、コード生成用Parameterとして入力します。

主成果物は実行可能なゲームコードです。`ResolvedSpec`、生成ドキュメント、選択履歴、Parameter定義、`GenerationTrace`などは、コード生成と追跡を支える中間・補助成果物です。

## v0.1の基本フロー

```txt
選択式Q&A
↓
仕様パーツ合成
↓
不足・競合検出
↓
ResolvedSpec生成
↓
Parameter入力
↓
CodeArtifact生成
↓
GenerationTrace生成
↓
Artifact Preview / Copy / Download
```

不足または競合を示すerror Diagnosticが残っている場合、`ResolvedSpec`は生成せず、コード生成へ進めません。

## v0.1の生成物

CodeGeneratorは次の`CodeArtifact`を生成します。

- `package.json`
- `index.html`
- `src/main.ts`
- `README.md`

生成される`src/main.ts`は、選択された主要Moduleと有効なParameterを反映した最小TypeScript + Canvasゲームです。

## Artifactの保存

v0.1はZIP生成に対応していません。

単体Artifactのダウンロードではディレクトリ構造を保持できないため、画面の`artifact.path`に従って手動配置します。Bundle Text Downloadは、全Artifactをパス見出し付きの1テキストへまとめる補助機能であり、実行可能なディレクトリを生成する機能ではありません。
