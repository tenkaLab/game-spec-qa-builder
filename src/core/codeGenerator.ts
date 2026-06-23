import type {
  CodeArtifact,
  CodeGeneratorInput,
  CodeGeneratorOutput,
  GenerationParameterDefinition,
  GenerationTraceEntry,
  ParameterValue,
  SpecModuleId,
} from './types.ts'

const MAIN_ARTIFACT_ID = 'artifact:src/main.ts'

export function validateGenerationOutput(
  output: CodeGeneratorOutput,
): string[] {
  const messages: string[] = []
  const artifactIds = new Set(output.artifacts.map((artifact) => artifact.id))
  const regionKeys = new Set<string>()

  for (const entry of output.trace.entries) {
    if (!artifactIds.has(entry.artifactId)) {
      messages.push(
        `Trace ${entry.id}: artifactId「${entry.artifactId}」が存在しません。`,
      )
    }

    if (entry.generatedRegionId.trim() === '') {
      messages.push(`Trace ${entry.id}: generatedRegionIdが空です。`)
    }

    const regionKey = `${entry.artifactId}:${entry.generatedRegionId}`
    if (regionKeys.has(regionKey)) {
      messages.push(
        `Trace ${entry.id}: generatedRegionId「${entry.generatedRegionId}」が重複しています。`,
      )
    } else {
      regionKeys.add(regionKey)
    }

    if (entry.sourceModuleIds.length === 0) {
      messages.push(`Warning: Trace ${entry.id}にsourceModuleIdsがありません。`)
    }
  }

  return messages
}

function getParameterDefinition(
  input: CodeGeneratorInput,
  key: string,
): GenerationParameterDefinition | undefined {
  const activeModuleIds = new Set(input.resolvedSpec.moduleIds)
  return input.definitions.parameterDefinitions.find(
    (parameter) =>
      parameter.key === key && activeModuleIds.has(parameter.moduleId),
  )
}

function getParameterValue(
  input: CodeGeneratorInput,
  key: string,
): ParameterValue | undefined {
  const definition = getParameterDefinition(input, key)
  if (!definition) return undefined
  return input.parameterValues[definition.id] ?? definition.defaultValue
}

