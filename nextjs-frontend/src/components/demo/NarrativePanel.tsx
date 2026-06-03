'use client'
import { useDemoStore } from '@/store/demo-store'
import { ALGORITHM_META } from '@/lib/constants'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { AlgorithmControls } from './AlgorithmControls'

// Placeholder results — algorithm modules will provide real ones once built
// These are static fallbacks used before modules are wired up
const PLACEHOLDER_RESULTS: Record<string, { label: string; value: string }[]> = {
  bfs: [{ label: 'reachable nodes', value: '12' }, { label: 'unreachable (other component)', value: '4' }, { label: 'max hop distance', value: '1' }],
  scc: [{ label: 'components found', value: '2' }, { label: 'Gram-negative cluster', value: '12' }, { label: 'Gram-positive cluster', value: '4' }],
  topo_sort: [{ label: 'ARG nodes ordered', value: '10' }, { label: 'dependency edges', value: '8' }, { label: 'cycle detected', value: 'No' }],
  boyer_moore: [{ label: 'matches found', value: '2' }, { label: 'BM comparisons', value: '951' }, { label: 'naive comparisons', value: '2119' }, { label: 'speedup', value: '2.23×' }],
  dijkstra: [{ label: 'ESKAPE nodes reached', value: '4' }, { label: 'highest probability', value: '0.714' }, { label: 'unreachable ESKAPE', value: '2' }],
  floyd_warshall: [{ label: 'most vulnerable node', value: 'K. pneumoniae' }, { label: 'reachable pairs', value: '132' }, { label: 'isolated pairs', value: '24' }],
  greedy_contain: [{ label: 'edges removed', value: '141' }, { label: 'source nodes', value: '2' }, { label: 'ESKAPE targets', value: '6' }],
  bnb_contain: [{ label: 'optimal cut size', value: '4' }, { label: 'greedy cut (subgraph)', value: '6' }, { label: 'improvement', value: '33%' }],
}

