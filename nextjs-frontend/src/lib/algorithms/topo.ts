import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, initGraph, dimAllNodes, dimAllEdges } from '@/lib/d3-graph'
import { COLORS, TIMINGS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

// Fixed positions for 10 ARG DAG nodes inside the 1140x670 viewBox
const DAG_POSITIONS: Record<string, { x: number; y: number }> = {
  tetM:    { x: 100, y: 200 },
  sul1:    { x: 100, y: 420 },
  blaTEM:  { x: 300, y: 310 },
  blaSHV:  { x: 490, y: 220 },
  aac6Ib:  { x: 300, y: 480 },
  blaCTXM: { x: 680, y: 310 },
  blaOXA48:{ x: 870, y: 220 },
  blaNDM1: { x: 1050, y: 310 },
  mcr1:    { x: 870, y: 420 },
  vanA:    { x: 490, y: 480 },
}

const STEPS: StepDef[] = [
  { label: 'Load ARG dependency DAG', detail: 'Switch from species graph to the 10-node ARG dependency DAG. Edges represent clinical co-acquisition order.' },
  { label: 'Compute in-degrees', detail: "Count incoming edges per node. Zero in-degree nodes (tetM, sul1, aac6Ib, vanA) enter Kahn's queue first." },
  { label: "Kahn's BFS ordering", detail: 'Process queue iteratively: remove zero-in-degree nodes, decrement neighbors, enqueue new zeros.' },
  { label: 'Topological order complete', detail: 'tetM → sul1 → aac6Ib → vanA → blaTEM → blaSHV → blaCTXM → blaOXA48 → mcr1 → blaNDM1' },
]

function drawDAG(svg: SVG, data: GraphData, highlightUpTo = -1): void {
  const topo = data.algorithms.topo_sort
  const nodes = topo.dag_nodes
  const edges = topo.dag_edges

  // Remove species graph elements, keep defs/arrowheads
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()
  svg.select('.g-annotations').selectAll('*').remove()

  // Draw DAG edges
  const gEdges = svg.select('.g-edges')
  edges.forEach(([s, t]) => {
    const sp = DAG_POSITIONS[nodes[s]]
    const tp = DAG_POSITIONS[nodes[t]]
    if (!sp || !tp) return
    const dx = tp.x - sp.x, dy = tp.y - sp.y
    const dist = Math.sqrt(dx*dx + dy*dy)
    const ux = dx/dist, uy = dy/dist
    gEdges.append('line')
      .attr('class', 'dag-edge')
      .attr('x1', sp.x + ux*18).attr('y1', sp.y + uy*18)
      .attr('x2', tp.x - ux*22).attr('y2', tp.y - uy*22)
      .attr('stroke', COLORS.text3)
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.4)
      .attr('marker-end', 'url(#arrow-default)')
  })

  // Draw DAG nodes
  const gNodes = svg.select('.g-nodes')
  const gLabels = svg.select('.g-labels')
  nodes.forEach((name, i) => {
    const pos = DAG_POSITIONS[name]
    if (!pos) return
    const inOrder = data.algorithms.topo_sort.order.indexOf(name)
    const highlighted = highlightUpTo >= 0 && inOrder <= highlightUpTo && inOrder >= 0

    gNodes.append('circle')
      .attr('class', 'dag-node')
      .attr('cx', pos.x).attr('cy', pos.y)
      .attr('r', 16)
      .attr('fill', highlighted ? COLORS.amberMid : COLORS.surface2)
      .attr('stroke', highlighted ? COLORS.amberBright : COLORS.surface3)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .transition().duration(300).delay(i * 50)
      .attr('opacity', 1)

    gLabels.append('text')
      .attr('class', 'dag-label')
      .attr('x', pos.x).attr('y', pos.y + 32)
      .attr('text-anchor', 'middle')
      .attr('fill', highlighted ? COLORS.amberMid : COLORS.text2)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .text(name)

    if (highlighted) {
      const ordinal = inOrder + 1
      gLabels.append('text')
        .attr('class', 'dag-ordinal')
        .attr('x', pos.x).attr('y', pos.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.surface0)
        .attr('font-size', '11px')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-weight', 'bold')
        .text(String(ordinal))
    }
  })
}

function enter(svg: SVG, data: GraphData, step: number): void {
  if (step === 0) {
    dimAllEdges(svg, 0.05, 200)
    dimAllNodes(svg, 0.1, 200)
    setTimeout(() => drawDAG(svg, data, -1), 450)
    return
  }
  if (step === 1) {
    drawDAG(svg, data, -1)
    // Add in-degree badges
    data.algorithms.topo_sort.dag_nodes.forEach((name, i) => {
      const pos = DAG_POSITIONS[name]
      if (!pos) return
      const inDeg = data.algorithms.topo_sort.dag_edges.filter(([, t]) => t === i).length
      svg.select('.g-annotations')
        .append('text')
        .attr('class', 'indeg-label')
        .attr('x', pos.x + 18).attr('y', pos.y - 14)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.bfsTeal)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)')
        .attr('opacity', 0)
        .text(`in:${inDeg}`)
        .transition().delay(i * 60).duration(300).attr('opacity', 1)
    })
    return
  }
  if (step === 2) {
    svg.selectAll('.indeg-label').remove()
    // Animate highlighting nodes one by one in topo order
    const order = data.algorithms.topo_sort.order
    order.forEach((name, i) => {
      setTimeout(() => drawDAG(svg, data, i), i * 350)
    })
    return
  }
  if (step === 3) {
    drawDAG(svg, data, data.algorithms.topo_sort.order.length - 1)
    // Show full order text at bottom
    svg.select('.g-annotations')
      .append('text')
      .attr('class', 'topo-order-text')
      .attr('x', 570).attr('y', 620)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text2)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('opacity', 0)
      .text('tetM → sul1 → aac6Ib → vanA → blaTEM → blaSHV → blaCTXM → blaOXA48 → mcr1 → blaNDM1')
      .transition().duration(500).attr('opacity', 0.9)
  }
}

function exit(svg: SVG, data: GraphData): void {
  // Restore species graph
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()
  svg.select('.g-annotations').selectAll('*').remove()
  initGraph(svg.node()!, data)
  resetGraph(svg, data)
}

export const topoModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: () => [
    { label: 'ARG nodes in topological order', value: '10' },
    { label: 'dependency edges processed', value: '8' },
    { label: 'cycle detected', value: 'No' },
  ],
}
