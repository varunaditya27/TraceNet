'use client'
import type { GraphNode, GraphEdge } from '@/lib/graph-data'
import { ROLE_COLORS } from '@/lib/constants'

interface NodeDrawerProps {
  node: GraphNode | null
  edges: GraphEdge[]
  nodes: GraphNode[]
  onClose: () => void
}

export function NodeDrawer({ node, edges, nodes, onClose }: NodeDrawerProps) {
  if (!node) return null

  const neighbors = edges
    .filter(e => e.src === node.id)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12)

  const roleColor = ROLE_COLORS[node.role] || 'var(--text-2)'

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '280px',
      height: '100%',
      background: 'var(--surface-2)',
      borderLeft: '1px solid var(--surface-3)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideIn 300ms ease-out',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '15px', color: 'var(--text-1)', lineHeight: 1.3, paddingRight: '8px' }}>
            {node.name}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: '4px',
            color: node.gram === 'positive' ? 'var(--scc-violet)' : 'var(--bfs-teal)',
            background: node.gram === 'positive' ? 'rgba(167,139,250,0.12)' : 'rgba(34,211,238,0.12)',
            border: node.gram === 'positive' ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(34,211,238,0.3)',
          }}>
            Gram {node.gram}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: '4px',
            color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40`,
          }}>
            {node.role}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {/* ARG count */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Plasmid ARGs
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--amber-mid)', lineHeight: 1 }}>
            {node.plasmid_args}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
            genes with NCBI Plasmid &gt; 1%
          </div>
        </div>

        {/* Neighbors */}
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Top neighbors (by edge weight)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {neighbors.map(edge => {
              const neighbor = nodes[edge.tgt]
              if (!neighbor) return null
              const nc = ROLE_COLORS[neighbor.role] || 'var(--text-2)'
              return (
                <div key={edge.tgt} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'var(--surface-1)',
                  borderRadius: '4px',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: nc, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {neighbor.short}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber-mid)', flexShrink: 0 }}>
                    {edge.weight.toFixed(3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
