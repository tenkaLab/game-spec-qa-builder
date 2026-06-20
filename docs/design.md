# 設計方針

NodeRPG Studio v0.1 の設計方針を記録します。

---

## 基本方針

このプロジェクトでは、以下の方針で実装します。

- Runtime / Editor に依存しない Core ライブラリとして作る
- データ構造とシリアライズ処理を独立させる
- ノード間遷移は `EventGraph.Connections` を正とする
- ノード固有の値は `properties` に格納する
- 最初から複雑な継承構造にしすぎない
- v0.1 では最小限の会話イベントグラフを扱う
- 機能追加よりも、保存・読み込み・検証の安定を優先する
- 将来的に Godot Runtime と Avalonia Editor の両方から参照できる構造にする

---

## Core を独立させる理由

v0.1 では、Godot Runtime や Avalonia Editor には依存させません。

理由は以下です。

- Runtime と Editor の両方から同じデータ構造を参照できるようにするため
- UIやゲームエンジンの都合で Core の設計が歪むのを避けるため
- JSON保存・読み込み・検証を先に安定させるため
- 後からRuntime再生やEditor編集を追加しやすくするため

---

## EventGraph.Connections を正とする理由

ノード間の遷移は `EventGraph.Connections` を正とします。

`properties.next`、`properties.trueNext`、`properties.falseNext`、`options[].next` のように、ノード内プロパティへ遷移先を持たせる方式は使いません。

理由は以下です。

- ノード接続型エディタで扱いやすくするため
- 遷移構造を一か所に集約するため
- Choice や Branch のような複数ポートを持つノードを扱いやすくするため
- 接続の検証を `GraphValidator` に集約しやすくするため

---

## properties の扱い

ノード固有の設定値だけを `properties` に格納します。

例：

- `ShowMessage`: 表示テキスト
- `ShowBackground`: 背景ID
- `ShowCharacter`: キャラクターID
- `PlayBGM`: BGM ID
- `SetFlag`: フラグキーと値
- `Branch`: 判定対象キー

v0.1 では、Runtime や Editor が必要に応じて `properties` を解釈する方針にします。

---

## メモ

設計や仕様で迷ったことは、ここに記録します。

- v0.1 では Runtime / Editor 依存を入れない
- ノード間遷移は `EventGraph.Connections` に統一する
- `properties.next` などのノード内遷移は使わない
- `Choice` は `options[].id` と `connections.fromPort` を対応させる
- `Branch` は `true` / `false` の接続ポートを使用する
- 終端ノードは接続なしを許可する
- エディタUI、ランタイム再生、アセット実体読み込みは後回し
