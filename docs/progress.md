# 進捗ログ

NodeRPG Studio の進捗を記録します。

進捗報告では、最低限以下を記載します。

- 今回追加したもの
- 方針
- 動作確認の有無
- 次の作業

運用方針:

- `progress.md` は追記方式で運用する
- 新しい進捗を上に追加し、古い進捗は下に残す
- 見づらくなった場合は、md内リンクによる目次追加、または `docs/progress/` 配下への月別・フェーズ別分割を検討する

---

## 2026-06-16 進捗

### 今回追加したもの

- `GraphValidator` に通常ノードの connection port ルールを追加
- `Start` / `ShowMessage` / `ShowBackground` / `ShowCharacter` / `PlayBGM` / `PlaySE` / `SetFlag` の `next` 接続制限を追加
- 上記通常ノードで `next` 接続が複数ある場合は Error として扱うルールを追加
- 通常ノードは接続なしの場合、終端ノードとして許可する方針を明確化
- `Choice` ノードは既存どおり `options[].id` と一致する `fromPort` のみ許可
- `Branch` ノードは `true` / `false` の接続を必須とし、それ以外の `fromPort` を Error として扱う方針を整理
- `README.md` に connection port ルールを追記
- `docs` 運用方針として、`design.md` / `spec.md` / `progress.md` を各プロジェクトに置く方針を整理

### 方針

v0.1 では、RuntimeやEditorに依存せず、Core側で最低限のグラフ構造を保証する。

特に、ノード間接続の `fromPort` を明確に制限し、意図しない接続や分岐漏れを早い段階で検出できるようにする。

また、開発進捗はDiscordへ直接投稿する方式ではなく、各プロジェクトの `docs/progress.md` に記録する方式へ移行する。  
`progress.md` の更新内容は、GitHub Actions によりDiscordへ自動共有される想定。

### 動作確認

- `dotnet build` 確認済み
- サンプルJSONの読み込み確認済み
- 接続ポートのバリデーション確認済み
- 通常ノードの `next` 接続制限を確認済み
- 通常ノードの複数 `next` 接続が Error になることを確認済み
- `Choice` / `Branch` の接続ポート規則が想定どおり扱われることを確認済み

### 現在の課題

- connection port ルールのテストコード追加が必要
- サンプルグラフを拡張し、正常系・異常系の確認パターンを増やす必要がある
- `docs/design.md` / `docs/spec.md` の初期内容を整える必要がある
- `progress.md` が肥大化した場合の整理方針を、運用しながら確認する

### 次の作業

- `GraphValidator` の connection port ルールに対するテストコードを追加
- サンプルグラフを拡張
- `docs/design.md` に設計方針を記載
- `docs/spec.md` にノード仕様・接続仕様を記載
- `progress.md` の自動Discord通知が想定どおり動作するか確認

