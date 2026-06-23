import type {
  AnswerOption,
  AnswerOptionId,
  BuildResolverInput,
  BuildResolverOutput,
  ConstraintRule,
  Diagnostic,
  DiagnosticType,
  QuestionNodeId,
  ResolvedSpec,
  SpecModuleId,
} from './types.ts'

type AnswerLookupEntry = {
  option: AnswerOption
  questionId: QuestionNodeId
}

function createAnswerLookup(
  input: BuildResolverInput,
): Map<AnswerOptionId, AnswerLookupEntry> {
  const lookup = new Map<AnswerOptionId, AnswerLookupEntry>()

  for (const question of input.definitions.questions) {
    for (const option of question.options) {
      lookup.set(option.id, { option, questionId: question.id })
    }
  }

  return lookup
}

function suggestedQuestions(
  rule: ConstraintRule,
): Pick<Diagnostic, 'suggestedQuestionIds'> | object {
  return rule.resolveQuestionIds
    ? { suggestedQuestionIds: rule.resolveQuestionIds }
    : {}
}

function createDiagnosticId(
  type: DiagnosticType,
  relatedIds: string[],
): string {
  return `${type}:${[...new Set(relatedIds)].sort().join(':')}`
}

function evaluateConstraint(
  rule: ConstraintRule,
  activeModules: ReadonlySet<SpecModuleId>,
): Diagnostic | null {
  if (rule.type === 'requires') {
    if (!activeModules.has(rule.targetModuleId)) return null

    const missingModuleIds = rule.relatedModuleIds.filter(
      (moduleId) => !activeModules.has(moduleId),
    )
    const requirementMode = rule.requirementMode ?? 'all'
    const isSatisfied =
      requirementMode === 'all'
        ? missingModuleIds.length === 0
        : missingModuleIds.length < rule.relatedModuleIds.length
    if (isSatisfied) return null

    const diagnosticModuleIds =
      requirementMode === 'any' ? rule.relatedModuleIds : missingModuleIds

    return {
      id: createDiagnosticId('missing_requirement', [
        rule.targetModuleId,
        ...diagnosticModuleIds,
      ]),
      severity: 'error',
      type: 'missing_requirement',
      message: rule.message,
      relatedModuleIds: [rule.targetModuleId, ...diagnosticModuleIds],
      ...suggestedQuestions(rule),
    }
  }

  if (rule.type === 'conflicts') {
    if (!activeModules.has(rule.targetModuleId)) return null

    const conflictingModuleIds = rule.relatedModuleIds.filter((moduleId) =>
      activeModules.has(moduleId),
    )
    if (conflictingModuleIds.length === 0) return null

    return {
      id: createDiagnosticId('conflict', [
        rule.targetModuleId,
        ...conflictingModuleIds,
      ]),
      severity: 'error',
      type: 'conflict',
      message: rule.message,
      relatedModuleIds: [rule.targetModuleId, ...conflictingModuleIds],
      ...suggestedQuestions(rule),
    }
  }

  const groupModuleIds = [rule.targetModuleId, ...rule.relatedModuleIds]
  const activeGroupModuleIds = groupModuleIds.filter((moduleId) =>
    activeModules.has(moduleId),
  )
  if (activeGroupModuleIds.length < 2) return null

  return {
    id: createDiagnosticId('exclusive_conflict', activeGroupModuleIds),
    severity: 'error',
    type: 'exclusive_conflict',
    message: rule.message,
    relatedModuleIds: activeGroupModuleIds,
    ...suggestedQuestions(rule),
  }
}

function createResolvedSpec(moduleIds: SpecModuleId[]): ResolvedSpec {
  return {
    id: `resolved:${moduleIds.length > 0 ? moduleIds.join('+') : 'empty'}`,
    moduleIds: [...moduleIds],
  }
}

