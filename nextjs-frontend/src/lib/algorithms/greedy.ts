import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, setEdgeActive } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'
import { useDemoStore } from '@/store/demo-store'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'Identify sources and targets', detail: 'Read the computed source set and the ESKAPE targets reachable from those sources.' },
  { label: 'Sort edges by weight', detail: 'Prioritize higher-weight directed links as candidate removals.' },
  { label: 'Iterative edge removal', detail: 'Remove one edge at a time. Check connectivity. If sources still reach any target, continue.' },
  { label: 'Containment achieved', detail: 'Stop when the computed source set can no longer reach the protected target set.' },
]

function drawGreedyLegend(svg: SVG): void {
  const legendGroup = svg.select('.g-annotations')
    .append('g')
    .attr('class', 'greedy-legend')
    .attr('transform', 'translate(50, 48)')
  
  // Environmental Source
  legendGroup.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 6).attr('fill', COLORS.riskLow)
  legendGroup.append('text').attr('x', 24).attr('y', 14).attr('fill', COLORS.text1).attr('font-size', '11px').attr('font-family', 'var(--font-sans)').text('Environmental Source')
  
  // ESKAPE Target
  legendGroup.append('circle').attr('cx', 10).attr('cy', 30).attr('r', 6).attr('fill', COLORS.riskHigh)
  legendGroup.append('text').attr('x', 24).attr('y', 34).attr('fill', COLORS.text1).attr('font-size', '11px').attr('font-family', 'var(--font-sans)').text('ESKAPE Target')

  // Removed Pathway
  legendGroup.append('line').attr('x1', 0).attr('y1', 50).attr('x2', 20).attr('y2', 50).attr('stroke', COLORS.riskHigh).attr('stroke-width', 2).attr('stroke-dasharray', '4 3')
  legendGroup.append('text').attr('x', 24).attr('y', 54).attr('fill', COLORS.text1).attr('font-size', '11px').attr('font-family', 'var(--font-sans)').text('Removed Pathway')
}

