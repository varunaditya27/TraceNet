'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { loadGraphData } from '@/lib/graph-data'
import { NetworkCanvas } from '@/components/network/NetworkCanvas'
import { NodeDrawer } from '@/components/network/NodeDrawer'
import { NetworkControls } from '@/components/network/NetworkControls'
import type { GraphData, GraphNode } from '@/lib/graph-data'

export default function NetworkPage() {
  const [data, setData] = useState<GraphData | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set())
  const [hiddenGrams, setHiddenGrams] = useState<Set<string>>(new Set())
  const [showComponents, setShowComponents] = useState(false)

  useEffect(() => {
    loadGraphData().then(setData).catch(console.error)
  }, [])

  const handleRoleToggle = useCallback((role: string) => {
    setHiddenRoles(prev => {
      const next = new Set(prev)
      if (next.has(role)) next.delete(role); else next.add(role)
      return next
    })
  }, [])

  const handleGramToggle = useCallback((gram: string) => {
    setHiddenGrams(prev => {
      const next = new Set(prev)
      if (next.has(gram)) next.delete(gram); else next.add(gram)
      return next
    })
  }, [])

  if (!data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-2)' }}>Loading…</span>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        height: '40px',
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--surface-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--amber-mid)' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
            TraceNet
          </span>
          <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>·</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-2)' }}>
            Network Explorer
          </span>
        </div>
        <Link href="/demo" style={{
          fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-2)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', border: '1px solid var(--surface-3)', borderRadius: '4px',
          transition: 'color 150ms',
        }}>
          ← Demo
        </Link>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <NetworkCanvas
          data={data}
          onNodeSelect={setSelectedNode}
          hiddenRoles={hiddenRoles}
          hiddenGrams={hiddenGrams}
          showComponents={showComponents}
        />
        <NetworkControls
          filters={{ roles: new Set(Object.keys({eskape:1,bridge:1,environmental:1}).filter(k => !hiddenRoles.has(k))), grams: new Set(['positive','negative'].filter(g => !hiddenGrams.has(g))), showComponents }}
          onRoleToggle={handleRoleToggle}
          onGramToggle={handleGramToggle}
          onComponentToggle={() => setShowComponents(p => !p)}
        />
        <NodeDrawer
          node={selectedNode}
          edges={data.edges}
          nodes={data.nodes}
          onClose={() => setSelectedNode(null)}
        />

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: '16px', left: '16px',
          background: 'var(--surface-2)', border: '1px solid var(--surface-3)',
          borderRadius: '8px', padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 5,
        }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Legend</div>
          {[
            { color: '#f85149', label: 'ESKAPE target' },
            { color: '#8b949e', label: 'Bridge species' },
            { color: '#3fb950', label: 'Environmental' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-2)' }}>{label}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--surface-3)', paddingTop: '6px', fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-3)' }}>
            Node size ∝ plasmid ARG count
          </div>
        </div>
      </div>
    </div>
  )
}
