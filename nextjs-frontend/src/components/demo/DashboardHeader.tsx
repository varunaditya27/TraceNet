'use client'
import Link from 'next/link'
import { useDemoStore } from '@/store/demo-store'
import { ALGORITHM_META } from '@/lib/constants'

export function DashboardHeader() {
  const { selectedAlgo } = useDemoStore()
  const algoName = ALGORITHM_META[selectedAlgo]?.name ?? 'Algorithm'

  return (
    <header style={{
      height: '48px',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--surface-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      gap: '16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--amber-mid)', flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: '14px',
          fontWeight: 600, color: 'var(--text-1)',
        }}>
          TraceNet
        </span>
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-2)' }}>
          Demo
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>/</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-1)' }}>
          {algoName}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Link
          href="/"
          title="Back to overview"
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '12px',
            color: 'var(--text-2)', textDecoration: 'none',
            padding: '4px 10px',
            border: '1px solid var(--surface-3)',
            borderRadius: '4px',
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--surface-3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--surface-3)' }}
        >
          ← Overview
        </Link>
      </div>
    </header>
  )
}
