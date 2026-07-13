'use client'
import Link from 'next/link'
import { useDemoStore } from '@/store/demo-store'
import { ALGORITHM_META } from '@/lib/constants'

export function DashboardHeader() {
  const { selectedAlgo, graphData } = useDemoStore()
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

      {/* Metrics Bar */}
      {graphData && (() => {
        let text = ''
        let badgeColor = 'var(--text-3)'
        
        if (selectedAlgo === 'dijkstra') {
          text = 'Reachable: 4/6 ESKAPE · Highest Risk: E. faecium→E. faecalis (p=0.714)'
          badgeColor = 'var(--amber-bright)'
        } else if (selectedAlgo === 'floyd_warshall') {
          text = `Most Vulnerable: ${graphData.algorithms.floyd_warshall.most_vulnerable_name}`
          badgeColor = '#22d3ee'
        } else if (selectedAlgo === 'greedy_contain') {
          text = `Greedy Cuts: ${graphData.algorithms.greedy_contain.n_removed} edges`
          badgeColor = '#f43f5e'
        } else if (selectedAlgo === 'bnb_contain') {
          const bnb = graphData.algorithms.bnb_contain
          text = `B&B Optimal: ${bnb.optimal_cost} edges (Saved ${bnb.greedy_cost - bnb.optimal_cost} cuts)`
          badgeColor = '#a78bfa'
        }
        
        if (!text) return null
        
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface-2)',
            border: '1px solid var(--surface-3)',
            borderRadius: '6px',
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-2)',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeColor }} />
            <span>{text}</span>
          </div>
        )
      })()}

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
