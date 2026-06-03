'use client'

interface FilterState {
  roles: Set<string>
  grams: Set<string>
  showComponents: boolean
}

interface NetworkControlsProps {
  filters: FilterState
  onRoleToggle: (role: string) => void
  onGramToggle: (gram: string) => void
  onComponentToggle: () => void
}

export function NetworkControls({ filters, onRoleToggle, onGramToggle, onComponentToggle }: NetworkControlsProps) {
  const chipStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '4px',
    border: `1px solid ${active ? color : 'var(--surface-3)'}`,
    background: active ? `${color}18` : 'none',
    color: active ? color : 'var(--text-2)',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 150ms',
    userSelect: 'none' as const,
  })

  return (
    <div style={{
      position: 'absolute',
      top: '56px',
      right: '16px',
      background: 'var(--surface-2)',
      border: '1px solid var(--surface-3)',
      borderRadius: '8px',
      padding: '14px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      minWidth: '180px',
    }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Filter by role
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {[
          { key: 'eskape', label: 'ESKAPE', color: '#f85149' },
          { key: 'bridge', label: 'Bridge', color: '#8b949e' },
          { key: 'environmental', label: 'Environmental', color: '#3fb950' },
        ].map(({ key, label, color }) => (
          <button key={key} style={chipStyle(filters.roles.has(key), color)} onClick={() => onRoleToggle(key)}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', height: '1px', background: 'var(--surface-3)' }} />

      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Gram staining
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {[
          { key: 'positive', label: 'Gram +', color: '#a78bfa' },
          { key: 'negative', label: 'Gram −', color: '#22d3ee' },
        ].map(({ key, label, color }) => (
          <button key={key} style={chipStyle(filters.grams.has(key), color)} onClick={() => onGramToggle(key)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', height: '1px', background: 'var(--surface-3)' }} />

      <button
        style={chipStyle(filters.showComponents, '#d4a017')}
        onClick={onComponentToggle}
      >
        Highlight components
      </button>
    </div>
  )
}
