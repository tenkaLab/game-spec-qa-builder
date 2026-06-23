import { useMemo, useState } from 'react'
import {
  generateCanvasGameCode,
  validateGenerationOutput,
} from './core/codeGenerator.ts'
import { resolveBuildState } from './core/resolver.ts'
import {
  createEmptyBuildState,
  sampleDefinitionData,
} from './core/sampleData.ts'
import type {
  AnswerOptionId,
  BuildState,
  CodeArtifact,
  CodeGeneratorOutput,
  GenerationParameterDefinition,
  ParameterValue,
  SelectionHistory,
  SelectionHistoryEntry,
} from './core/types.ts'

function appendHistory(
  history: SelectionHistory,
  entry: SelectionHistoryEntry,
): SelectionHistory {
  const retainedEntries = history.entries.slice(0, history.currentIndex + 1)
  return {
    entries: [...retainedEntries, entry],
    currentIndex: retainedEntries.length,
  }
}

function getDownloadedFileName(path: string): string {
  return path.split('/').pop() || 'artifact.txt'
}

function downloadTextFile(path: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = getDownloadedFileName(path)
  anchor.click()
  URL.revokeObjectURL(url)
}

function createArtifactsBundle(artifacts: CodeArtifact[]): string {
  return artifacts
    .map((artifact) => `===== ${artifact.path} =====\n${artifact.content}`)
    .join('\n\n')
}