function getNumberParameter(
  input: CodeGeneratorInput,
  key: string,
  fallback: number,
): number {
  const value = getParameterValue(input, key)
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getStringParameter(
  input: CodeGeneratorInput,
  key: string,
  fallback: string,
): string {
  const value = getParameterValue(input, key)
  return typeof value === 'string' ? value : fallback
}

export function generateCanvasGameCode(
  input: CodeGeneratorInput,
): CodeGeneratorOutput {
  const activeModuleIds = new Set(input.resolvedSpec.moduleIds)
  const traceEntries: GenerationTraceEntry[] = []

  const activeModules = (moduleIds: SpecModuleId[]) =>
    moduleIds.filter((moduleId) => activeModuleIds.has(moduleId))

  const parameterIds = (keys: string[]) =>
    keys.flatMap((key) => {
      const definition = getParameterDefinition(input, key)
      return definition ? [definition.id] : []
    })

  const generatedRegion = (
    regionName: string,
    content: string,
    sourceModuleIds: SpecModuleId[],
    sourceParameterKeys: string[] = [],
  ): string => {
    const generatedRegionId = `region:main:${regionName}`
    traceEntries.push({
      id: `trace:${generatedRegionId}`,
      sourceModuleIds: activeModules(sourceModuleIds),
      sourceParameterIds: parameterIds(sourceParameterKeys),
      artifactId: MAIN_ARTIFACT_ID,
      generatedRegionId,
    })
    return `// <generated-region id="${generatedRegionId}">
${content}
// </generated-region>`
  }

  const playerSpeed = getNumberParameter(input, 'playerSpeed', 5)
  const enemySpawnInterval = getNumberParameter(
    input,
    'enemySpawnInterval',
    1,
  )
  const playerColor = getStringParameter(input, 'playerColor', '#60a5fa')
  const controlScheme = getStringParameter(input, 'controlScheme', 'keyboard')

  const setupRegion = generatedRegion(
    'canvas_setup',
    `type Entity = { x: number; y: number; width: number; height: number }

const canvas = document.createElement('canvas')
canvas.width = 640
canvas.height = 480
document.body.append(canvas)

const context = canvas.getContext('2d')
if (!context) throw new Error('Canvas 2D context is unavailable')

const player: Entity = { x: 304, y: 400, width: 32, height: 32 }
let enemies: Entity[] = []
let items: Entity[] = []
const keys = new Set<string>()
const playerSpeed = ${JSON.stringify(playerSpeed)}
const playerColor = ${JSON.stringify(playerColor)}
const enemySpawnIntervalMs = ${JSON.stringify(enemySpawnInterval * 1000)}
const controlScheme = ${JSON.stringify(controlScheme)}

let enemySpawnElapsedMs = 0
let itemSpawnElapsedMs = 0
let score = 0
let hp = 3
let hitCooldownMs = 0
let gameOver = false
let lastTimestamp = performance.now()

const intersects = (a: Entity, b: Entity) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

window.addEventListener('keydown', (event) => {
  keys.add(event.code)
})
window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

console.info('Control scheme:', controlScheme)`,
    [...input.resolvedSpec.moduleIds],
    [
      'playerSpeed',
      'playerColor',
      'enemySpawnInterval',
      'controlScheme',
    ],
  )

  let movementRegion = ''
  if (activeModuleIds.has('player_move_4dir')) {
    movementRegion = generatedRegion(
      'player_movement',
      `if (keys.has('ArrowLeft') || keys.has('KeyA')) player.x -= playerSpeed
if (keys.has('ArrowRight') || keys.has('KeyD')) player.x += playerSpeed
if (keys.has('ArrowUp') || keys.has('KeyW')) player.y -= playerSpeed
if (keys.has('ArrowDown') || keys.has('KeyS')) player.y += playerSpeed
player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))
player.y = Math.max(0, Math.min(canvas.height - player.height, player.y))`,
      ['player_move_4dir'],
      ['playerSpeed', 'controlScheme'],
    )
  } else if (activeModuleIds.has('player_move_side_scroll')) {
    movementRegion = generatedRegion(
      'player_movement',
      `if (keys.has('ArrowLeft') || keys.has('KeyA')) player.x -= playerSpeed
if (keys.has('ArrowRight') || keys.has('KeyD')) player.x += playerSpeed
player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))`,
      ['player_move_side_scroll'],
      ['playerSpeed', 'controlScheme'],
    )
  }

  const enemyRegion = activeModuleIds.has('enemy_spawn_from_top')
    ? generatedRegion(
        'enemy_spawn',
        `enemySpawnElapsedMs += deltaMs
if (enemySpawnElapsedMs >= enemySpawnIntervalMs) {
  enemySpawnElapsedMs = 0
  enemies.push({
    x: Math.random() * (canvas.width - 32),
    y: -32,
    width: 32,
    height: 32,
  })
}
for (const enemy of enemies) enemy.y += 3
enemies = enemies.filter((enemy) => enemy.y < canvas.height)`,
        ['enemy_spawn_from_top'],
        ['enemySpawnInterval'],
      )
    : ''

  const itemSpawnRegion = activeModuleIds.has('item_spawn')
    ? generatedRegion(
        'item_spawn',
        `itemSpawnElapsedMs += deltaMs
if (itemSpawnElapsedMs >= 2000) {
  itemSpawnElapsedMs = 0
  items.push({
    x: Math.random() * (canvas.width - 20),
    y: Math.random() * (canvas.height - 100) + 40,
    width: 20,
    height: 20,
  })
}`,
        ['item_spawn'],
      )
    : ''

  const collisionRegion = activeModuleIds.has('collision_game_over')
    ? generatedRegion(
        'collision_game_over',
        `if (enemies.some((enemy) => intersects(player, enemy))) {
  gameOver = true
}`,
        ['collision_game_over', 'enemy_spawn_from_top'],
      )
    : ''

  const hpRegion = activeModuleIds.has('hp_system')
    ? generatedRegion(
        'hp_system',
        `hitCooldownMs = Math.max(0, hitCooldownMs - deltaMs)
if (hitCooldownMs === 0 && enemies.some((enemy) => intersects(player, enemy))) {
  hp -= 1
  hitCooldownMs = 1000
  if (hp <= 0) gameOver = true
}`,
        ['hp_system', 'enemy_spawn_from_top'],
      )
    : ''

  const scoreRegionParts: string[] = []
  if (activeModuleIds.has('score_by_time')) {
    scoreRegionParts.push('score += deltaMs / 1000')
  }
  if (activeModuleIds.has('item_collect_score')) {
    scoreRegionParts.push(`items = items.filter((item) => {
  if (!intersects(player, item)) return true
  score += 10
  return false
})`)
  }
  const scoreRegion =
    scoreRegionParts.length > 0
      ? generatedRegion(
          'score',
          scoreRegionParts.join('\n'),
          ['score_by_time', 'item_collect_score', 'item_spawn'],
        )
      : ''

  const renderRegion = generatedRegion(
    'render',
    `context.fillStyle = '#111827'
context.fillRect(0, 0, canvas.width, canvas.height)

context.fillStyle = playerColor
context.fillRect(player.x, player.y, player.width, player.height)

context.fillStyle = '#ef4444'
for (const enemy of enemies) {
  context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
}

context.fillStyle = '#facc15'
for (const item of items) {
  context.fillRect(item.x, item.y, item.width, item.height)
}

context.fillStyle = '#ffffff'
context.font = '18px system-ui, sans-serif'
context.fillText('Score: ' + score.toFixed(1), 16, 28)
${activeModuleIds.has('hp_system') ? "context.fillText('HP: ' + hp, 16, 52)" : ''}

if (gameOver) {
  context.font = 'bold 42px system-ui, sans-serif'
  context.textAlign = 'center'
  context.fillText('Game Over', canvas.width / 2, canvas.height / 2)
  context.textAlign = 'start'
}`,
    [...input.resolvedSpec.moduleIds],
    ['playerColor'],
  )

  const loopContent = `function update(deltaMs: number) {
  if (gameOver) return

${movementRegion}

${enemyRegion}

${itemSpawnRegion}

${collisionRegion}

${hpRegion}

${scoreRegion}
}

function render() {
${renderRegion}
}

function frame(timestamp: number) {
  const deltaMs = Math.min(timestamp - lastTimestamp, 100)
  lastTimestamp = timestamp
  update(deltaMs)
  render()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)`

  const mainContent = `${setupRegion}

${loopContent}
`

  const artifacts: CodeArtifact[] = [
    {
      id: 'artifact:package.json',
      path: 'package.json',
      artifactType: 'config',
      content: `${JSON.stringify(
        {
          name: 'generated-canvas-game',
          private: true,
          version: '0.0.0',
          type: 'module',
          scripts: { dev: 'vite', build: 'vite build' },
          devDependencies: { typescript: '^6.0.2', vite: '^8.0.12' },
        },
        null,
        2,
      )}\n`,
    },
    {
      id: 'artifact:index.html',
      path: 'index.html',
      artifactType: 'source',
      content: `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated Canvas Game</title>
    <style>body { margin: 0; display: grid; min-height: 100vh; place-items: center; background: #020617; } canvas { max-width: 100%; height: auto; }</style>
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    },
    {
      id: MAIN_ARTIFACT_ID,
      path: 'src/main.ts',
      artifactType: 'source',
      content: mainContent,
    },
    {
      id: 'artifact:README.md',
      path: 'README.md',
      artifactType: 'document',
      content: `# Generated Canvas Game

これはQ&A Builderによって生成された最小Canvasゲームです。

> 注意: このプロジェクトは自動生成コードです。再生成すると変更内容が置き換わる可能性があります。

## Modules

${input.resolvedSpec.moduleIds.map((moduleId) => `- ${moduleId}`).join('\n') || '- なし'}

## Parameters

${input.definitions.parameterDefinitions
  .filter((parameter) => activeModuleIds.has(parameter.moduleId))
  .map(
    (parameter) =>
      `- ${parameter.key}: ${String(
        input.parameterValues[parameter.id] ?? parameter.defaultValue,
      )}`,
  )
  .join('\n') || '- なし'}

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

## File placement

ブラウザの単体ダウンロードではディレクトリ構造が保持されないため、表示されているpathに合わせて各ファイルを手動で配置してください。
`,
    },
  ]

  return {
    artifacts,
    trace: { entries: traceEntries },
  }
}