const PLACEHOLDER_STEPS: Record<string, { label: string; detail: string }[]> = {
  bfs: [
    { label: 'Initialize queue', detail: 'Start from K. pneumoniae (source). All other nodes dimmed.' },
    { label: 'Explore hop 1', detail: '12 neighbors reachable in one hop — all Gram-negative species.' },
    { label: 'Mark unreachable', detail: 'Nodes 3, 4, 14, 15 (Gram-positive) are in a separate component.' },
    { label: 'BFS complete', detail: 'All distances finalized. 12/16 nodes reachable from source.' },
  ],
  scc: [
    { label: 'DFS pass 1', detail: 'Run DFS on original graph, record finish times.' },
    { label: 'Transpose graph', detail: 'Reverse all edge directions.' },
    { label: 'DFS pass 2', detail: 'DFS on transposed graph in reverse finish order.' },
    { label: 'Components', detail: 'Component A: 12 Gram-negative species. Component B: 4 Gram-positive.' },
  ],
  topo_sort: [
    { label: 'Load ARG DAG', detail: 'Switch from species graph to ARG dependency DAG (10 nodes).' },
    { label: 'Compute in-degrees', detail: 'Count incoming edges for each ARG node.' },
    { label: "Kahn's BFS", detail: 'Process zero-in-degree nodes iteratively, revealing acquisition order.' },
    { label: 'Order complete', detail: 'tetM → sul1 → aac6Ib → vanA → blaTEM → blaSHV → blaCTXM → …' },
  ],
  boyer_moore: [
    { label: 'Target species', detail: 'Focus on K. pneumoniae — highest plasmid ARG count (46).' },
    { label: 'Pattern alignment', detail: 'Align NDM-1 sequence (30bp) against CARD FASTA text.' },
    { label: 'Bad-character skip', detail: 'Skip ahead using bad-character table — sublinear traversal.' },
    { label: 'Matches found', detail: '2 matches at positions 0 and 813. BM: 951 vs Naive: 2119 comparisons.' },
  ],
  dijkstra: [
    { label: 'Initialize', detail: 'Source: K. pneumoniae. Convert weights to log-distances.' },
    { label: 'Settle nodes', detail: 'Process priority queue — closest nodes settle first.' },
    { label: 'ESKAPE paths', detail: 'Highlight shortest paths to reachable ESKAPE pathogens.' },
    { label: 'Highest risk', detail: 'E. faecium ↔ E. faecalis: probability 0.714 (same genus).' },
  ],
  floyd_warshall: [
    { label: 'All-pairs setup', detail: 'Initialize 16×16 distance matrix. Diagonal = 0, rest = ∞.' },
    { label: 'Matrix fill', detail: 'Relax all pairs through each intermediate node (V³ operations).' },
    { label: 'Vulnerability', detail: 'Score each node by its total reach — most connected = most dangerous.' },
    { label: 'Result', detail: 'K. pneumoniae most vulnerable. Complete matrix reveals all risk paths.' },
  ],
  greedy_contain: [
    { label: 'Identify sources/targets', detail: 'Sources: E. faecalis, C. jejuni. Targets: 6 ESKAPE nodes.' },
    { label: 'Sort edges by weight', detail: 'Highest-weight edges are prioritized for removal.' },
    { label: 'Iterative removal', detail: 'Remove edges one by one — check connectivity after each.' },
    { label: 'Containment', detail: '141 edges removed. Sources now disconnected from all ESKAPE targets.' },
  ],
  bnb_contain: [
    { label: 'Hospital subgraph', detail: 'Reduce to 10-node subgraph for tractable B&B search.' },
    { label: 'Branch & bound', detail: 'Explore edge subsets. Prune branches exceeding current best.' },
    { label: 'Optimal found', detail: '4 edges suffice: E. faecalis→E. faecium, C. jejuni→E. faecium + 2 more.' },
    { label: 'Compare', detail: 'B&B: 4 edges. Greedy on subgraph: 6 edges. B&B is 33% more efficient.' },
  ],
}

export function NarrativePanel() {
  const { selectedAlgo, currentStep } = useDemoStore()
  const meta = ALGORITHM_META[selectedAlgo]
  const steps = PLACEHOLDER_STEPS[selectedAlgo] ?? []
  const results = PLACEHOLDER_RESULTS[selectedAlgo] ?? []

  return (
    <aside style={{
      width: '320px',
      background: 'var(--surface-1)',
      borderLeft: '1px solid var(--surface-3)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--surface-3)', flexShrink: 0 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          color: 'var(--text-1)',
          marginBottom: '10px',
          lineHeight: 1.2,
        }}>
          {meta?.name}
        </h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge variant="unit">{meta?.unit}</Badge>
          <Badge variant="complexity">{meta?.timeComplexity}</Badge>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--text-2)',
          lineHeight: 1.75,
        }}>
          {meta?.description}
        </p>

        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              color: 'var(--text-3)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {steps.map((step, i) => {
                const isActive = i === currentStep
                const isDone = i < currentStep
                return (
                  <div key={i} style={{
                    padding: '8px 10px',
                    borderLeft: isActive ? '2px solid var(--amber-mid)' : '2px solid transparent',
                    background: isActive ? 'var(--amber-glow)' : 'none',
                    borderRadius: '0 4px 4px 0',
                    transition: 'background 300ms, border-color 300ms',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--text-1)' : isDone ? 'var(--text-3)' : 'var(--text-2)',
                      marginBottom: isActive ? '4px' : 0,
                    }}>
                      {i + 1}. {step.label}
                    </div>
                    {isActive && (
                      <div style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '11px',
                        color: 'var(--text-2)',
                        lineHeight: 1.5,
                      }}>
                        {step.detail}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              color: 'var(--text-3)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Results
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((r, i) => (
                <StatCard key={i} value={r.value} label={r.label} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed controls at bottom */}
      <AlgorithmControls />
    </aside>
  )
}
