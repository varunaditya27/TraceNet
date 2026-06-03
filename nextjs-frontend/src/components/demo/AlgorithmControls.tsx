'use client'
import { useDemoStore } from '@/store/demo-store'

export function AlgorithmControls() {
  const { currentStep, totalSteps, isPlaying, prevStep, nextStep, togglePlay } = useDemoStore()

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none',
    border: '1px solid var(--surface-3)',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? 'var(--text-3)' : 'var(--amber-mid)',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    transition: 'color 150ms, border-color 150ms, background 150ms',
    flexShrink: 0,
  })

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      borderTop: '1px solid var(--surface-3)',
    }}>
      <button
        style={btnStyle(currentStep === 0)}
        disabled={currentStep === 0}
        onClick={prevStep}
        onMouseEnter={e => { if (currentStep > 0) { e.currentTarget.style.color = 'var(--amber-bright)'; e.currentTarget.style.borderColor = 'var(--amber-dim)' } }}
        onMouseLeave={e => { e.currentTarget.style.color = currentStep === 0 ? 'var(--text-3)' : 'var(--amber-mid)'; e.currentTarget.style.borderColor = 'var(--surface-3)' }}
        title="Previous step"
      >
        ←
      </button>

      <button
        style={{
          ...btnStyle(false),
          width: '48px',
          background: isPlaying ? 'var(--amber-glow)' : 'none',
          borderColor: isPlaying ? 'var(--amber-dim)' : 'var(--surface-3)',
          color: 'var(--amber-mid)',
          fontSize: '16px',
        }}
        onClick={togglePlay}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber-bright)'; e.currentTarget.style.borderColor = 'var(--amber-mid)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--amber-mid)'; e.currentTarget.style.borderColor = isPlaying ? 'var(--amber-dim)' : 'var(--surface-3)' }}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        style={btnStyle(currentStep >= totalSteps - 1)}
        disabled={currentStep >= totalSteps - 1}
        onClick={nextStep}
        onMouseEnter={e => { if (currentStep < totalSteps - 1) { e.currentTarget.style.color = 'var(--amber-bright)'; e.currentTarget.style.borderColor = 'var(--amber-dim)' } }}
        onMouseLeave={e => { e.currentTarget.style.color = currentStep >= totalSteps - 1 ? 'var(--text-3)' : 'var(--amber-mid)'; e.currentTarget.style.borderColor = 'var(--surface-3)' }}
        title="Next step"
      >
        →
      </button>

      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-3)',
        marginLeft: '8px',
      }}>
        {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : '— / —'}
      </span>
    </div>
  )
}
