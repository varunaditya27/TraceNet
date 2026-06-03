import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, initGraph, dimAllEdges, dimAllNodes, setNodeColor } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

// Fixed positions for 10-node hospital subgraph within 1140×670 viewBox
const HOSP_POSITIONS = [
  { x: 150, y: 150 }, // 0: K. pneumoniae
  { x: 150, y: 335 }, // 1: E. cloacae
  { x: 150, y: 520 }, // 2: P. aeruginosa
  { x: 380, y: 80 },  // 3: E. faecium (ESKAPE target)
  { x: 380, y: 590 }, // 4: S. aureus (ESKAPE target)
  { x: 380, y: 335 }, // 5: A. baumannii
  { x: 600, y: 200 }, // 6: E. coli
  { x: 600, y: 470 }, // 7: S. enterica
  { x: 850, y: 200 }, // 8: E. faecalis (source)
  { x: 850, y: 470 }, // 9: C. jejuni (source)
]

const STEPS: StepDef[] = [
  { label: 'Load hospital subgraph', detail: '10-node subgraph for tractable B&B search. Sources: E. faecalis (8), C. jejuni (9). Targets: E. faecium (3), S. aureus (4).' },
  { label: 'Branch & Bound search', detail: 'Enumerate edge subsets. Prune any branch where current cut size ≥ best known solution. Explore 2^E worst case but prune aggressively.' },
  { label: 'Optimal cut identified', detail: '4 edges suffice: E. faecalis→E. faecium, E. faecalis→S. aureus, C. jejuni→S. aureus, C. jejuni→E. faecium.' },
  { label: 'Greedy vs B&B comparison', detail: 'Greedy on this subgraph: 6 edges. B&B optimal: 4 edges. B&B achieves 33% fewer removals — at the cost of exponential search time.' },
]

function drawSubgraph(svg: SVG, data: GraphData, optimalHighlight = false): void {
  const bnb = data.algorithms.bnb_contain
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()

  // Draw edges between subgraph nodes
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (i === j) continue
      const sp = HOSP_POSITIONS[i], tp = HOSP_POSITIONS[j]
      const isOptimalRemoved = optimalHighlight && bnb.optimal_removed.some(e => e.src === i && e.tgt === j)
      const dx = tp.x - sp.x, dy = tp.y - sp.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (dist === 0) continue
      const ux = dx/dist, uy = dy/dist

      svg.select('.g-edges')
        .append('line')
        .attr('x1', sp.x + ux*20).attr('y1', sp.y + uy*20)
        .attr('x2', tp.x - ux*26).attr('y2', tp.y - uy*26)
        .attr('stroke', isOptimalRemoved ? COLORS.riskHigh : COLORS.text3)
        .attr('stroke-width', isOptimalRemoved ? 2.5 : 0.8)
        .attr('opacity', isOptimalRemoved ? 0.9 : 0.2)
        .attr('stroke-dasharray', isOptimalRemoved ? '5 3' : null)
        .attr('marker-end', 'url(#arrow-default)')
    }
  }

  // Draw nodes
  bnb.hospital_node_names.forEach((name, i) => {
    const pos = HOSP_POSITIONS[i]
    const isSource = bnb.sources.includes(i)
    const isTarget = bnb.targets.includes(i)
    const r = 22

    svg.select('.g-nodes')
      .append('circle')
      .attr('cx', pos.x).attr('cy', pos.y).attr('r', r)
      .attr('fill', isSource ? COLORS.riskLow : isTarget ? COLORS.riskHigh : COLORS.nodeBridge)
      .attr('stroke', COLORS.surface0).attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition().duration(400).delay(i * 60).attr('opacity', 1)

    const shortName = name.split(' ').slice(-1)[0].slice(0, 10)
    svg.select('.g-labels')
      .append('text')
      .attr('x', pos.x).attr('y', pos.y + r + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text2)
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-mono)')
      .text(shortName)
  })
}

