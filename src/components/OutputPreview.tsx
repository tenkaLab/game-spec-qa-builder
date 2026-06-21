import { useState } from 'react'
import type { GameSpec } from '../core/types'
import { GamePreview } from './GamePreview'

type CopyTarget = 'markdown' | 'json'

interface CopyStatus {
  target: CopyTarget
  message: string
  kind: 'success' | 'error'
}

interface OutputPreviewProps {
  spec: GameSpec
  markdown: string
  jsonText: string
  onBack: () => void
}

export function OutputPreview({
  spec,
  markdown,
  jsonText,
  onBack,
}: OutputPreviewProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>()

  const copyText = async (target: CopyTarget, text: string) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API is unavailable')

      await navigator.clipboard.writeText(text)
      setCopyStatus({
        target,
        message:
          target === 'markdown'
            ? 'Markdownをコピーしました'
            : 'JSONをコピーしました',
        kind: 'success',
      })
    } catch {
      setCopyStatus({
        target,
        message: 'コピーに失敗しました',
        kind: 'error',
      })
    }
  }

  return (
    <section className="panel" aria-labelledby="output-heading">
      <div className="section-heading form-heading">
        <div>
          <span className="step-label">ステップ 3</span>
          <h2 id="output-heading">生成された仕様</h2>
          <p className="output-game-title">{spec.game.title}</p>
        </div>
        <button type="button" className="button-secondary" onClick={onBack}>
          戻って編集
        </button>
      </div>

      <GamePreview spec={spec} />

      <div className="output-block">
        <div className="output-title-row">
          <h3>spec.md</h3>
          <button
            type="button"
            className="button-copy"
            onClick={() => copyText('markdown', markdown)}
          >
            Markdownをコピー
          </button>
        </div>
        {copyStatus?.target === 'markdown' && (
          <p className={`copy-status ${copyStatus.kind}`} role="status">
            {copyStatus.message}
          </p>
        )}
        <pre>{markdown}</pre>
      </div>

      <div className="output-block">
        <div className="output-title-row">
          <h3>game-spec.json</h3>
          <button
            type="button"
            className="button-copy"
            onClick={() => copyText('json', jsonText)}
          >
            JSONをコピー
          </button>
        </div>
        {copyStatus?.target === 'json' && (
          <p className={`copy-status ${copyStatus.kind}`} role="status">
            {copyStatus.message}
          </p>
        )}
        <pre>{jsonText}</pre>
      </div>
    </section>
  )
}
