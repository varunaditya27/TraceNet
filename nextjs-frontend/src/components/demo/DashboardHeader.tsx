'use client'
export function DashboardHeader() {
  return (
    <header style={{
      height: '48px',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--surface-3)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-1)' }}>
        ◈ TraceNet
      </span>
    </header>
  )
}
