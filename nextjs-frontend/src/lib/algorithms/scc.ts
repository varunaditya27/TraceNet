import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor } from '@/lib/d3-graph'
import { COLORS, TIMINGS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'DFS pass 1 (original graph)', detail: 'Run depth-first search, recording finish times for each node.' },
  { label: 'Transpose graph', detail: 'Reverse all edge directions to create the transposed graph G^T.' },
  { label: 'DFS pass 2 (transposed)', detail: 'DFS on G^T in reverse finish-time order reveals strongly connected components.' },
  { label: 'Components identified', detail: 'Component A: 12 Gram-negative species. Component B: 4 Gram-positive species. The Gram boundary is a true topological divide.' },
]

// Centroid of a set of nodes
function centroid(nodes: { x: number; y: number }[]): { cx: number; cy: number } {
  const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length
  const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length
  return { cx, cy }
}

function enter(svg: SVG, data: GraphData, step: number): void {
  const scc = data.algorithms.scc

  if (step === 0) {
    resetGraph(svg, data)
    // Animate DFS traversal: light nodes up in order
    dimAllNodes(svg, 0.15)
    dimAllEdges(svg, 0.05)
    data.nodes.forEach((node, i) => {
      setTimeout(() => {
        setNodeColor(svg, node.id, COLORS.amberDim, 0.8, TIMINGS.nodeFade)
      }, i * 80)
    })
    return
  }

  if (step === 1) {
    // Show "transposed" state — briefly dim edges
    dimAllNodes(svg, 0.4)
    dimAllEdges(svg, 0.03)
    svg.selectAll('.edge-line')
      .transition().duration(400)
      .attr('stroke', COLORS.amberDim)
      .attr('opacity', 0.1)
    // Label
    svg.select('.g-annotations').selectAll('.transpose-label').remove()
    svg.select('.g-annotations')
      .append('text')
      .attr('class', 'transpose-label')
      .attr('x', 570).attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text2)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .attr('opacity', 0)
      .text('Graph transposed — edges reversed')
      .transition().duration(400).attr('opacity', 1)
    return
  }

  if (step >= 2) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)

    // Color by component
    scc.groups.forEach((group, compIdx) => {
      const color: string = compIdx === 0 ? COLORS.sccViolet : COLORS.riskLow
      group.forEach(nodeId => {
        setNodeColor(svg, nodeId, color, 1)
      })
    })
  }

  if (step >= 3) {
    // Add SCC halo ellipses
    svg.selectAll('.scc-halo').remove()
    const haloGroup = svg.select('.g-annotations')

    scc.groups.forEach((group, compIdx) => {
      const color: string = compIdx === 0 ? COLORS.sccViolet : COLORS.riskLow
      const groupNodes = group.map(id => data.nodes[id])
      const { cx, cy } = centroid(groupNodes)

      const xs = groupNodes.map(n => n.x)
      const ys = groupNodes.map(n => n.y)
      const rx = (Math.max(...xs) - Math.min(...xs)) / 2 + 40
      const ry = (Math.max(...ys) - Math.min(...ys)) / 2 + 40

      haloGroup.append('ellipse')
        .attr('class', 'scc-halo')
        .attr('cx', cx).attr('cy', cy)
        .attr('rx', 0).attr('ry', 0)
        .attr('fill', color)
        .attr('opacity', 0.08)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
        .transition().duration(TIMINGS.sccHalo)
        .ease(d3.easeBackOut)
        .attr('rx', rx).attr('ry', ry)

      // Component label
      haloGroup.append('text')
        .attr('class', 'scc-halo')
        .attr('x', cx).attr('y', cy - ry - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)')
        .attr('opacity', 0)
        .text(compIdx === 0 ? 'Gram-positive (4 nodes)' : 'Gram-negative (12 nodes)')
        .transition().delay(400).duration(400).attr('opacity', 0.9)
    })
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.scc-halo, .transpose-label').remove()
  resetGraph(svg, data)
}

export const sccModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'strongly connected components', value: String(data.algorithms.scc.n_components) },
    { label: 'Gram-negative cluster (nodes)', value: '12' },
    { label: 'Gram-positive cluster (nodes)', value: '4' },
  ],
}
