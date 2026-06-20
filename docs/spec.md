# 仕様書

Game Spec Q&A Builder v0.1 の仕様を記録します。

---

## プロジェクト概要

Game Spec Q&A Builder は、Q&A形式でゲーム内容を整理し、ゲーム仕様Markdownと設定JSONを生成するブラウザ型ゲーム制作支援ツールです。

最終目標は、単なる仕様書生成ではありません。

最終的には、ユーザーがQ&Aに答えることで、ブラウザ上で遊べるゲームを作れる状態を目指します。

v0.1 では、その第一段階として、基本の避けゲー仕様を作成し、以下を生成します。

- `spec.md` 相当のMarkdown
- `game-spec.json` 相当のJSON

---

## v0.1 の範囲

v0.1 では、以下を扱います。

- 基本の避けゲーテンプレートを表示する
- Q&A形式でゲーム仕様を入力する
- 入力値から `GameSpec` を生成する
- 入力値から仕様Markdownを生成する
- `game-spec.json` 相当のJSONを表示する
- 生成したMarkdownをコピーできる
- 生成したJSONをコピーできる
- 入力画面へ戻って再編集できる
- 最低限の入力バリデーションを行う

v0.1 では、以下は扱いません。

- Canvasプレビュー
- 実際に遊べるゲーム生成
- コード生成
- ノードビュー
- AIチャット
- バックエンド
- ログイン
- データ保存
- 複数テンプレート
- テンプレート編集機能
- 仕様パーツ合成
- 不足検出
- 競合検出

---

## 対応テンプレート

v0.1 では、以下のテンプレートに対応します。

### `dodge_game_basic`

基本の避けゲー。

内容:

- プレイヤーが画面内を移動する
- 敵が画面上部からランダムに出現する
- 敵が下方向へ落下する
- プレイヤーが敵に当たるとゲームオーバーになる
- 生存時間がスコアになる
- GameOver中にリスタートキーで再スタートできる

---

## Q&A項目

v0.1 では、以下の9項目を扱います。

| ID | 質問 | 型 | 初期値 | 備考 |
|---|---|---|---|---|
| `game_title` | ゲーム名は？ | text | `Dodge Game` | 必須 |
| `player_name` | プレイヤー名は？ | text | `Player` | 必須 |
| `player_speed` | プレイヤー速度は？ | number | `5` | 1〜20 |
| `enemy_name` | 敵の名前は？ | text | `Enemy` | 必須 |
| `enemy_speed` | 敵の落下速度は？ | number | `4` | 1〜20 |
| `enemy_spawn_interval` | 敵の出現間隔は？ | number | `1.0` | 0.2〜5.0、0.1刻み |
| `collision_result` | 敵に当たったら？ | select | `game_over` | v0.1ではゲームオーバーのみ |
| `score_type` | スコア方式は？ | select | `survival_time` | v0.1では生存時間のみ |
| `restart_key` | リスタートキーは？ | select | `R` | `R` / `Space` |

---

## 操作仕様

v0.1 では、移動操作は固定です。

- 矢印キー
- WASD

リスタートキーはQ&Aで選択します。

- `R`
- `Space`

---

## 画面仕様

v0.1 では、以下の画面を持ちます。

### テンプレート選択画面

表示内容:

- アプリ名
- 説明文
- `基本の避けゲー` テンプレート
- テンプレート説明
- 開始ボタン

### Q&A入力画面

表示内容:

- 9項目の質問フォーム
- text / number / select 入力
- バリデーションエラー
- `仕様を生成する` ボタン

### 出力確認画面

表示内容:

- 生成された仕様
- `spec.md` 相当のMarkdown
- `game-spec.json` 相当のJSON
- `Markdownをコピー` ボタン
- `JSONをコピー` ボタン
- `戻って編集` ボタン

---

## GameSpec JSON仕様

v0.1 の `GameSpec` は以下の構造を持ちます。

```json
{
  "formatVersion": "0.1",
  "templateId": "dodge_game_basic",
  "game": {
    "title": "Dodge Game",
    "genre": "dodge"
  },
  "controls": {
    "move": [
      "ArrowKeys",
      "WASD"
    ],
    "restart": "R"
  },
  "player": {
    "name": "Player",
    "speed": 5
  },
  "enemy": {
    "name": "Enemy",
    "spawn": {
      "type": "top_random",
      "interval": 1
    },
    "movement": {
      "type": "fall_down",
      "speed": 4
    }
  },
  "rules": [
    {
      "id": "game_over_on_enemy_collision",
      "when": "player_collides_with_enemy",
      "then": "game_over"
    }
  ],
  "score": {
    "type": "survival_time"
  },
  "states": [
    "title",
    "playing",
    "game_over"
  ]
}
```
JSON方針

JSONは、人間向けの文章ではなく、将来のゲーム生成に使う中間表現として扱います。

そのため、JSON内の when や then は自然文ではなく識別子にします。

例:

{
  "when": "player_collides_with_enemy",
  "then": "game_over"
}

Markdownでは自然文を使い、JSONでは機械処理しやすい識別子を使います。

Markdown出力仕様

生成されるMarkdownは、人間が読める仕様書として扱います。

例:

# Dodge Game 仕様

## 概要

上から落ちてくる Enemy を避け続けるゲーム。

## 操作

- 矢印キーまたはWASDで Player を移動する
- Rキーでリスタートする

## ルール

- Enemy に当たるとゲームオーバーになる
- 生存時間がスコアになる

## 登場要素

### Player

- 名前: Player
- 移動速度: 5

### Enemy

- 名前: Enemy
- 出現位置: 画面上部ランダム
- 落下速度: 4
- 出現間隔: 1.0秒

## 状態

- Title
- Playing
- GameOver

## リスタート

- GameOver中に Rキーで再スタートする
バリデーション仕様

v0.1 では、最低限以下を検証します。

必須項目が空ではないこと
number型の値が min / max の範囲内であること
select型の値が定義済み選択肢に含まれていること

エラーがある場合は、出力画面へ進まず、該当質問の近くにエラーを表示します。

今後の拡張予定

v0.2以降で、以下を検討します。

GameSpec からCanvasプレビューを生成する
Q&A回答の変更をプレビューに反映する
HP / アイテム / 難易度上昇などの仕様パーツを追加する
複数テンプレートに対応する
仕様パーツの不足検出を行う
仕様パーツの競合検出を行う
ノードビューを追加する
作成したゲームをHTMLとして出力する