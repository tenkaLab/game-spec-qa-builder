import type { AnswerMap, GameSpec, GameTemplate } from './types'

function getStringAnswer(answers: AnswerMap, id: string): string {
  const value = answers[id]
  if (value === undefined) throw new Error(`Missing answer: ${id}`)
  return String(value)
}

function getNumberAnswer(answers: AnswerMap, id: string): number {
  const value = Number(answers[id])
  if (!Number.isFinite(value)) throw new Error(`Invalid number answer: ${id}`)
  return value
}

function getRestartKey(answers: AnswerMap): 'R' | 'Space' {
  const value = getStringAnswer(answers, 'restart_key')
  if (value !== 'R' && value !== 'Space') {
    throw new Error('Invalid restart key')
  }
  return value
}

export function buildGameSpec(
  template: GameTemplate,
  answers: AnswerMap,
): GameSpec {
  return {
    formatVersion: '0.1',
    templateId: template.id,
    game: {
      title: getStringAnswer(answers, 'game_title'),
      genre: 'dodge',
    },
    controls: {
      move: ['ArrowKeys', 'WASD'],
      restart: getRestartKey(answers),
    },
    player: {
      name: getStringAnswer(answers, 'player_name'),
      speed: getNumberAnswer(answers, 'player_speed'),
    },
    enemy: {
      name: getStringAnswer(answers, 'enemy_name'),
      spawn: {
        type: 'top_random',
        interval: getNumberAnswer(answers, 'enemy_spawn_interval'),
      },
      movement: {
        type: 'fall_down',
        speed: getNumberAnswer(answers, 'enemy_speed'),
      },
    },
    rules: [
      {
        id: 'game_over_on_enemy_collision',
        when: 'player_collides_with_enemy',
        then: 'game_over',
      },
    ],
    score: {
      type: 'survival_time',
    },
    states: ['title', 'playing', 'game_over'],
  }
}
