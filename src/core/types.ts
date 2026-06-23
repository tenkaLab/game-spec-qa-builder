export type QuestionNodeId = string
export type AnswerOptionId = string
export type SpecModuleId = string
export type ConstraintRuleId = string
export type GenerationParameterId = string
export type ProjectNodeId = string
export type ProjectEdgeId = string
export type CodeArtifactId = string
export type GenerationTraceEntryId = string

export type QuestionNode = {
  id: QuestionNodeId
  text: string
  options: AnswerOption[]
}

export type AnswerOption = {
  id: AnswerOptionId
  label: string
  addModuleIds?: SpecModuleId[]
  removeModuleIds?: SpecModuleId[]
  nextQuestionIds?: QuestionNodeId[]
}

export type SpecModuleCategory =
  | 'player'
  | 'enemy'
  | 'item'
  | 'rule'
  | 'score'
  | 'input'
  | 'ui'
  | 'scene'
  | 'system'

export type SpecModule = {
  id: SpecModuleId
  name: string
  category: SpecModuleCategory
  description: string
}

export type ConstraintRuleType = 'requires' | 'conflicts' | 'exclusive_group'

export type ConstraintRequirementMode = 'all' | 'any'

export type ConstraintRule = {
  id: ConstraintRuleId
  type: ConstraintRuleType
  targetModuleId: SpecModuleId
  relatedModuleIds: SpecModuleId[]
  requirementMode?: ConstraintRequirementMode
  message: string
  resolveQuestionIds?: QuestionNodeId[]
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export type DiagnosticType =
  | 'missing_requirement'
  | 'conflict'
  | 'exclusive_conflict'
  | 'unresolved_choice'
  | 'unknown_answer'
  | 'unknown_module'
  | 'unknown_parameter'

export type Diagnostic = {
  id: string
  severity: DiagnosticSeverity
  type: DiagnosticType
  message: string
  relatedModuleIds: SpecModuleId[]
  suggestedQuestionIds?: QuestionNodeId[]
}

export type ParameterValueType = 'number' | 'string' | 'boolean'

export type ParameterInputKind =
  | 'number'
  | 'text'
  | 'checkbox'
  | 'color'
  | 'assetPath'
  | 'select'

export type ParameterValue = number | string | boolean

export type ParameterSelectOption = {
  label: string
  value: string
}

export type GenerationParameterDefinition = {
  id: GenerationParameterId
  moduleId: SpecModuleId
  key: string
  label: string
  valueType: ParameterValueType
  inputKind: ParameterInputKind
  defaultValue: ParameterValue
  options?: ParameterSelectOption[]
}

export type SelectionHistoryAction =
  | 'select_answer'
  | 'unselect_answer'
  | 'set_parameter'

export type SelectionHistoryEntry =
  | {
      id: string
      action: 'select_answer'
      payload: {
        answerId: AnswerOptionId
      }
      createdAt: string
    }
  | {
      id: string
      action: 'unselect_answer'
      payload: {
        answerId: AnswerOptionId
      }
      createdAt: string
    }
  | {
      id: string
      action: 'set_parameter'
      payload: {
        parameterId: GenerationParameterId
        previousValue?: ParameterValue
        nextValue: ParameterValue
      }
      createdAt: string
    }

export type SelectionHistory = {
  entries: SelectionHistoryEntry[]
  currentIndex: number
}

export type BuildState = {
  selectedAnswerIds: AnswerOptionId[]
  parameterValues: Record<GenerationParameterId, ParameterValue>
  history: SelectionHistory
}

export type CandidateSpec = {
  moduleIds: SpecModuleId[]
}

export type SpecResolutionResult = {
  candidateSpec: CandidateSpec
  diagnostics: Diagnostic[]
  isGeneratable: boolean
}

export type ResolvedSpec = {
  id: string
  moduleIds: SpecModuleId[]
}

export type BuildDerivedState = {
  activeModuleIds: SpecModuleId[]
  diagnostics: Diagnostic[]
  pendingQuestionIds: QuestionNodeId[]
  candidateSpec: CandidateSpec
  resolvedSpec: ResolvedSpec | null
  isGeneratable: boolean
}

export type DefinitionData = {
  questions: QuestionNode[]
  modules: SpecModule[]
  constraints: ConstraintRule[]
  parameterDefinitions: GenerationParameterDefinition[]
}

export type BuildResolverInput = {
  definitions: DefinitionData
  state: BuildState
}

export type BuildResolverOutput = {
  derived: BuildDerivedState
}

export type ProjectNodeType =
  | 'question'
  | 'answer'
  | 'specModule'
  | 'parameter'
  | 'artifact'
  | 'diagnostic'

export type ProjectNode = {
  id: ProjectNodeId
  nodeType: ProjectNodeType
  refId: string
}

export type ProjectEdgeRelation =
  | 'depends_on'
  | 'generated_from'
  | 'parameterizes'

export type ProjectEdge = {
  id: ProjectEdgeId
  from: ProjectNodeId
  to: ProjectNodeId
  relation: ProjectEdgeRelation
}

export type ProjectGraph = {
  nodes: ProjectNode[]
  edges: ProjectEdge[]
}

export type CodeArtifactType = 'source' | 'config' | 'asset' | 'document'

export type CodeArtifact = {
  id: CodeArtifactId
  path: string
  content: string
  artifactType: CodeArtifactType
}

export type GenerationTraceEntry = {
  id: GenerationTraceEntryId
  sourceQuestionId?: QuestionNodeId
  sourceAnswerId?: AnswerOptionId
  sourceModuleIds: SpecModuleId[]
  sourceParameterIds: GenerationParameterId[]
  artifactId: CodeArtifactId
  generatedRegionId: string
  generatedRange?: {
    startLine: number
    endLine: number
  }
}

export type GenerationTrace = {
  entries: GenerationTraceEntry[]
}

export type CodeGeneratorInput = {
  definitions: DefinitionData
  resolvedSpec: ResolvedSpec
  parameterValues: Record<GenerationParameterId, ParameterValue>
}

export type CodeGeneratorOutput = {
  artifacts: CodeArtifact[]
  trace: GenerationTrace
}

export type CodeGenerator = (
  input: CodeGeneratorInput,
) => CodeGeneratorOutput
