import Link from 'next/link'

interface AmberButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function AmberButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: AmberButtonProps) {
  const style: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: size === 'sm' ? '13px' : '14px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    height: size === 'sm' ? '36px' : '48px',
    padding: size === 'sm' ? '0 16px' : '0 28px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
    textDecoration: 'none',
    border: variant === 'ghost' ? '1px solid var(--amber-mid)' : 'none',
    background: variant === 'primary' ? 'var(--amber-mid)' : 'transparent',
    color: variant === 'primary' ? 'var(--surface-0)' : 'var(--amber-mid)',
    opacity: disabled ? 0.5 : 1,
  }

  const hoverStyle = variant === 'primary'
    ? { background: 'var(--amber-bright)' }
    : { background: 'var(--amber-glow)', borderColor: 'var(--amber-bright)', color: 'var(--amber-bright)' }

  if (href && !disabled) {
    return (
      <Link
        href={href}
        style={style}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
          background: style.background,
          borderColor: variant === 'ghost' ? 'var(--amber-mid)' : '',
          color: style.color,
        })}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      style={style}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={(e) => !disabled && Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={(e) => !disabled && Object.assign(e.currentTarget.style, {
        background: style.background,
        borderColor: variant === 'ghost' ? 'var(--amber-mid)' : '',
        color: style.color,
      })}
    >
      {children}
    </button>
  )
}
