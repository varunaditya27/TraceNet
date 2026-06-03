interface BadgeProps {
  children: React.ReactNode
  variant?: 'unit' | 'complexity' | 'gram' | 'role'
  roleColor?: string
}

export function Badge({ children, variant = 'unit', roleColor }: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '2px 7px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
  }

  if (variant === 'unit') {
    return (
      <span style={{
        ...baseStyle,
        color: 'var(--amber-mid)',
        background: 'var(--amber-glow)',
        border: '1px solid var(--amber-dim)',
      }}>
        {children}
      </span>
    )
  }

  if (variant === 'complexity') {
    return (
      <span style={{
        ...baseStyle,
        color: 'var(--amber-mid)',
        background: 'var(--surface-2)',
        border: '1px solid var(--surface-3)',
      }}>
        {children}
      </span>
    )
  }

  if (variant === 'gram') {
    const isPositive = String(children).toLowerCase().includes('pos')
    return (
      <span style={{
        ...baseStyle,
        color: isPositive ? 'var(--scc-violet)' : 'var(--bfs-teal)',
        background: isPositive ? 'rgba(167,139,250,0.1)' : 'rgba(34,211,238,0.1)',
        border: `1px solid ${isPositive ? 'rgba(167,139,250,0.3)' : 'rgba(34,211,238,0.3)'}`,
      }}>
        {children}
      </span>
    )
  }

  if (variant === 'role') {
    const color = roleColor || 'var(--text-2)'
    return (
      <span style={{
        ...baseStyle,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
      }}>
        {children}
      </span>
    )
  }

  return <span style={baseStyle}>{children}</span>
}
