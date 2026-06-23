import { resolveBuildState } from './resolver.ts'
import { createEmptyBuildState, sampleDefinitionData } from './sampleData.ts'
import type {
  AnswerOptionId,
  BuildDerivedState,
  DefinitionData,
} from './types.ts'

export type ResolverCheckResult = {
  name: string
  derived: BuildDerivedState
}

function resolveAnswers(
  selectedAnswerIds: AnswerOptionId[],
  definitions: DefinitionData = sampleDefinitionData,
): BuildDerivedState {
  const state = createEmptyBuildState()
  state.selectedAnswerIds = selectedAnswerIds
  return resolveBuildState({ definitions, state }).derived
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Resolver check failed: ${message}`)
}

export function runResolverChecks(): ResolverCheckResult[] {
  const normal = resolveAnswers([
    'answer_move_4dir',
    'answer_defeat_collision',
    'answer_score_time',
  ])
  assert(normal.activeModuleIds.includes('player_move_4dir'), '4方向移動')
  assert(normal.activeModuleIds.includes('collision_game_over'), '衝突ルール')
  assert(normal.activeModuleIds.includes('enemy_spawn_from_top'), '敵出現')
  assert(normal.activeModuleIds.includes('score_by_time'), '時間スコア')
  assert(!normal.diagnostics.some((item) => item.severity === 'error'), '正常系')
  assert(normal.isGeneratable && normal.resolvedSpec !== null, '仕様確定')

  const missing = resolveAnswers(['answer_score_item'])
  assert(
    missing.diagnostics.some((item) => item.type === 'missing_requirement'),
    '不足検出',
  )
  assert(!missing.isGeneratable && missing.resolvedSpec === null, '不足時の生成停止')
  assert(missing.pendingQuestionIds.includes('question_item_spawn'), '解消質問')

  const conflict = resolveAnswers([
    'answer_move_4dir',
    'answer_move_side_scroll',
  ])
  assert(
    conflict.diagnostics.some((item) => item.type === 'exclusive_conflict'),
    '排他競合',
  )
  assert(!conflict.isGeneratable && conflict.resolvedSpec === null, '競合時の生成停止')

  const state = createEmptyBuildState()
  state.history.entries = [
    {
      id: 'history-1',
      action: 'select_answer',
      payload: { answerId: 'answer_move_4dir' },
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'history-2',
      action: 'unselect_answer',
      payload: { answerId: 'answer_move_4dir' },
      createdAt: '2026-01-01T00:01:00.000Z',
    },
    {
      id: 'history-3',
      action: 'set_parameter',
      payload: { parameterId: 'parameter_player_speed', nextValue: 6 },
      createdAt: '2026-01-01T00:02:00.000Z',
    },
  ]
  assert(state.history.entries.length === 3, '履歴アクション')

  const unknownAnswer = resolveAnswers([
    'answer_move_4dir',
    'answer_does_not_exist',
  ])
  assert(unknownAnswer.activeModuleIds.includes('player_move_4dir'), '未知回答後の継続')
  assert(
    unknownAnswer.diagnostics.some(
      (item) =>
        item.id === 'unknown_answer:answer_does_not_exist' &&
        item.type === 'unknown_answer',
    ),
    '未知回答診断',
  )
  assert(
    !unknownAnswer.isGeneratable && unknownAnswer.resolvedSpec === null,
    '未知回答時の生成停止',
  )

  const duplicateAnswer = resolveAnswers([
    'answer_move_4dir',
    'answer_move_4dir',
  ])
  assert(
    duplicateAnswer.activeModuleIds.length ===
      new Set(duplicateAnswer.activeModuleIds).size,
    '回答重複時のModule一意性',
  )
  assert(
    duplicateAnswer.diagnostics.length ===
      new Set(duplicateAnswer.diagnostics.map((item) => item.id)).size,
    '回答重複時のDiagnostic一意性',
  )

  const requiresAnySatisfied = resolveAnswers([
    'answer_move_side_scroll',
    'answer_score_time',
  ])
  assert(
    !requiresAnySatisfied.diagnostics.some(
      (item) => item.id.includes('score_by_time'),
    ),
    'requires any充足',
  )

  const requiresAnyMissing = resolveAnswers(['answer_score_time'])
  assert(
    requiresAnyMissing.diagnostics.some(
      (item) => item.type === 'missing_requirement',
    ),
    'requires any不足',
  )

  const duplicatePendingDefinitions: DefinitionData = {
    ...sampleDefinitionData,
    constraints: [
      ...sampleDefinitionData.constraints,
      {
        id: 'requires_enemy_for_item_score',
        type: 'requires',
        targetModuleId: 'item_collect_score',
        relatedModuleIds: ['enemy_spawn_from_top'],
        message: 'この確認ケースでは敵出現も必要です。',
        resolveQuestionIds: ['question_item_spawn'],
      },
    ],
  }
  const duplicatePending = resolveAnswers(
    ['answer_score_item'],
    duplicatePendingDefinitions,
  )
  assert(duplicatePending.diagnostics.length >= 2, '複数診断')
  assert(
    duplicatePending.pendingQuestionIds.filter(
      (questionId) => questionId === 'question_item_spawn',
    ).length === 1,
    '追加質問IDの一意性',
  )

  return [
    { name: '正常系', derived: normal },
    { name: '不足検出', derived: missing },
    { name: '競合検出', derived: conflict },
    { name: '未知Answer', derived: unknownAnswer },
    { name: 'Answer重複', derived: duplicateAnswer },
    { name: 'requires any充足', derived: requiresAnySatisfied },
    { name: 'requires any不足', derived: requiresAnyMissing },
    { name: 'pendingQuestionIds重複排除', derived: duplicatePending },
  ]
}
