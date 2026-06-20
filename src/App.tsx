import { useState } from 'react'
import { OutputPreview } from './components/OutputPreview'
import { QuestionForm } from './components/QuestionForm'
import { TemplateSelect } from './components/TemplateSelect'
import { buildGameSpec } from './core/buildGameSpec'
import { buildSpecMarkdown } from './core/buildSpecMarkdown'
import type { AnswerMap, GameSpec } from './core/types'
import { dodgeGameBasic } from './data/dodgeGameBasic'
import './styles/app.css'

type Screen = 'select' | 'form' | 'output'

interface GeneratedOutput {
  spec: GameSpec
  markdown: string
  jsonText: string
}

function App() {
  const [screen, setScreen] = useState<Screen>('select')
  const [savedAnswers, setSavedAnswers] = useState<AnswerMap>()
  const [output, setOutput] = useState<GeneratedOutput>()

  const handleGenerate = (answers: AnswerMap) => {
    const spec = buildGameSpec(dodgeGameBasic, answers)
    const markdown = buildSpecMarkdown(spec)

    setSavedAnswers(answers)
    setOutput({
      spec,
      markdown,
      jsonText: JSON.stringify(spec, null, 2),
    })
    setScreen('output')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-version">バージョン 0.1</p>
        <h1>ゲーム仕様Q&amp;Aビルダー</h1>
        <p>質問に答えて、ゲーム仕様と設定JSONを作る</p>
      </header>

      <main>
        {screen === 'select' && (
          <TemplateSelect
            template={dodgeGameBasic}
            onSelect={() => setScreen('form')}
          />
        )}

        {screen === 'form' && (
          <QuestionForm
            template={dodgeGameBasic}
            initialAnswers={savedAnswers}
            onBack={() => setScreen('select')}
            onSubmit={handleGenerate}
          />
        )}

        {screen === 'output' && output && (
          <OutputPreview
            spec={output.spec}
            markdown={output.markdown}
            jsonText={output.jsonText}
            onBack={() => setScreen('form')}
          />
        )}
      </main>
    </div>
  )
}

export default App