function enter(svg: SVG, data: GraphData, step: number): void {
  const greedy = data.algorithms.greedy_contain

  // Deduplicate and clean any leftover greedy overlay elements
  svg.selectAll('.greedy-cross, .greedy-counter, .greedy-done, .greedy-legend, .greedy-status, .greedy-counter-text, .greedy-cross-mark, .greedy-ripple').remove()

  // Draw before/after connectivity status
  const statusGroup = svg.select('.g-annotations')
    .append('g')
    .attr('class', 'greedy-status')
    .attr('transform', 'translate(450, 20)')
  
  statusGroup.append('rect')
    .attr('width', 240)
    .attr('height', 36)
    .attr('rx', 6)
    .attr('fill', COLORS.surface2)
    .attr('stroke', COLORS.surface3)
    .attr('stroke-width', 1.5)
  
  statusGroup.append('text')
    .attr('x', 120)
    .attr('y', 22)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .attr('fill', step >= 3 ? COLORS.riskLow : COLORS.riskHigh)
    .text(step >= 3 ? 'STATUS: ISOLATED' : 'STATUS: CONNECTED')

  // Always draw the in-graph legend
  drawGreedyLegend(svg)

  if (step === 0) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.15)
    greedy.sources.forEach(id => setNodeColor(svg, id, COLORS.riskLow, 1))
    greedy.targets.forEach(id => setNodeColor(svg, id, COLORS.riskHigh, 1))
    return
  }

  if (step === 1) {
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
    return
  }

  if (step === 2) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.15)
    greedy.sources.forEach(id => setNodeColor(svg, id, COLORS.riskLow, 1))
    greedy.targets.forEach(id => setNodeColor(svg, id, COLORS.riskHigh, 1))

    // Run concentric green BFS ripple from sources
    greedy.sources.forEach(srcId => {
      const srcNode = data.nodes[srcId]
      if (!srcNode) return
      
      svg.select('.g-annotations')
        .append('circle')
        .attr('class', 'greedy-ripple')
        .attr('cx', srcNode.x)
        .attr('cy', srcNode.y)
        .attr('r', 16)
        .attr('fill', 'none')
        .attr('stroke', COLORS.riskLow)
        .attr('stroke-width', 2)
        .attr('opacity', 0.8)
        .transition()
        .duration(1200)
        .ease(d3.easeQuadOut)
        .attr('r', 140)
        .attr('opacity', 0)
        .remove()
    })

    // Setup counter text container
    const counterText = svg.select('.g-annotations')
      .append('text')
      .attr('class', 'greedy-counter-text')
      .attr('x', 570).attr('y', 75)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.amberMid)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .text('Initializing containment check...')

    // Animate removal of first 10 edges sequentially with live count
    const first10 = greedy.removed_edges.slice(0, 10)
    first10.forEach((e, idx) => {
      const delay = idx * 220
      d3.timeout(() => {
        const store = useDemoStore.getState()
        if (store.selectedAlgo !== 'greedy_contain' || store.currentStep !== 2) return
        if (svg.select('.g-annotations').empty()) return // safety checks
        
        const sn = data.nodes[e.src], tn = data.nodes[e.tgt]
        if (!sn || !tn) return
        const mx = (sn.x + tn.x) / 2
        const my = (sn.y + tn.y) / 2

        // Draw × mark
        svg.select('.g-annotations')
          .append('text')
          .attr('class', 'greedy-cross-mark')
          .attr('x', mx).attr('y', my)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', COLORS.riskHigh)
          .attr('font-size', '14px')
          .attr('font-family', 'var(--font-mono)')
          .attr('font-weight', 'bold')
          .text('×')
          .attr('opacity', 0)
          .transition().duration(200).attr('opacity', 1)

        // Fade the edge
        svg.select(`#e-${e.src}-${e.tgt}`)
          .transition().duration(500)
          .attr('stroke', COLORS.riskHigh)
          .attr('stroke-dasharray', '4 3')
          .attr('opacity', 0.1)

        // Update count text
        counterText.text(`Removing: ${sn.short} → ${tn.short} (${idx + 1}/10 cuts shown, total = ${greedy.n_removed})`)
      }, delay)
    })
  }

  if (step >= 3) {
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

    // Containment complete banner
    svg.select('.g-annotations')
      .append('text')
      .attr('class', 'greedy-done')
      .attr('x', 570).attr('y', 75)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.riskLow)
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .attr('opacity', 0)
      .text(`✓ ${greedy.n_removed} edges removed — sources fully isolated from reachable targets`)
      .transition().duration(600).attr('opacity', 1)

    // Side-by-side gap card
    const compareGroup = svg.select('.g-annotations')
      .append('g')
      .attr('class', 'greedy-done')
      .attr('transform', 'translate(50, 520)')
    
    compareGroup.append('rect')
      .attr('width', 250)
      .attr('height', 85)
      .attr('rx', 6)
      .attr('fill', COLORS.surface2)
      .attr('stroke', COLORS.surface3)
      .attr('stroke-width', 1.5)
    
    compareGroup.append('text')
      .attr('x', 12)
      .attr('y', 25)
      .attr('fill', COLORS.text1)
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-weight', 600)
      .text('Solution Quality Comparison')
    
    compareGroup.append('text')
      .attr('x', 12)
      .attr('y', 48)
      .attr('fill', COLORS.text2)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)')
      .text(`Greedy Removals (Full Graph): ${greedy.n_removed} edges`)
    
    compareGroup.append('text')
      .attr('x', 12)
      .attr('y', 68)
      .attr('fill', COLORS.amberBright)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)')
      .text('Switch to Branch & Bound for exact comparison.')
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.greedy-cross, .greedy-counter, .greedy-done, .greedy-legend, .greedy-status, .greedy-counter-text, .greedy-cross-mark, .greedy-ripple').remove()
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
