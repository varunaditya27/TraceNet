'use client'
import type { GraphNode } from '@/lib/graph-data'
import { ROLE_COLORS, COLORS } from '@/lib/constants'
import { useDemoStore } from '@/store/demo-store'

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
  const { selectedAlgo, graphData } = useDemoStore()
  const roleColor = ROLE_COLORS[node.role] || 'var(--text-2)'

  // Fetch algorithm specific stats
  let algoStats: React.ReactNode = null

  if (graphData) {
    if (selectedAlgo === 'dijkstra') {
      const dist = graphData.algorithms.dijkstra.distances[node.id]
      const distStr = dist === null ? '∞ (unreachable)' : dist.toFixed(3)
      const isSource = graphData.algorithms.dijkstra.source === node.id
      algoStats = (
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--surface-3)', paddingTop: '8px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
          <span style={{ color: COLORS.amberBright, fontWeight: 600 }}>Dijkstra distance:</span>{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
            {isSource ? '0.000 (Source)' : distStr}
          </span>
        </div>
      )
    } else if (selectedAlgo === 'floyd_warshall') {
      const score = graphData.algorithms.floyd_warshall.vulnerability_scores[node.id]
      const isMV = graphData.algorithms.floyd_warshall.most_vulnerable === node.id
      algoStats = (
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--surface-3)', paddingTop: '8px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
          <span style={{ color: COLORS.bfsTeal, fontWeight: 600 }}>Vulnerability score:</span>{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: isMV ? COLORS.amberBright : 'var(--text-1)' }}>
            {score !== undefined ? score.toFixed(3) : 'N/A'} {isMV && '★'}
          </span>
          {isMV && <div style={{ fontSize: '9px', color: COLORS.amberBright, marginTop: '2px' }}>Most Vulnerable Node</div>}
        </div>
      )
    } else if (selectedAlgo === 'greedy_contain') {
      const greedy = graphData.algorithms.greedy_contain
      const isSrc = greedy.sources.includes(node.id)
      const isTgt = greedy.targets.includes(node.id)
      let roleLabel = 'Pathway Node'
      let color: string = 'var(--text-2)'
      if (isSrc) {
        roleLabel = 'Environmental Source'
        color = COLORS.riskLow
      } else if (isTgt) {
        roleLabel = 'Protected Target'
        color = COLORS.riskHigh
      }
      algoStats = (
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--surface-3)', paddingTop: '8px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
          <span style={{ color: COLORS.amberMid, fontWeight: 600 }}>Containment role:</span>{' '}
          <span style={{ fontWeight: 600, color }}>
            {roleLabel}
          </span>
        </div>
      )
    } else if (selectedAlgo === 'bnb_contain') {
      const bnb = graphData.algorithms.bnb_contain
      const globalByName = new Map(graphData.nodes.map(n => [n.name, n.id]))
      const hospitalLocalIndex = bnb.hospital_node_names.findIndex(name => globalByName.get(name) === node.id)
      const isHospitalNode = hospitalLocalIndex !== -1
      
      if (isHospitalNode) {
        const isHospSrc = bnb.sources.includes(hospitalLocalIndex)
        const isHospTgt = bnb.targets.includes(hospitalLocalIndex)
        let roleLabel = 'Hospital Intermediate'
        let color: string = COLORS.nodeBridge
        if (isHospSrc) {
          roleLabel = 'Hospital Source'
          color = COLORS.riskLow
        } else if (isHospTgt) {
          roleLabel = 'Hospital Target'
          color = COLORS.riskHigh
        }
        
        algoStats = (
          <div style={{ marginTop: '8px', borderTop: '1px solid var(--surface-3)', paddingTop: '8px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
            <div style={{ fontSize: '9px', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospital Subgraph</div>
            <span style={{ color: COLORS.amberMid, fontWeight: 600 }}>Role:</span>{' '}
            <span style={{ fontWeight: 600, color }}>
              {roleLabel}
            </span>
          </div>
        )
      } else {
        algoStats = (
          <div style={{ marginTop: '8px', borderTop: '1px solid var(--surface-3)', paddingTop: '8px', fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic' }}>
            Excluded from hospital subgraph
          </div>
        )
      }
    }
  }

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
      minWidth: '190px',
      maxWidth: '245px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
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

      {algoStats}
    </div>
  )
}
