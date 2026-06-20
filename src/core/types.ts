export type QuestionType = 'text' | 'number' | 'select'

export interface QuestionOption {
  value: string
  label: string
}

export interface QuestionDefinition {
  id: string
  label: string
  type: QuestionType
  defaultValue: string | number
  required?: boolean
  min?: number
  max?: number
  step?: number
  options?: QuestionOption[]
}

export interface GameTemplate {
  id: string
  name: string
  description: string
  genre: string
  questions: QuestionDefinition[]
}

export type AnswerValue = string | number

export type AnswerMap = Record<string, AnswerValue>

export type GameSpec = {
  formatVersion: '0.1'
  templateId: string
  game: {
    title: string
    genre: 'dodge'
  }
  controls: {
    move: ['ArrowKeys', 'WASD']
    restart: 'R' | 'Space'
  }
  player: {
    name: string
    speed: number
  }
  enemy: {
    name: string
    spawn: {
      type: 'top_random'
      interval: number
    }
    movement: {
      type: 'fall_down'
      speed: number
    }
  }
  rules: Array<{
    id: string
    when: string
    then: string
  }>
  score: {
    type: 'survival_time'
  }
  states: ['title', 'playing', 'game_over']
}
