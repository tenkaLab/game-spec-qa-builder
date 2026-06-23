# Q&A Builder Progress

## v0.1到達点

選択式Q&Aから仕様を合成し、診断を解消してParameterを入力し、最小CanvasゲームのArtifactとTraceを生成・確認・保存するまでの縦の経路が接続されています。

## 実装済み機能

- 選択式Q&A表示
- `AnswerOption`選択・解除
- `BuildState`による正本状態管理
- Resolverによる`activeModuleIds`導出
- `ConstraintRule`による不足・競合検出
- `Diagnostic`表示
- `pendingQuestionIds`表示
- `ResolvedSpec`生成制御
- `GenerationParameterDefinition`に基づくParameter入力
- CodeGeneratorによる`CodeArtifact`生成
- `GenerationTrace`生成
- Trace validation
- Artifact選択Preview
- Clipboard Copy
- 単体Artifact Download
- Bundle Text Download

## 確認結果

確認済み:

- `npm run check:resolver`: 成功
- 生成コード構文: 成功
- Trace validation: 成功

Resolver確認では、正常系、不足検出、排他競合、未知ID、重複選択、`requires any`、追加質問の重複排除を確認しています。

## 未確認事項

- `npm run build`: 未確認

React、Vite、TypeScriptの依存関係が未取得の環境では、`tsc`と`vite`を実行できません。`npm install`後にビルド確認が必要です。

## 手動確認手順

1. `npm install`を実行する
2. `npm run dev`を実行する
3. 開発サーバーのURLをブラウザで開く
4. Q&Aの選択肢を選ぶ
5. Active Modulesが変わることを確認する
6. 不足または競合する選択でDiagnosticsが表示されることを確認する
7. Diagnosticsを解消して生成可能状態にする
8. 有効ModuleのParameterを変更する
9. `Generate Code`を実行する
10. Artifact一覧が表示されることを確認する
11. `Trace validation: OK`と表示されることを確認する
12. Artifactの選択、Preview、Copy、単体Download、Bundle Text Downloadを確認する

## v0.1未対応機能

- ZIP生成
- 生成コードのブラウザ内実行Preview
- ノードUI
- ProjectGraphの本格生成
- 部分再生成
- File System Access API

## 次にやる候補

- 依存関係取得後のReact/Vite本番ビルド確認
- Undo/Redo UIと履歴適用処理
- DefinitionData自体の整合性検証
- ProjectGraphとGenerationTraceを使った影響範囲算出
