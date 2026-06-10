'use client'

import { buildAlgorithmLessons, type LessonTab } from '@/lib/algorithm-lessons'
import { getExecutionProgram } from '@/lib/execution'
import { ALGORITHM_MODULES } from '@/lib/algorithms'
import { useDemoStore } from '@/store/demo-store'
import { AlgorithmControls } from './AlgorithmControls'

const TABS: { id: LessonTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'execution', label: 'Execution' },
  { id: 'data-structures', label: 'Data Structures' },
  { id: 'pseudocode', label: 'Pseudocode' },
  { id: 'result', label: 'Result' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="lesson-kicker">{children}</div>
}

export function NarrativePanel() {
  const { selectedAlgo, currentStep, executionMode, activeTab, setActiveTab, graphData, setStep } = useDemoStore()
  if (!graphData) return <aside className="lesson-panel" />

  const lesson = buildAlgorithmLessons(graphData)[selectedAlgo]
  const program = getExecutionProgram(graphData, selectedAlgo)
  const executionSteps = executionMode === 'full' ? program.full : program.guided
  const step = executionSteps[currentStep] ?? executionSteps[0]
  const results = ALGORITHM_MODULES[selectedAlgo].getResults(graphData)

  return (
    <aside className="lesson-panel">
      <div className="lesson-heading">
        <SectionLabel>Guided execution</SectionLabel>
        <h1>{lesson.title}</h1>
        <p>{lesson.question}</p>
        <div className="complexity-row">
          <span>Time {lesson.timeComplexity}</span>
          <span>Space {lesson.spaceComplexity}</span>
        </div>
      </div>

      <div className="lesson-tabs" role="tablist" aria-label="Algorithm lesson sections">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lesson-body">
        {activeTab === 'overview' && (
          <div className="lesson-section">
            <SectionLabel>Why TraceNet needs it</SectionLabel>
            <p>{lesson.traceNetRole}</p>
            <SectionLabel>Intuition</SectionLabel>
            <p>{lesson.intuition}</p>
            <SectionLabel>Input</SectionLabel>
            <p>{lesson.inputDescription}</p>
            <button className="begin-execution" onClick={() => setActiveTab('execution')}>Begin guided execution →</button>
          </div>
        )}

        {activeTab === 'execution' && (
          <div className="lesson-section execution-section">
            <div className="step-rail" aria-label="Execution steps">
              {executionSteps.length <= 40 && executionSteps.map((item, index) => (
                <button
                  key={item.title}
                  className={index === currentStep ? 'active' : index < currentStep ? 'complete' : ''}
                  onClick={() => setStep(index)}
                  title={item.title}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <h2 className="active-step-heading">Step {currentStep + 1}: {step.title}</h2>
            <div className="step-phase">{step.phase}</div>
            <div className="explanation-card action-card"><strong>Operation</strong><p>{step.action}</p></div>
            <div className="explanation-card"><strong>Why this is valid</strong><p>{step.reason}</p></div>
            <div className="explanation-card visual-card"><strong>What changed in the graph</strong><p>{step.visualExplanation}</p></div>
            {step.calculation && <div className="calculation-card"><strong>Calculation</strong><code>{step.calculation}</code></div>}
            <div className="state-card">
              <strong>{step.dataStructureLabel}</strong>
              <dl>
                {step.dataStructureState.map(entry => (
                  <div key={entry.key}><dt>{entry.key}</dt><dd>{entry.value}</dd></div>
                ))}
              </dl>
            </div>
            <div className="takeaway-card"><strong>Plain-language takeaway</strong><p>{step.takeaway}</p></div>
            <div className="next-step">
              <span>Next</span>
              {currentStep < executionSteps.length - 1 ? executionSteps[currentStep + 1].title : 'Interpret the final result'}
            </div>
          </div>
        )}

        {activeTab === 'data-structures' && (
          <div className="lesson-section">
            {lesson.dataStructures.map(item => (
              <article className="data-structure-card" key={item.name}>
                <h3>{item.name}</h3>
                <p>{item.purpose}</p>
                <code>{item.representation}</code>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'pseudocode' && (
          <div className="lesson-section">
            <p className="tab-intro">Lines used by the current visual step are highlighted.</p>
            <ol className="pseudocode">
              {lesson.pseudocode.map(line => (
                <li key={line.line} className={step.pseudocodeLines.includes(line.line) ? 'active' : ''}>
                  <span>{line.line}</span><code>{line.code}</code>
                </li>
              ))}
            </ol>
          </div>
        )}

        {activeTab === 'result' && (
          <div className="lesson-section">
            <SectionLabel>Computed result</SectionLabel>
            <div className="result-grid">
              {results.map(result => (
                <div className="result-card" key={result.label}><strong>{result.value}</strong><span>{result.label}</span></div>
              ))}
            </div>
            <SectionLabel>Biological interpretation</SectionLabel>
            <p className="result-interpretation">{lesson.resultInterpretation}</p>
            <SectionLabel>Limitations and assumptions</SectionLabel>
            <ul className="limitations">
              {lesson.limitations.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>

      <AlgorithmControls />
    </aside>
  )
}
