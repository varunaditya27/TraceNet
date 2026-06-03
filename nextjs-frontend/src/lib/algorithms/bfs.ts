import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, setNodeColor, dimAllNodes, dimAllEdges, setEdgeActive, addTextLabel } from '@/lib/d3-graph'
import { COLORS, TIMINGS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'Initialize queue', detail: 'Enqueue source node K. pneumoniae (id=0). All other nodes dimmed.' },
  { label: 'Explore hop-1 neighbors', detail: '12 species reachable at hop distance 1 — all Gram-negative. Gram-positive cluster is a separate component.' },
  { label: 'Mark unreachable nodes', detail: 'Nodes 3, 4, 14, 15 (Gram-positive ESKAPE + environmental) are unreachable from this source.' },
  { label: 'BFS complete', detail: '12 of 16 nodes reachable. The two-component structure confirms the Gram-boundary split.' },
]

function enter(svg: SVG, data: GraphData, step: number): void {
  const bfs = data.algorithms.bfs
  // Always reset to clean state first for steps 0
  if (step === 0) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.06)
    dimAllNodes(svg, 0.25)
    // Highlight source
    setNodeColor(svg, bfs.source, COLORS.amberMid, 1)
    return
  }

  if (step >= 1) {
    // Dim everything first
    dimAllEdges(svg, 0.06)
    dimAllNodes(svg, 0.2)
    // Source stays amber
    setNodeColor(svg, bfs.source, COLORS.amberMid, 1)
    // Reachable nodes (hop 1) in teal
    bfs.reachable.forEach((nodeId, i) => {
      if (nodeId === bfs.source) return
      setTimeout(() => {
        setNodeColor(svg, nodeId, COLORS.bfsTeal, 1, TIMINGS.nodeState)
        // Activate edges from source to these nodes
        setEdgeActive(svg, bfs.source, nodeId, COLORS.bfsTeal, 1.5, 'arrow-safe', TIMINGS.nodeState)
      }, i * 60)
    })
  }

  if (step >= 2) {
    // Show unreachable nodes as very dim
    const unreachable = bfs.distances
      .map((d, i) => (d === -1 ? i : -1))
      .filter(i => i >= 0)
    unreachable.forEach(nodeId => {
      setNodeColor(svg, nodeId, COLORS.text3, 0.15)
    })
    // Add ∞ labels
    svg.selectAll('.hop-label').remove()
    unreachable.forEach(nodeId => {
      const node = data.nodes[nodeId]
      addTextLabel(svg, node.x, node.y - 18, '∞', COLORS.text3, '12px', 'hop-label')
    })
  }

  if (step >= 3) {
    // Add distance labels for reachable
    bfs.reachable.forEach(nodeId => {
      const node = data.nodes[nodeId]
      const dist = bfs.distances[nodeId]
      addTextLabel(svg, node.x, node.y - 18, String(dist), COLORS.amberMid, '11px', 'hop-label')
    })
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.hop-label').remove()
  resetGraph(svg, data)
}

export const bfsModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'nodes reachable from K. pneumoniae', value: String(data.algorithms.bfs.reachable.length) },
    { label: 'unreachable nodes (other component)', value: '4' },
    { label: 'hop distance to all reachable', value: '1' },
  ],
}
