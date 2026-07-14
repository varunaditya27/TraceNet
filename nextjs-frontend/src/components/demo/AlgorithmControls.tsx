'use client'

import { useDemoStore } from '@/store/demo-store'

const SPEEDS = [0.5, 1, 1.5, 2]

// Only these algorithms have a genuinely distinct "full execution" trace generator
// (src/lib/execution/index.ts). Everything else falls back to `full: guided` — an
// identical array — so offering the toggle there would let a user pick a "mode" that
// changes nothing.
const ALGOS_WITH_DISTINCT_FULL_MODE = new Set(['bfs', 'scc', 'boyer_moore', 'floyd_warshall'])

export function AlgorithmControls() {
  const {
    currentStep,
    selectedAlgo,
    totalSteps,
    isPlaying,
    speed,
    executionMode,
    prevStep,
    nextStep,
    togglePlay,
    restart,
    setSpeed,
    setExecutionMode,
    jumpToPhase,
    setStep,
  } = useDemoStore()
  const atStart = currentStep === 0
  const atEnd = totalSteps === 0 || currentStep >= totalSteps - 1
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0
  const nodeCount = useDemoStore.getState().graphData?.meta.n_nodes ?? 16
  const phaseSize = nodeCount * nodeCount
  const currentK = Math.floor(currentStep / phaseSize)
  const currentI = Math.floor((currentStep % phaseSize) / nodeCount)
  const currentJ = currentStep % nodeCount
  const jumpToTriple = (k: number, i: number, j: number) => {
    setStep(k * phaseSize + i * nodeCount + j)
  }

  return (
    <div className="demo-controls" aria-label="Algorithm playback controls">
      <div className="demo-progress-row">
        <span>Step {totalSteps ? currentStep + 1 : 0} of {totalSteps}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="demo-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="demo-control-row">
        <button className="control-button" onClick={prevStep} disabled={atStart} title="Previous step">
          <span aria-hidden="true">←</span><span>Previous</span>
        </button>
        <button className="control-button control-primary" onClick={togglePlay} disabled={totalSteps < 2 || (atEnd && !isPlaying)}>
          <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span><span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button className="control-button" onClick={nextStep} disabled={atEnd} title="Next step">
          <span>Next</span><span aria-hidden="true">→</span>
        </button>
        <button className="control-button control-quiet" onClick={restart} disabled={atStart && !isPlaying}>
          <span aria-hidden="true">↺</span><span>Restart</span>
        </button>
        <label className="speed-control">
          <span>Speed</span>
          <select value={speed} onChange={event => setSpeed(Number(event.target.value))}>
            {SPEEDS.map(value => <option key={value} value={value}>{value}x</option>)}
          </select>
        </label>
      </div>
      <div className="execution-mode-row">
        {ALGOS_WITH_DISTINCT_FULL_MODE.has(selectedAlgo) ? (
          <label>
            <span>Mode</span>
            <select value={executionMode} onChange={event => setExecutionMode(event.target.value as 'guided' | 'full')}>
              <option value="guided">Guided mode</option>
              <option value="full">Full execution</option>
            </select>
          </label>
        ) : (
          <span className="mode-static-label">Guided mode</span>
        )}
        {executionMode === 'full' && ALGOS_WITH_DISTINCT_FULL_MODE.has(selectedAlgo) && (
          <>
            {selectedAlgo === 'floyd_warshall' && (
              <>
                <button onClick={() => jumpToPhase(-1)} disabled={atStart}>Previous k phase</button>
                <button onClick={() => jumpToPhase(1)} disabled={atEnd}>Next k phase</button>
                <div className="triple-jump" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-2)', marginRight: '2px' }}>Jump (k,i,j):</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: 'var(--amber-bright)' }}>
                    <span>k</span>
                    <input style={{ width: '38px', background: 'var(--surface-2)', border: '1px solid var(--surface-3)', borderRadius: '4px', color: 'var(--text-1)', padding: '2px', textAlign: 'center' }} type="number" min={0} max={nodeCount - 1} value={currentK} onChange={event => jumpToTriple(Number(event.target.value), currentI, currentJ)} />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: '#22d3ee' }}>
                    <span>i</span>
                    <input style={{ width: '38px', background: 'var(--surface-2)', border: '1px solid var(--surface-3)', borderRadius: '4px', color: 'var(--text-1)', padding: '2px', textAlign: 'center' }} type="number" min={0} max={nodeCount - 1} value={currentI} onChange={event => jumpToTriple(currentK, Number(event.target.value), currentJ)} />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: '#f472b6' }}>
                    <span>j</span>
                    <input style={{ width: '38px', background: 'var(--surface-2)', border: '1px solid var(--surface-3)', borderRadius: '4px', color: 'var(--text-1)', padding: '2px', textAlign: 'center' }} type="number" min={0} max={nodeCount - 1} value={currentJ} onChange={event => jumpToTriple(currentK, currentI, Number(event.target.value))} />
                  </label>
                </div>
              </>
            )}
            <label>
              <span>Jump to operation</span>
              <input
                type="number"
                min={1}
                max={totalSteps}
                value={currentStep + 1}
                onChange={event => setStep(Number(event.target.value) - 1)}
              />
            </label>
          </>
        )}
      </div>
    </div>
  )
}
