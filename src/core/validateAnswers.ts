import type { AnswerMap, QuestionDefinition } from './types'

export type ValidationErrors = Record<string, string>

export function validateAnswers(
  questions: QuestionDefinition[],
  answers: AnswerMap,
): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const question of questions) {
    const value = answers[question.id]
    const isEmpty = value === undefined || String(value).trim() === ''

    if (question.required && isEmpty) {
      errors[question.id] = '必須項目です。'
      continue
    }

    if (isEmpty) continue

    if (question.type === 'number') {
      const numberValue = typeof value === 'number' ? value : Number(value)

      if (!Number.isFinite(numberValue)) {
        errors[question.id] = '数値を入力してください。'
      } else if (
        (question.min !== undefined && numberValue < question.min) ||
        (question.max !== undefined && numberValue > question.max)
      ) {
        const minText = question.min !== undefined ? `${question.min}以上` : ''
        const maxText = question.max !== undefined ? `${question.max}以下` : ''
        errors[question.id] = `${minText}${maxText}で入力してください。`
      }
    }

    if (
      question.type === 'select' &&
      !question.options?.some((option) => option.value === String(value))
    ) {
      errors[question.id] = '選択肢から選んでください。'
    }
  }

  return errors
}
