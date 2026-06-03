'use client'
import type { GraphNode } from '@/lib/graph-data'
import { ROLE_COLORS } from '@/lib/constants'

interface NodeTooltipProps {
  node: GraphNode
  position: { x: number; y: number }
}

const ROLE_LABELS: Record<string, string> = {
  eskape: 'ESKAPE Pathogen',
  bridge: 'Bridge Species',
  environmental: 'Environmental Reservoir',
}

export function NodeTooltip({ node, position }: NodeTooltipProps) {
  const roleColor = ROLE_COLORS[node.role] || 'var(--text-2)'

  return (
    <div style={{
      position: 'absolute',
      left: position.x + 12,
      top: position.y - 10,
      zIndex: 50,
      pointerEvents: 'none',
      background: 'var(--surface-2)',
      border: '1px solid var(--surface-3)',
      borderRadius: '8px',
      padding: '12px 14px',
      minWidth: '180px',
      maxWidth: '240px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: '14px',
        color: 'var(--text-1)',
        marginBottom: '8px',
        lineHeight: 1.3,
      }}>
        {node.name}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: '4px',
          color: node.gram === 'positive' ? 'var(--scc-violet)' : 'var(--bfs-teal)',
          background: node.gram === 'positive' ? 'rgba(167,139,250,0.12)' : 'rgba(34,211,238,0.12)',
          border: node.gram === 'positive' ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(34,211,238,0.3)',
        }}>
          Gram {node.gram}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: '4px',
          color: roleColor,
          background: `${roleColor}18`,
          border: `1px solid ${roleColor}40`,
        }}>
          {node.role}
        </span>
      </div>

      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        color: 'var(--text-2)',
      }}>
        {node.plasmid_args} plasmid ARGs
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        color: 'var(--text-3)',
        marginTop: '2px',
      }}>
        {ROLE_LABELS[node.role]}
      </div>
    </div>
  )
}