function App() {
  const [buildState, setBuildState] = useState<BuildState>(
    createEmptyBuildState,
  )
  const [generatedOutput, setGeneratedOutput] =
    useState<CodeGeneratorOutput | null>(null)
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  )
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)

  const { derived } = useMemo(
    () =>
      resolveBuildState({
        definitions: sampleDefinitionData,
        state: buildState,
      }),
    [buildState],
  )

  const activeParameterDefinitions = useMemo(
    () =>
      sampleDefinitionData.parameterDefinitions.filter((parameter) =>
        derived.activeModuleIds.includes(parameter.moduleId),
      ),
    [derived.activeModuleIds],
  )

  const selectedArtifact = useMemo(
    () =>
      generatedOutput?.artifacts.find(
        (artifact) => artifact.id === selectedArtifactId,
      ) ??
      generatedOutput?.artifacts[0] ??
      null,
    [generatedOutput, selectedArtifactId],
  )

  const traceValidationMessages = useMemo(
    () => (generatedOutput ? validateGenerationOutput(generatedOutput) : []),
    [generatedOutput],
  )

  const clearGeneratedOutput = () => {
    setGeneratedOutput(null)
    setSelectedArtifactId(null)
    setCopyMessage(null)
    setDownloadMessage(null)
  }

  const toggleAnswer = (answerId: AnswerOptionId) => {
    clearGeneratedOutput()
    setBuildState((current) => {
      const isSelected = current.selectedAnswerIds.includes(answerId)
      const historyEntry: SelectionHistoryEntry = {
        id: `history:${Date.now()}:${answerId}`,
        action: isSelected ? 'unselect_answer' : 'select_answer',
        payload: { answerId },
        createdAt: new Date().toISOString(),
      }

      return {
        ...current,
        selectedAnswerIds: isSelected
          ? current.selectedAnswerIds.filter((id) => id !== answerId)
          : [...current.selectedAnswerIds, answerId],
        history: appendHistory(current.history, historyEntry),
      }
    })
  }

  const updateParameter = (
    parameter: GenerationParameterDefinition,
    nextValue: ParameterValue,
  ) => {
    clearGeneratedOutput()
    setBuildState((current) => {
      const previousValue =
        current.parameterValues[parameter.id] ?? parameter.defaultValue
      if (Object.is(previousValue, nextValue)) return current

      const historyEntry: SelectionHistoryEntry = {
        id: `history:${Date.now()}:${parameter.id}`,
        action: 'set_parameter',
        payload: {
          parameterId: parameter.id,
          previousValue,
          nextValue,
        },
        createdAt: new Date().toISOString(),
      }

      return {
        ...current,
        parameterValues: {
          ...current.parameterValues,
          [parameter.id]: nextValue,
        },
        history: appendHistory(current.history, historyEntry),
      }
    })
  }

  const generateCode = () => {
    if (!derived.resolvedSpec) return

    const output = generateCanvasGameCode({
      definitions: sampleDefinitionData,
      resolvedSpec: derived.resolvedSpec,
      parameterValues: buildState.parameterValues,
    })
    setGeneratedOutput(output)
    setSelectedArtifactId(output.artifacts[0]?.id ?? null)
    setCopyMessage(null)
    setDownloadMessage(null)
  }

  const copySelectedArtifact = async () => {
    if (!selectedArtifact) return

    try {
      if (!navigator.clipboard) throw new Error('Clipboard API is unavailable')
      await navigator.clipboard.writeText(selectedArtifact.content)
      setCopyMessage('選択中のArtifactをコピーしました。')
    } catch {
      setCopyMessage('コピーに失敗しました。')
    }
  }

  const downloadSelectedArtifact = () => {
    if (!selectedArtifact) return

    try {
      downloadTextFile(selectedArtifact.path, selectedArtifact.content)
      setDownloadMessage(
        `Downloaded ${getDownloadedFileName(selectedArtifact.path)}`,
      )
    } catch {
      setDownloadMessage('ダウンロードに失敗しました。')
    }
  }

  const downloadArtifactsBundle = () => {
    if (!generatedOutput) return

    try {
      downloadTextFile(
        'generated-artifacts.txt',
        createArtifactsBundle(generatedOutput.artifacts),
      )
      setDownloadMessage('Generated bundle text download started')
    } catch {
      setDownloadMessage('ダウンロードに失敗しました。')
    }
  }

  const renderParameterInput = (parameter: GenerationParameterDefinition) => {
    const currentValue =
      buildState.parameterValues[parameter.id] ?? parameter.defaultValue
    const inputId = `parameter-${parameter.id}`

    if (parameter.inputKind === 'number') {
      return (
        <input
          id={inputId}
          type="number"
          value={String(currentValue)}
          onChange={(event) =>
            updateParameter(parameter, Number(event.target.value))
          }
        />
      )
    }

    if (parameter.inputKind === 'checkbox') {
      return (
        <input
          id={inputId}
          type="checkbox"
          checked={Boolean(currentValue)}
          onChange={(event) => updateParameter(parameter, event.target.checked)}
        />
      )
    }

    if (parameter.inputKind === 'color') {
      return (
        <input
          id={inputId}
          type="color"
          value={String(currentValue)}
          onChange={(event) => updateParameter(parameter, event.target.value)}
        />
      )
    }

    if (parameter.inputKind === 'select') {
      if (!parameter.options || parameter.options.length === 0) {
        return <p className="unsupported">選択肢が未定義です。</p>
      }

      return (
        <select
          id={inputId}
          value={String(currentValue)}
          onChange={(event) => updateParameter(parameter, event.target.value)}
        >
          {parameter.options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        id={inputId}
        type="text"
        value={String(currentValue)}
        onChange={(event) => updateParameter(parameter, event.target.value)}
      />
    )
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">Core UI Connection</p>
        <h1>Q&amp;A Builder</h1>
        <p>選択による仕様モジュール合成と診断結果を確認する開発画面です。</p>
      </header>

      <section className="panel" aria-labelledby="questions-heading">
        <h2 id="questions-heading">Questions</h2>
        <div className="question-list">
          {sampleDefinitionData.questions.map((question) => (
            <article className="question-card" key={question.id}>
              <h3>{question.text}</h3>
              <div className="option-list">
                {question.options.map((option) => {
                  const isSelected = buildState.selectedAnswerIds.includes(
                    option.id,
                  )

                  return (
                    <button
                      type="button"
                      className={isSelected ? 'option selected' : 'option'}
                      aria-pressed={isSelected}
                      key={option.id}
                      onClick={() => toggleAnswer(option.id)}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="result-grid">
        <section className="panel" aria-labelledby="modules-heading">
          <h2 id="modules-heading">Active Modules</h2>
          {derived.activeModuleIds.length > 0 ? (
            <ul className="code-list">
              {derived.activeModuleIds.map((moduleId) => (
                <li key={moduleId}>{moduleId}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">なし</p>
          )}
        </section>

        <section className="panel" aria-labelledby="diagnostics-heading">
          <h2 id="diagnostics-heading">Diagnostics</h2>
          {derived.diagnostics.length > 0 ? (
            <ul className="diagnostic-list">
              {derived.diagnostics.map((diagnostic) => (
                <li className={diagnostic.severity} key={diagnostic.id}>
                  <p className="diagnostic-meta">
                    {diagnostic.severity} / {diagnostic.type}
                  </p>
                  <p>{diagnostic.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">なし</p>
          )}
        </section>

        <section className="panel" aria-labelledby="pending-heading">
          <h2 id="pending-heading">Pending Questions</h2>
          {derived.pendingQuestionIds.length > 0 ? (
            <ul>
              {derived.pendingQuestionIds.map((questionId) => {
                const question = sampleDefinitionData.questions.find(
                  (item) => item.id === questionId,
                )
                return (
                  <li key={questionId}>
                    <code>{questionId}</code>
                    {question ? ` — ${question.text}` : ''}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="empty">なし</p>
          )}
        </section>

        <section className="panel" aria-labelledby="status-heading">
          <h2 id="status-heading">Generate Status</h2>
          <p className={derived.isGeneratable ? 'status ready' : 'status blocked'}>
            生成可能: {derived.isGeneratable ? 'true' : 'false'}
          </p>
          {derived.resolvedSpec && (
            <div className="resolved-spec">
              <p>
                ID: <code>{derived.resolvedSpec.id}</code>
              </p>
              <p>Modules:</p>
              <ul className="code-list">
                {derived.resolvedSpec.moduleIds.map((moduleId) => (
                  <li key={moduleId}>{moduleId}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {activeParameterDefinitions.length > 0 && (
        <section className="panel" aria-labelledby="parameters-heading">
          <h2 id="parameters-heading">Generation Parameters</h2>
          <p className="section-description">
            有効な仕様モジュールに紐づくコード生成用パラメータです。
          </p>
          <div className="parameter-grid">
            {activeParameterDefinitions.map((parameter) => {
              const currentValue =
                buildState.parameterValues[parameter.id] ??
                parameter.defaultValue

              return (
                <article className="parameter-card" key={parameter.id}>
                  <label htmlFor={`parameter-${parameter.id}`}>
                    {parameter.label}
                  </label>
                  <dl className="parameter-meta">
                    <div>
                      <dt>key</dt>
                      <dd>{parameter.key}</dd>
                    </div>
                    <div>
                      <dt>module</dt>
                      <dd>{parameter.moduleId}</dd>
                    </div>
                    <div>
                      <dt>input</dt>
                      <dd>{parameter.inputKind}</dd>
                    </div>
                  </dl>
                  <div className="parameter-control">
                    {renderParameterInput(parameter)}
                  </div>
                  <p className="current-value">
                    current: <code>{String(currentValue)}</code>
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {derived.resolvedSpec && (
        <section className="panel generate-panel" aria-labelledby="generate-heading">
          <div>
            <h2 id="generate-heading">Code Generator</h2>
            <p>確定仕様と有効Parameterから最小Canvasゲームを生成します。</p>
          </div>
          <button type="button" className="generate-button" onClick={generateCode}>
            Generate Code
          </button>
        </section>
      )}

      {generatedOutput && (
        <section className="generated-output" aria-labelledby="artifacts-heading">
          <div className="panel">
            <div className="artifact-panel-heading">
              <div>
                <h2 id="artifacts-heading">Generated Artifacts</h2>
                <p>
                  Bundleは全Artifactをパス見出し付きの1ファイルにまとめます。
                </p>
              </div>
              <button type="button" onClick={downloadArtifactsBundle}>
                Download artifacts bundle text
              </button>
            </div>
            {downloadMessage && (
              <p
                className={
                  downloadMessage === 'ダウンロードに失敗しました。'
                    ? 'download-message error'
                    : 'download-message'
                }
                role="status"
              >
                {downloadMessage}
              </p>
            )}
            <div className="artifact-selector">
              {generatedOutput.artifacts.map((artifact) => (
                <button
                  type="button"
                  className={
                    selectedArtifact?.id === artifact.id
                      ? 'artifact-option selected'
                      : 'artifact-option'
                  }
                  aria-pressed={selectedArtifact?.id === artifact.id}
                  key={artifact.id}
                  onClick={() => {
                    setSelectedArtifactId(artifact.id)
                    setCopyMessage(null)
                    setDownloadMessage(null)
                  }}
                >
                  <strong>{artifact.path}</strong>
                  <span>[{artifact.artifactType}]</span>
                  <span>{artifact.content.length} chars</span>
                </button>
              ))}
            </div>

            {selectedArtifact && (
              <div className="code-preview">
                <header>
                  <div>
                    <h3>Code Preview</h3>
                    <p>Original path: {selectedArtifact.path}</p>
                    <p>
                      Downloaded file name:{' '}
                      {getDownloadedFileName(selectedArtifact.path)}
                    </p>
                  </div>
                  <div className="artifact-actions">
                    <button type="button" onClick={copySelectedArtifact}>
                      Copy selected artifact
                    </button>
                    <button type="button" onClick={downloadSelectedArtifact}>
                      Download selected artifact
                    </button>
                  </div>
                </header>
                {copyMessage && (
                  <p
                    className={
                      copyMessage === 'コピーに失敗しました。'
                        ? 'copy-message error'
                        : 'copy-message'
                    }
                    role="status"
                  >
                    {copyMessage}
                  </p>
                )}
                <pre>{selectedArtifact.content}</pre>
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Generation Trace</h2>
            <div className="trace-validation">
              {traceValidationMessages.length === 0 ? (
                <p className="validation-ok">Trace validation: OK</p>
              ) : (
                <>
                  <p>Trace validation:</p>
                  <ul>
                    {traceValidationMessages.map((message, index) => (
                      <li key={`${index}:${message}`}>{message}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="trace-list">
              {generatedOutput.trace.entries.map((entry) => (
                <article className="trace-card" key={entry.id}>
                  <h3>{entry.generatedRegionId}</h3>
                  <dl>
                    <div>
                      <dt>artifact</dt>
                      <dd>{entry.artifactId}</dd>
                    </div>
                    <div>
                      <dt>modules</dt>
                      <dd>{entry.sourceModuleIds.join(', ') || 'なし'}</dd>
                    </div>
                    <div>
                      <dt>parameters</dt>
                      <dd>{entry.sourceParameterIds.join(', ') || 'なし'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
