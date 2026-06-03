import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, setEdgeActive, addTextLabel } from '@/lib/d3-graph'
import { COLORS, TIMINGS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'Initialize', detail: 'Source: K. pneumoniae (id=0). Convert Jaccard weights to log-distances: d = −log(w). Lower distance = higher probability.' },
  { label: 'Settle nodes by distance', detail: 'Priority queue extracts closest node first. Distances finalize as nodes settle: closest = K. oxytoca (d=0.831).' },
  { label: 'Highlight ESKAPE paths', detail: 'Shortest paths to reachable ESKAPE targets: E. cloacae (d=0.966), A. baumannii (d=2.042). E. faecium & S. aureus are unreachable (other component).' },
  { label: 'Highest-risk edge', detail: 'Within Gram-positive component: E. faecium → E. faecalis has probability 0.714 — the strongest single transmission pathway in the graph.' },
]

function enter(svg: SVG, data: GraphData, step: number): void {
  const dijk = data.algorithms.dijkstra

  if (step === 0) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 20, 'source', COLORS.amberMid, '10px', 'dijk-label')
    return
  }

  if (step >= 1) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    // Color nodes by distance (settled = bright, source = amber)
    const maxDist = Math.max(...dijk.distances.filter((d): d is number => d !== null))
    const colorScale = d3.scaleSequential([0, maxDist], d3.interpolate(COLORS.amberBright, COLORS.amberDim))

    dijk.distances.forEach((dist, nodeId) => {
      if (dist === null) {
        setNodeColor(svg, nodeId, COLORS.text3, 0.2)
      } else if (nodeId === dijk.source) {
        setNodeColor(svg, nodeId, COLORS.amberMid, 1)
      } else {
        // Stagger settlement
        setTimeout(() => {
          setNodeColor(svg, nodeId, colorScale(dist), 1, 400)
        }, dist * 300)
      }
    })
  }

  if (step >= 2) {
    // Highlight ESKAPE paths
    const eskapeIds = [1, 2, 5] // reachable ESKAPE nodes (cloacae, aeruginosa, baumannii)
    eskapeIds.forEach(targetId => {
      const pathKey = String(targetId)
      const pathData = dijk.eskape_paths[pathKey]
      if (!pathData || pathData.path.length < 2) return
      const path = pathData.path
      for (let i = 0; i < path.length - 1; i++) {
        setEdgeActive(svg, path[i], path[i+1], COLORS.pathGold, 2.5, 'arrow-path', 500)
      }
      // Label target
      const node = data.nodes[targetId]
      addTextLabel(svg, node.x, node.y - 20, `d=${pathData.dist?.toFixed(3)}`, COLORS.pathGold, '10px', 'dijk-label')
    })
    // Show unreachable ESKAPE
    ;[3, 4].forEach(id => {
      setNodeColor(svg, id, COLORS.text3, 0.15)
      addTextLabel(svg, data.nodes[id].x, data.nodes[id].y - 20, '∅', COLORS.text3, '12px', 'dijk-label')
    })
  }

  if (step >= 3) {
    // Highlight highest-risk: edge src→tgt and tgt→src (bidirectional) in red
    const hr = dijk.highest_risk
    setNodeColor(svg, hr.src, COLORS.riskHigh, 1)
    setNodeColor(svg, hr.tgt, COLORS.riskHigh, 1)
    setEdgeActive(svg, hr.src, hr.tgt, COLORS.riskHigh, 3, 'arrow-danger', 500)
    setEdgeActive(svg, hr.tgt, hr.src, COLORS.riskHigh, 3, 'arrow-danger', 500)
    addTextLabel(svg,
      (data.nodes[hr.src].x + data.nodes[hr.tgt].x) / 2,
      (data.nodes[hr.src].y + data.nodes[hr.tgt].y) / 2 - 12,
      `p=${hr.probability.toFixed(3)}`, COLORS.riskHigh, '11px', 'dijk-label'
    )
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.dijk-label').remove()
  resetGraph(svg, data)
}

export const dijkstraModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => {
    const dijk = data.algorithms.dijkstra
    return [
      { label: 'ESKAPE nodes reachable from source', value: '4' },
      { label: 'nodes unreachable (other component)', value: '2' },
      { label: 'highest probability edge', value: `${dijk.highest_risk.probability.toFixed(3)}` },
      { label: 'closest neighbor distance', value: '0.831' },
    ]
  },
}
