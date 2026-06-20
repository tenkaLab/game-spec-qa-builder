import type { GameSpec } from './types'

export function buildSpecMarkdown(spec: GameSpec): string {
  const { player, enemy } = spec
  const restartKey = spec.controls.restart
  const spawnInterval = enemy.spawn.interval.toFixed(1)

  return `# ${spec.game.title} 仕様

## 概要

上から落ちてくる ${enemy.name} を避け続けるゲーム。

## 操作

- 矢印キーまたはWASDで ${player.name} を移動する
- ${restartKey}キーでリスタートする

## ルール

- ${enemy.name} に当たるとゲームオーバーになる
- 生存時間がスコアになる

## 登場要素

### ${player.name}

- 名前: ${player.name}
- 移動速度: ${player.speed}

### ${enemy.name}

- 名前: ${enemy.name}
- 出現位置: 画面上部ランダム
- 落下速度: ${enemy.movement.speed}
- 出現間隔: ${spawnInterval}秒

## 状態

- Title
- Playing
- GameOver

## リスタート

- GameOver中に ${restartKey}キーで再スタートする
`
}
