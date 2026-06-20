import { useState, type ChangeEvent, type FormEvent } from 'react'
import type {
  AnswerMap,
  AnswerValue,
  GameTemplate,
  QuestionDefinition,
} from '../core/types'
import {
  validateAnswers,
  type ValidationErrors,
} from '../core/validateAnswers'

interface QuestionFormProps {
  template: GameTemplate
  initialAnswers?: AnswerMap
  onSubmit: (answers: AnswerMap) => void
  onBack: () => void
}

function createInitialAnswers(template: GameTemplate): AnswerMap {
  return Object.fromEntries(
    template.questions.map((question) => [question.id, question.defaultValue]),
  )
}

export function QuestionForm({
  template,
  initialAnswers,
  onSubmit,
  onBack,
}: QuestionFormProps) {
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    initialAnswers ?? createInitialAnswers(template),
  )
  const [errors, setErrors] = useState<ValidationErrors>({})

  const updateAnswer = (id: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [id]: value }))
    setErrors((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const handleChange = (
    question: QuestionDefinition,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const value =
      question.type === 'number' && event.target.value !== ''
        ? Number(event.target.value)
        : event.target.value
    updateAnswer(question.id, value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validateAnswers(template.questions, answers)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(answers)
    }
  }

  return (
    <section className="panel" aria-labelledby="form-heading">
      <div className="section-heading form-heading">
        <div>
          <span className="step-label">ステップ 2</span>
          <h2 id="form-heading">{template.name}の仕様を入力</h2>
        </div>
        <button type="button" className="button-secondary" onClick={onBack}>
          テンプレート選択へ戻る
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="question-grid">
          {template.questions.map((question) => {
            const inputId = `question-${question.id}`
            const errorId = `${inputId}-error`

            return (
              <div className="field" key={question.id}>
                <label htmlFor={inputId}>
                  {question.label}
                  {question.required && <span className="required">必須</span>}
                </label>

                {question.type === 'select' ? (
                  <select
                    id={inputId}
                    value={answers[question.id]}
                    onChange={(event) => handleChange(question, event)}
                    aria-invalid={Boolean(errors[question.id])}
                    aria-describedby={errors[question.id] ? errorId : undefined}
                  >
                    {question.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={inputId}
                    type={question.type}
                    value={answers[question.id]}
                    min={question.min}
                    max={question.max}
                    step={question.step}
                    required={question.required}
                    onChange={(event) => handleChange(question, event)}
                    aria-invalid={Boolean(errors[question.id])}
                    aria-describedby={errors[question.id] ? errorId : undefined}
                  />
                )}

                {errors[question.id] && (
                  <p className="field-error" id={errorId} role="alert">
                    {errors[question.id]}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="form-actions">
          <p>回答内容はブラウザ内の一時的な状態として保持されます。</p>
          <button type="submit">仕様を生成する</button>
        </div>
      </form>
    </section>
  )
}
