import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, setEdgeActive } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'Identify sources and targets', detail: 'Read the computed source set and the ESKAPE targets reachable from those sources.' },
  { label: 'Sort edges by weight', detail: 'Prioritize higher-weight directed links as candidate removals.' },
  { label: 'Iterative edge removal', detail: 'Remove one edge at a time. Check connectivity. If sources still reach any target, continue.' },
  { label: 'Containment achieved', detail: 'Stop when the computed source set can no longer reach the protected target set.' },
]

function enter(svg: SVG, data: GraphData, step: number): void {
  const greedy = data.algorithms.greedy_contain

  if (step === 0) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.15)
    // Highlight sources green, targets red
    greedy.sources.forEach(id => setNodeColor(svg, id, COLORS.riskLow, 1))
    greedy.targets.forEach(id => setNodeColor(svg, id, COLORS.riskHigh, 1))
    return
  }

  if (step >= 1) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.15)
    greedy.sources.forEach(id => setNodeColor(svg, id, COLORS.riskLow, 1))
    greedy.targets.forEach(id => setNodeColor(svg, id, COLORS.riskHigh, 1))
    // Highlight top 5 heaviest edges in amber
    const top5 = greedy.removed_edges.slice(0, 5)
    top5.forEach(e => {
      setEdgeActive(svg, e.src, e.tgt, COLORS.amberMid, 2, 'arrow-active', 300)
    })
  }

  if (step >= 2) {
    // Animate removal of first 10 edges with × marks and fade
    const first10 = greedy.removed_edges.slice(0, 10)
    first10.forEach((e) => {
        // Add × at midpoint
        const sn = data.nodes[e.src], tn = data.nodes[e.tgt]
        if (!sn || !tn) return
        const mx = (sn.x + tn.x) / 2
        const my = (sn.y + tn.y) / 2
        svg.select('.g-annotations')
          .append('text')
          .attr('class', 'greedy-cross')
          .attr('x', mx).attr('y', my)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', COLORS.riskHigh)
          .attr('font-size', '12px')
          .attr('font-family', 'var(--font-mono)')
          .attr('font-weight', 'bold')
          .attr('opacity', 0)
          .text('×')
          .transition().duration(200).attr('opacity', 1)
          .transition().delay(500).duration(400).attr('opacity', 0)

        // Fade the edge
        svg.select(`#e-${e.src}-${e.tgt}`)
          .transition().delay(200).duration(600)
          .attr('stroke', COLORS.riskHigh)
          .attr('stroke-dasharray', '4 3')
          .attr('opacity', 0)
    })
    // Counter
    svg.select('.g-annotations')
      .append('text')
      .attr('class', 'greedy-counter')
      .attr('x', 570).attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.amberMid)
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .text(`removing ${greedy.n_removed} edges (showing first 10)…`)
      .attr('opacity', 0)
      .transition().duration(400).attr('opacity', 1)
  }

  if (step >= 3) {
    svg.selectAll('.greedy-cross, .greedy-counter').remove()
    resetGraph(svg, data)
    dimAllEdges(svg, 0.04)
    dimAllNodes(svg, 0.15)
    greedy.sources.forEach(id => setNodeColor(svg, id, COLORS.riskLow, 1))
    greedy.targets.forEach(id => setNodeColor(svg, id, COLORS.riskHigh, 0.8))
    // Fade all removed edges to near-invisible
    greedy.removed_edges.forEach(e => {
      svg.select(`#e-${e.src}-${e.tgt}`)
        .transition().duration(400)
        .attr('opacity', 0.02)
    })
    svg.select('.g-annotations')
      .append('text')
      .attr('class', 'greedy-done')
      .attr('x', 570).attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.riskLow)
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .attr('opacity', 0)
      .text(`✓ ${greedy.n_removed} edges removed — sources isolated from reachable targets`)
      .transition().duration(600).attr('opacity', 1)
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.greedy-cross, .greedy-counter, .greedy-done').remove()
  resetGraph(svg, data)
}

export const greedyModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'edges removed', value: String(data.algorithms.greedy_contain.n_removed) },
    { label: 'source nodes isolated', value: String(data.algorithms.greedy_contain.sources.length) },
    { label: 'reachable ESKAPE targets protected', value: String(data.algorithms.greedy_contain.targets.length) },
    { label: 'solution quality', value: 'Approximate' },
  ],
}
