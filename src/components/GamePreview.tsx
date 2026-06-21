import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameSpec } from '../core/types'

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const ENTITY_SIZE = 32

type PreviewStatus = 'ready' | 'playing' | 'game_over'

interface Position {
  x: number
  y: number
}

interface Enemy extends Position {
  width: number
  height: number
}

interface PreviewRuntime {
  status: PreviewStatus
  player: Position
  enemies: Enemy[]
  elapsedMs: number
  spawnElapsedMs: number
  lastTimestamp: number
}

interface GamePreviewProps {
  spec: GameSpec
}

function createRuntime(status: PreviewStatus = 'ready'): PreviewRuntime {
  return {
    status,
    player: { x: 320, y: 400 },
    enemies: [],
    elapsedMs: 0,
    spawnElapsedMs: 0,
    lastTimestamp: 0,
  }
}

function isColliding(player: Position, enemy: Enemy): boolean {
  return (
    player.x < enemy.x + enemy.width &&
    player.x + ENTITY_SIZE > enemy.x &&
    player.y < enemy.y + enemy.height &&
    player.y + ENTITY_SIZE > enemy.y
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function GamePreview({ spec }: GamePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runtimeRef = useRef<PreviewRuntime>(createRuntime())
  const pressedKeysRef = useRef<Set<string>>(new Set())
  const [status, setStatus] = useState<PreviewStatus>('ready')

  const startPreview = useCallback(() => {
    runtimeRef.current = createRuntime('playing')
    pressedKeysRef.current.clear()
    setStatus('playing')
    canvasRef.current?.focus()
  }, [])

  const resetPreview = useCallback(() => {
    runtimeRef.current = createRuntime()
    pressedKeysRef.current.clear()
    setStatus('ready')
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const movementKeys = new Set([
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
      ])
      const restartCode = spec.controls.restart === 'R' ? 'KeyR' : 'Space'

      if (runtimeRef.current.status === 'playing' && movementKeys.has(event.code)) {
        event.preventDefault()
        pressedKeysRef.current.add(event.code)
      }

      if (
        runtimeRef.current.status === 'game_over' &&
        event.code === restartCode
      ) {
        event.preventDefault()
        startPreview()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.code)
    }

    const clearKeys = () => pressedKeysRef.current.clear()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearKeys)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearKeys)
    }
  }, [spec.controls.restart, startPreview])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let animationFrameId = 0

    const draw = () => {
      const runtime = runtimeRef.current

      context.fillStyle = '#111827'
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      context.strokeStyle = '#1f2937'
      context.lineWidth = 1
      for (let x = 0; x < CANVAS_WIDTH; x += 32) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, CANVAS_HEIGHT)
        context.stroke()
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(CANVAS_WIDTH, y)
        context.stroke()
      }

      context.fillStyle = '#60a5fa'
      context.fillRect(
        runtime.player.x,
        runtime.player.y,
        ENTITY_SIZE,
        ENTITY_SIZE,
      )

      context.fillStyle = '#f87171'
      for (const enemy of runtime.enemies) {
        context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
      }

      context.fillStyle = '#f8fafc'
      context.font = 'bold 18px system-ui, sans-serif'
      context.fillText(`Score: ${(runtime.elapsedMs / 1000).toFixed(1)}`, 16, 28)

      if (runtime.status !== 'playing') {
        context.fillStyle = 'rgb(15 23 42 / 75%)'
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        context.fillStyle = '#ffffff'
        context.textAlign = 'center'
        context.font = 'bold 32px system-ui, sans-serif'
        context.fillText(
          runtime.status === 'ready' ? 'Canvas Preview' : 'Game Over',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 12,
        )
        context.font = '18px system-ui, sans-serif'
        context.fillText(
          runtime.status === 'ready'
            ? 'プレビュー開始ボタンを押してください'
            : `${spec.controls.restart}キーでリスタート`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 26,
        )
        context.textAlign = 'start'
      }
    }

    const update = (timestamp: number) => {
      const runtime = runtimeRef.current

      if (runtime.status === 'playing') {
        const deltaMs =
          runtime.lastTimestamp === 0
            ? 0
            : Math.min(timestamp - runtime.lastTimestamp, 100)
        runtime.lastTimestamp = timestamp
        runtime.elapsedMs += deltaMs
        runtime.spawnElapsedMs += deltaMs

        const keys = pressedKeysRef.current
        const speed = spec.player.speed
        if (keys.has('ArrowUp') || keys.has('KeyW')) runtime.player.y -= speed
        if (keys.has('ArrowDown') || keys.has('KeyS')) runtime.player.y += speed
        if (keys.has('ArrowLeft') || keys.has('KeyA')) runtime.player.x -= speed
        if (keys.has('ArrowRight') || keys.has('KeyD')) runtime.player.x += speed

        runtime.player.x = clamp(runtime.player.x, 0, CANVAS_WIDTH - ENTITY_SIZE)
        runtime.player.y = clamp(runtime.player.y, 0, CANVAS_HEIGHT - ENTITY_SIZE)

        const spawnIntervalMs = spec.enemy.spawn.interval * 1000
        while (runtime.spawnElapsedMs >= spawnIntervalMs) {
          runtime.enemies.push({
            x: Math.random() * (CANVAS_WIDTH - ENTITY_SIZE),
            y: -ENTITY_SIZE,
            width: ENTITY_SIZE,
            height: ENTITY_SIZE,
          })
          runtime.spawnElapsedMs -= spawnIntervalMs
        }

        for (const enemy of runtime.enemies) {
          enemy.y += spec.enemy.movement.speed
        }
        runtime.enemies = runtime.enemies.filter(
          (enemy) => enemy.y < CANVAS_HEIGHT,
        )

        const collisionRule = spec.rules.find(
          (rule) => rule.when === 'player_collides_with_enemy',
        )
        if (
          collisionRule?.then === 'game_over' &&
          runtime.enemies.some((enemy) => isColliding(runtime.player, enemy))
        ) {
          runtime.status = 'game_over'
          pressedKeysRef.current.clear()
          setStatus('game_over')
        }
      }

      draw()
      animationFrameId = requestAnimationFrame(update)
    }

    animationFrameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animationFrameId)
  }, [spec])

  return (
    <section className="game-preview" aria-labelledby="preview-heading">
      <div className="preview-heading-row">
        <div>
          <h3 id="preview-heading">Canvasプレビュー</h3>
          <p>
            矢印キーまたはWASDで移動。ゲームオーバー時は
            {spec.controls.restart}キーでリスタートします。
          </p>
        </div>
        <div className="preview-actions">
          <button type="button" onClick={startPreview} disabled={status === 'playing'}>
            プレビュー開始
          </button>
          <button type="button" className="button-secondary" onClick={resetPreview}>
            リセット
          </button>
        </div>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          tabIndex={0}
          aria-label={`${spec.game.title}のゲームプレビュー`}
        />
      </div>
    </section>
  )
}
