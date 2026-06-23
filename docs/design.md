# Q&A Builder Design

## 状態の分類

状態不整合を防ぐため、定義データ、正本状態、導出状態を分離します。

## 定義データ

- `QuestionNode`: ユーザーへ提示する選択式質問
- `AnswerOption`: Moduleの追加・除外と次質問候補を指定する選択肢
- `SpecModule`: 移動、敵、ルール、スコアなどの再利用可能な仕様パーツ
- `ConstraintRule`: Module間の必須条件、競合、排他を定義するルール
- `GenerationParameterDefinition`: 仕様確定後に入力するParameterの定義

`AnswerOption`はコードを直接生成しません。選択肢は`SpecModule`だけを操作し、CodeGeneratorは確定後の`ResolvedSpec`を入力にします。

## 正本状態

UIが正本として保持するのは`BuildState`だけです。

```txt
BuildState
├─ selectedAnswerIds
├─ parameterValues
└─ SelectionHistory
```

- `selectedAnswerIds`: ユーザーが選択した回答
- `parameterValues`: ユーザーが変更したParameter値
- `SelectionHistory`: 回答選択・解除とParameter変更の履歴

Moduleの追加・除外やDiagnostic生成は導出処理なので、履歴へ重複記録しません。

## 導出状態

次の値は保存せず、`BuildState`と定義データからResolverで毎回導出します。

- `activeModuleIds`
- `diagnostics`
- `pendingQuestionIds`
- `resolvedSpec`
- `isGeneratable`

## Resolver方針

Resolverは選択済み`AnswerOption`からModuleを合成し、`ConstraintRule`を評価します。

- 不明なAnswer、Module、ParameterはDiagnosticにする
- `requires`、`conflicts`、`exclusive_group`を評価する
- Diagnosticが示す解消質問を`pendingQuestionIds`へ集約する
- error Diagnosticがなければ`ResolvedSpec`を生成する
- 回答、Module、Diagnostic、追加質問の重複を排除する

`activeModuleIds`、`diagnostics`、`resolvedSpec`を正本として保存しないことで、ユーザー選択との不整合を防ぎます。

## CodeGenerator方針

CodeGeneratorは`DefinitionData`、`ResolvedSpec`、`parameterValues`から次を返します。

- `CodeArtifact[]`: 生成されたファイル群
- `GenerationTrace`: 仕様・Parameterと生成コードの対応情報

Parameter値は、ユーザー値があればそれを使用し、未設定なら`GenerationParameterDefinition.defaultValue`を使用します。有効Moduleに紐づくParameterだけを生成へ反映します。

`GenerationTraceEntry.generatedRegionId`は安定IDとし、生成コード内の`generated-region`コメントと対応させます。行番号は補助情報であり、追跡の正本にはしません。

`validateGenerationOutput`は次を検証します。

- Traceが参照するArtifactの存在
- `generatedRegionId`が空でないこと
- 同一Artifact内のregion IDが重複しないこと
- Traceに生成元Moduleが存在すること

## ProjectGraph方針

ProjectGraphはノード内に双方向の依存情報を重複保存せず、`nodes`と`edges`を分離します。

```txt
ProjectGraph
├─ nodes
└─ edges
```

逆方向の影響範囲は保存せず、必要な時点でedgeをグラフ探索して算出します。v0.1では型定義のみで、本格生成やノードUIは未実装です。