function enter(svg: SVG, data: GraphData, step: number): void {
  const bnb = data.algorithms.bnb_contain

  if (step === 0) {
    // Fade out species graph, show subgraph
    dimAllEdges(svg, 0.05, 200)
    dimAllNodes(svg, 0.05, 200)
    setTimeout(() => {
      drawSubgraph(svg, data, false)
      // Role labels
      svg.select('.g-annotations')
        .append('text').attr('class', 'bnb-label')
        .attr('x', 570).attr('y', 36)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.text3)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)')
        .attr('letter-spacing', '0.06em')
        .text('HOSPITAL SUBGRAPH — 10 NODES')
        .attr('opacity', 0).transition().duration(400).attr('opacity', 1)
    }, 450)
    return
  }

  if (step >= 1) {
    drawSubgraph(svg, data, false)
    // Draw simple B&B tree inset
    svg.selectAll('.bnb-tree').remove()
    const tg = svg.append('g').attr('class', 'bnb-tree').attr('transform', 'translate(700, 420)')
    tg.append('rect').attr('x', 0).attr('y', 0).attr('width', 380).attr('height', 200)
      .attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3).attr('rx', 6)
    tg.append('text').attr('x', 12).attr('y', 18)
      .attr('fill', COLORS.text3).attr('font-size', '9px').attr('font-family', 'var(--font-mono)')
      .text('B&B SEARCH TREE (partial)')
    // Simple 3-level tree
    const nodes = [
      {x: 190, y: 50, label: 'root', pruned: false},
      {x: 100, y: 100, label: 'e0 in', pruned: false},
      {x: 280, y: 100, label: 'e0 out', pruned: true},
      {x: 60,  y: 150, label: 'e1 in', pruned: false},
      {x: 140, y: 150, label: 'e1 out', pruned: true},
    ]
    nodes.forEach((n, i) => {
      tg.append('circle').attr('cx', n.x).attr('cy', n.y).attr('r', 8)
        .attr('fill', n.pruned ? COLORS.riskHigh : COLORS.amberDim)
        .attr('opacity', 0).transition().delay(i*150).duration(300).attr('opacity', 0.9)
      tg.append('text').attr('x', n.x).attr('y', n.y + 20)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text3)
        .attr('font-size', '8px').attr('font-family', 'var(--font-mono)')
        .text(n.pruned ? `${n.label} ✗` : n.label)
      if (i === 1 || i === 2) {
        tg.append('line')
          .attr('x1', nodes[0].x).attr('y1', nodes[0].y+8)
          .attr('x2', n.x).attr('y2', n.y-8)
          .attr('stroke', n.pruned ? COLORS.riskHigh : COLORS.surface3)
          .attr('stroke-dasharray', n.pruned ? '3 2' : null)
          .attr('stroke-width', 1)
      }
      if (i === 3 || i === 4) {
        tg.append('line')
          .attr('x1', nodes[1].x).attr('y1', nodes[1].y+8)
          .attr('x2', n.x).attr('y2', n.y-8)
          .attr('stroke', n.pruned ? COLORS.riskHigh : COLORS.surface3)
          .attr('stroke-dasharray', n.pruned ? '3 2' : null)
          .attr('stroke-width', 1)
      }
    })
  }

  if (step >= 2) {
    svg.selectAll('.bnb-tree').remove()
    drawSubgraph(svg, data, true)
    // Show optimal removed edges
    bnb.optimal_removed.forEach(e => {
      const sp = HOSP_POSITIONS[e.src], tp = HOSP_POSITIONS[e.tgt]
      if (!sp || !tp) return
      const mx = (sp.x + tp.x) / 2, my = (sp.y + tp.y) / 2
      svg.select('.g-annotations')
        .append('text').attr('class', 'bnb-cut-mark')
        .attr('x', mx).attr('y', my)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', COLORS.riskHigh).attr('font-size', '16px').attr('font-weight', 'bold')
        .attr('opacity', 0).text('✂')
        .transition().delay(200).duration(400).attr('opacity', 1)
    })
  }

  if (step >= 3) {
    svg.selectAll('.bnb-tree, .bnb-cut-mark').remove()
    drawSubgraph(svg, data, false)
    // Comparison panel
    const cp = svg.append('g').attr('class', 'bnb-compare').attr('transform', 'translate(620, 240)')
    cp.append('rect').attr('x', 0).attr('y', 0).attr('width', 440).attr('height', 130)
      .attr('fill', COLORS.surface1).attr('stroke', COLORS.surface3).attr('rx', 8)
    ;[
      { label: 'Greedy (subgraph)', value: `${bnb.greedy_cost} edges`, color: COLORS.amberMid, x: 70 },
      { label: 'B&B Optimal', value: `${bnb.optimal_cost} edges`, color: COLORS.riskLow, x: 270 },
    ].forEach(({ label, value, color, x }) => {
      cp.append('text').attr('x', x).attr('y', 36)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text2)
        .attr('font-size', '10px').attr('font-family', 'var(--font-sans)').text(label)
      cp.append('text').attr('x', x).attr('y', 72)
        .attr('text-anchor', 'middle').attr('fill', color)
        .attr('font-size', '28px').attr('font-family', 'var(--font-display)').text(value)
    })
    cp.append('text').attr('x', 220).attr('y', 110)
      .attr('text-anchor', 'middle').attr('fill', COLORS.text3)
      .attr('font-size', '10px').attr('font-family', 'var(--font-mono)')
      .text('B&B achieves 33% fewer removals — exact optimal')
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.bnb-tree, .bnb-cut-mark, .bnb-compare, .bnb-label').remove()
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()
  svg.select('.g-annotations').selectAll('*').remove()
  initGraph(svg.node()!, data)
  resetGraph(svg, data)
}

export const bnbModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'optimal cut (B&B)', value: String(data.algorithms.bnb_contain.optimal_cost) },
    { label: 'greedy cut on subgraph', value: String(data.algorithms.bnb_contain.greedy_cost) },
    { label: 'improvement over greedy', value: '33%' },
    { label: 'solution quality', value: 'Exact optimal' },
  ],
}
