interface StatCardProps {
  value: string
  label: string
  unit?: string
  highlight?: boolean
}

export function StatCard({ value, label, unit, highlight = false }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--surface-3)',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          color: highlight ? 'var(--amber-bright)' : 'var(--amber-mid)',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-3)',
          }}>
            {unit}
          </span>
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        color: 'var(--text-2)',
        lineHeight: 1.4,
      }}>
        {label}
      </span>
    </div>
  )
}
