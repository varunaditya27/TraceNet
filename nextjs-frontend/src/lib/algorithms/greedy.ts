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

function enter(svg: SVG, data: GraphData, step: number, _visualState?: any, absoluteStep?: number): void {
  const greedy = data.algorithms.greedy_contain
  const currentAbsoluteStep = absoluteStep ?? step

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
    // absoluteStep 0 = "Define the containment objective" — focus on sources/targets only.
    // absoluteStep 1 = "Collect candidate directed edges" — text says "all edges remain
    // visible", so don't dim them into near-invisibility here like the other steps.
    dimAllEdges(svg, currentAbsoluteStep === 1 ? 0.3 : 0.05)
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

    if (currentAbsoluteStep === 2) {
      // "Sort by descending weight" — show the ranked candidates broadly
      const top5 = greedy.removed_edges.slice(0, 5)
      top5.forEach(e => {
        setEdgeActive(svg, e.src, e.tgt, COLORS.amberDim, 1.5, 'arrow-active', 300)
      })
    } else {
      // "Select the heaviest edge" — isolate the single first-ranked edge
      const heaviest = greedy.removed_edges[0]
      if (heaviest) {
        setEdgeActive(svg, heaviest.src, heaviest.tgt, COLORS.amberBright, 3, 'arrow-active', 300)
      }
    }
    return
  }

  if (step === 2) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.15)
    greedy.sources.forEach(id => setNodeColor(svg, id, COLORS.riskLow, 1))
    greedy.targets.forEach(id => setNodeColor(svg, id, COLORS.riskHigh, 1))

    const drawCrossMark = (e: { src: number; tgt: number }) => {
      const sn = data.nodes[e.src], tn = data.nodes[e.tgt]
      if (!sn || !tn) return
      const mx = (sn.x + tn.x) / 2
      const my = (sn.y + tn.y) / 2

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

      svg.select(`#e-${e.src}-${e.tgt}`)
        .transition().duration(500)
        .attr('stroke', COLORS.riskHigh)
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.1)
    }

    // These four narrative steps (4-7) each describe a distinct moment in the removal loop —
    // render a deterministic snapshot for each rather than always replaying the same animation.
    // 4 = Remove the selected edge (exactly 1 removed so far)
    // 5 = Run a reachability check (still 1 removed, plus a BFS ripple from the sources)
    // 6 = Continue when a target remains reachable (the next ranked edge gets added)
    // 7 = Accumulate removals (the loop has been repeating — show the counter climb toward the full result)
    if (currentAbsoluteStep === 7) {
      const counterText = svg.select('.g-annotations')
        .append('text')
        .attr('class', 'greedy-counter-text')
        .attr('x', 570).attr('y', 75)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.amberMid)
        .attr('font-size', '11px')
        .attr('font-family', 'var(--font-mono)')
        .text('Accumulating removals...')

      const shown = greedy.removed_edges.slice(0, Math.min(10, greedy.removed_edges.length))
      shown.forEach((e, idx) => {
        const delay = idx * 220
        d3.timeout(() => {
          const store = useDemoStore.getState()
          if (store.selectedAlgo !== 'greedy_contain' || store.currentStep !== currentAbsoluteStep) return
          if (svg.select('.g-annotations').empty()) return // safety checks

          const sn = data.nodes[e.src], tn = data.nodes[e.tgt]
          if (!sn || !tn) return
          drawCrossMark(e)
          counterText.text(`Removing: ${sn.short} → ${tn.short} (${idx + 1}/${shown.length} shown, total = ${greedy.n_removed})`)
        }, delay)
      })
    } else {
      const shownCount = currentAbsoluteStep === 6 ? 2 : 1
      greedy.removed_edges.slice(0, shownCount).forEach(drawCrossMark)

      svg.select('.g-annotations')
        .append('text')
        .attr('class', 'greedy-counter-text')
        .attr('x', 570).attr('y', 75)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.amberMid)
        .attr('font-size', '11px')
        .attr('font-family', 'var(--font-mono)')
        .text(`Removed so far: ${shownCount} edge${shownCount === 1 ? '' : 's'} — target still reachable`)

      if (currentAbsoluteStep === 5) {
        // "Run a reachability check" — the BFS/DFS traversal ripple belongs on this exact step
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
      }
    }
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

    if (currentAbsoluteStep === 8) {
      // "Detect successful containment" — lesson text: ripples now stop short of every
      // target instead of reaching it, so cap each ripple's radius at the nearest target.
      greedy.sources.forEach(srcId => {
        const srcNode = data.nodes[srcId]
        if (!srcNode) return
        const nearestTargetDist = Math.min(
          ...greedy.targets.map(tid => {
            const t = data.nodes[tid]
            return t ? Math.hypot(t.x - srcNode.x, t.y - srcNode.y) : Infinity
          }),
          140,
        )
        const stopRadius = Math.max(30, nearestTargetDist - 40)
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
          .duration(900)
          .ease(d3.easeQuadOut)
          .attr('r', stopRadius)
          .attr('opacity', 0.15)
      })
    }

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
