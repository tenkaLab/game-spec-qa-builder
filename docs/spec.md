# 仕様書

NodeRPG Studio v0.1 の仕様を記録します。

---

## v0.1 の範囲

v0.1 では、以下を扱います。

- 会話イベントグラフのデータ構造を定義する
- JSON保存・読み込みを提供する
- 最小限のグラフ検証を提供する
- 最小サンプルを用意する

v0.1 では、以下は扱いません。

- エディタUI
- ランタイム再生
- アセット実体の読み込み
- 条件式エンジン

---

## 対応ノード

v0.1 では、以下のノード種別に対応します。

- `Start`
- `ShowMessage`
- `Choice`
- `SetFlag`
- `Branch`
- `ShowBackground`
- `ShowCharacter`
- `PlayBGM`
- `PlaySE`

---

## JSON 方針

ノード種別は `type` に文字列で保存します。

ノード間の遷移は `EventGraph.Connections` を正とし、以下のようなノード内プロパティによる遷移定義は使用しません。

- `properties.next`
- `properties.trueNext`
- `properties.falseNext`
- `options[].next`

ノード固有の設定値だけを `properties` に格納し、v0.1 では Runtime や Editor が必要に応じて解釈します。

この方針により、Core は特定UIやゲームエンジンに依存せず、後からノード固有クラスやバリデーションを追加できるようにします。

---

## GraphValidator

`GraphValidator` は `EventGraph` の構造を検証し、`GraphValidationResult` としてエラーまたは警告の一覧を返します。

v0.1 では、次を検証します。

- `Start` ノードの不足または重複
- `EventGraph.StartNodeId` の不足、参照先ノードの存在、参照先ノード種別
- 空の `NodeData.Id`
- 未設定または不明な `NodeData.Type`
- `connections` の接続元ノード、接続先ノード、接続ポート
- `Start` / `ShowMessage` / `ShowBackground` / `ShowCharacter` / `PlayBGM` / `PlaySE` / `SetFlag` の接続ポートは `next` のみ
- 上記ノードの `next` 接続は最大1本まで
- `Choice` ノードの `options[].id` と `options[].text`
- `Choice` ノードの `options[].id` と `connections.fromPort` の対応
- `Choice` ノードの接続ポートは `options[].id` と一致する値のみ
- `Branch` ノードの接続ポートは `true` / `false` のみ
- 終端ノードの接続なし
- `StartNodeId` を起点に到達できないノード
- ノード種別ごとの必須 `properties`

---

## 必須 properties

必須 `properties` は以下です。

- `ShowMessage`: `text`
- `ShowBackground`: `backgroundId`
- `ShowCharacter`: `characterId`
- `PlayBGM`: `bgmId`
- `PlaySE`: `seId`
- `SetFlag`: `key`, `value`
- `Branch`: `key`
- `Choice`: `options`
