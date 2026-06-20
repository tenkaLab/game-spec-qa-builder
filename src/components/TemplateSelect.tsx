import type { GameTemplate } from '../core/types'

interface TemplateSelectProps {
  template: GameTemplate
  onSelect: (template: GameTemplate) => void
}

export function TemplateSelect({ template, onSelect }: TemplateSelectProps) {
  return (
    <section className="panel" aria-labelledby="template-heading">
      <div className="section-heading">
        <span className="step-label">ステップ 1</span>
        <h2 id="template-heading">テンプレートを選ぶ</h2>
      </div>

      <article className="template-card">
        <span className="genre-badge">避けゲーム</span>
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <p className="question-count">質問 {template.questions.length} 項目</p>
        <button type="button" onClick={() => onSelect(template)}>
          このテンプレートで始める
        </button>
      </article>
    </section>
  )
}