export function resolveBuildState(
  input: BuildResolverInput,
): BuildResolverOutput {
  const answerLookup = createAnswerLookup(input)
  const selectedAnswers: AnswerLookupEntry[] = []
  const diagnostics: Diagnostic[] = []
  const seenAnswerIds = new Set<AnswerOptionId>()

  for (const answerId of input.state.selectedAnswerIds) {
    if (seenAnswerIds.has(answerId)) continue
    seenAnswerIds.add(answerId)

    const answer = answerLookup.get(answerId)
    if (answer) {
      selectedAnswers.push(answer)
    } else {
      diagnostics.push({
        id: `unknown_answer:${answerId}`,
        severity: 'error',
        type: 'unknown_answer',
        message: `選択肢「${answerId}」が定義されていません。`,
        relatedModuleIds: [],
      })
    }
  }

  const addedModuleIds = new Set<SpecModuleId>()
  const removedModuleIds = new Set<SpecModuleId>()
  for (const { option } of selectedAnswers) {
    for (const moduleId of option.addModuleIds ?? []) {
      addedModuleIds.add(moduleId)
    }
    for (const moduleId of option.removeModuleIds ?? []) {
      removedModuleIds.add(moduleId)
    }
  }

  const activeModuleSet = new Set(
    [...addedModuleIds].filter((moduleId) => !removedModuleIds.has(moduleId)),
  )
  const definedModuleIds = new Set(
    input.definitions.modules.map((module) => module.id),
  )

  for (const moduleId of activeModuleSet) {
    if (!definedModuleIds.has(moduleId)) {
      diagnostics.push({
        id: `unknown_module:${moduleId}`,
        severity: 'error',
        type: 'unknown_module',
        message: `仕様モジュール「${moduleId}」が定義されていません。`,
        relatedModuleIds: [moduleId],
      })
    }
  }

  const activeModuleIds = input.definitions.modules
    .map((module) => module.id)
    .filter((moduleId) => activeModuleSet.has(moduleId))

  const definedParameterIds = new Set(
    input.definitions.parameterDefinitions.map((parameter) => parameter.id),
  )
  for (const parameterId of Object.keys(input.state.parameterValues)) {
    if (!definedParameterIds.has(parameterId)) {
      diagnostics.push({
        id: `unknown_parameter:${parameterId}`,
        severity: 'error',
        type: 'unknown_parameter',
        message: `生成パラメータ「${parameterId}」が定義されていません。`,
        relatedModuleIds: [],
      })
    }
  }

  for (const rule of input.definitions.constraints) {
    const diagnostic = evaluateConstraint(rule, activeModuleSet)
    if (diagnostic) diagnostics.push(diagnostic)
  }

  const uniqueDiagnostics = [
    ...new Map(diagnostics.map((diagnostic) => [diagnostic.id, diagnostic])).values(),
  ]

  const selectedQuestionIds = new Set(
    selectedAnswers.map((answer) => answer.questionId),
  )
  const definedQuestionIds = new Set(
    input.definitions.questions.map((question) => question.id),
  )
  const pendingQuestionIds: QuestionNodeId[] = []
  const pendingQuestionSet = new Set<QuestionNodeId>()

  const addPendingQuestion = (
    questionId: QuestionNodeId,
    includeAnswered: boolean,
  ) => {
    if (
      definedQuestionIds.has(questionId) &&
      (includeAnswered || !selectedQuestionIds.has(questionId)) &&
      !pendingQuestionSet.has(questionId)
    ) {
      pendingQuestionSet.add(questionId)
      pendingQuestionIds.push(questionId)
    }
  }

  for (const { option } of selectedAnswers) {
    for (const questionId of option.nextQuestionIds ?? []) {
      addPendingQuestion(questionId, false)
    }
  }
  for (const diagnostic of uniqueDiagnostics) {
    for (const questionId of diagnostic.suggestedQuestionIds ?? []) {
      addPendingQuestion(questionId, true)
    }
  }

  const candidateSpec = { moduleIds: activeModuleIds }
  const isGeneratable = !uniqueDiagnostics.some(
    (diagnostic) => diagnostic.severity === 'error',
  )

  return {
    derived: {
      activeModuleIds,
      diagnostics: uniqueDiagnostics,
      pendingQuestionIds,
      candidateSpec,
      resolvedSpec: isGeneratable
        ? createResolvedSpec(activeModuleIds)
        : null,
      isGeneratable,
    },
  }
}
