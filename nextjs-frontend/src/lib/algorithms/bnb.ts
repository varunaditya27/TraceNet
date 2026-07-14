import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, initGraph, dimAllEdges, dimAllNodes } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'
import { useDemoStore } from '@/store/demo-store'
import { computeSubgraphGreedy, getHospitalSubgraphEdges } from '@/lib/execution/bnb-subgraph-greedy'

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

// AlgorithmModule.steps is unused dead weight — nothing in the app reads it (see
// algorithm-lessons.ts for the live narrative content). Left empty deliberately.
const STEPS: StepDef[] = []

function drawBnbLegend(svg: SVG): void {
  const legendGroup = svg.select('.g-annotations')
    .append('g')
    .attr('class', 'bnb-label')
    .attr('transform', 'translate(50, 48)')
  
  // Environmental Source
  legendGroup.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 6).attr('fill', COLORS.riskLow)
  legendGroup.append('text').attr('x', 24).attr('y', 14).attr('fill', COLORS.text1).attr('font-size', '11px').attr('font-family', 'var(--font-sans)').text('Hospital Source')
  
  // ESKAPE Target
  legendGroup.append('circle').attr('cx', 10).attr('cy', 30).attr('r', 6).attr('fill', COLORS.riskHigh)
  legendGroup.append('text').attr('x', 24).attr('y', 34).attr('fill', COLORS.text1).attr('font-size', '11px').attr('font-family', 'var(--font-sans)').text('Hospital Target')

  // Intermediate node
  legendGroup.append('circle').attr('cx', 10).attr('cy', 50).attr('r', 6).attr('fill', COLORS.nodeBridge)
  legendGroup.append('text').attr('x', 24).attr('y', 54).attr('fill', COLORS.text1).attr('font-size', '11px').attr('font-family', 'var(--font-sans)').text('Hospital Intermediate')
}

function drawSubgraph(svg: SVG, data: GraphData, optimalHighlight = false): number {
  const bnb = data.algorithms.bnb_contain
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()

  const subgraphEdges = getHospitalSubgraphEdges(data)

  // Draw only real graph edges whose endpoints are in the hospital subgraph.
  subgraphEdges.forEach(edge => {
      const sp = HOSP_POSITIONS[edge.src] || { x: 400, y: 300 }
      const tp = HOSP_POSITIONS[edge.tgt] || { x: 400, y: 300 }
      const isOptimalRemoved = optimalHighlight && bnb.optimal_removed.some(e => e.src === edge.src && e.tgt === edge.tgt)
      const dx = tp.x - sp.x, dy = tp.y - sp.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (dist === 0) return
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
  })

  // Draw nodes
  bnb.hospital_node_names.forEach((name, i) => {
    const pos = HOSP_POSITIONS[i] || { x: 400 + (i % 3) * 120, y: 150 + Math.floor(i / 3) * 120 }
    const isSource = bnb.sources.includes(i)
    const isTarget = bnb.targets.includes(i)
    const r = 22

    svg.select('.g-nodes')
      .append('circle')
      .attr('id', `hosp-n-${i}`)
      .attr('cx', pos.x).attr('cy', pos.y).attr('r', r)
      .attr('fill', isSource ? COLORS.riskLow : isTarget ? COLORS.riskHigh : COLORS.nodeBridge)
      .attr('stroke', COLORS.surface0).attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition().duration(400).delay(i * 40).attr('opacity', 1)

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

  return subgraphEdges.length
}

function enter(svg: SVG, data: GraphData, step: number, _visualState?: any, absoluteStep?: number): void {
  const bnb = data.algorithms.bnb_contain
  const currentAbsoluteStep = absoluteStep ?? step
  // The dataset's own `greedy_cost` isn't confined to this subgraph (see bnb-subgraph-greedy.ts)
  // — use a real subgraph-only greedy run instead, so the B&B comparison is genuinely fair.
  const subgraphGreedy = computeSubgraphGreedy(data)

  // Deduplicate and clean all B&B specific elements at start of step
  svg.selectAll('.bnb-tree, .bnb-cut-mark, .bnb-compare, .bnb-label').remove()

  // Always draw the in-graph legend
  drawBnbLegend(svg)

  if (step === 0) {
    // Fade out species graph, show subgraph
    dimAllEdges(svg, 0.05, 200)
    dimAllNodes(svg, 0.05, 200)
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
    return
  }

  if (step === 1) {
    const edgeCount = drawSubgraph(svg, data, false)

    // Draw representative B&B search tree inset derived from actual cuts
    const tg = svg.append('g').attr('class', 'bnb-tree').attr('transform', 'translate(700, 420)')
    tg.append('rect').attr('x', 0).attr('y', 0).attr('width', 380).attr('height', 200)
      .attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3).attr('rx', 6)
    tg.append('text').attr('x', 12).attr('y', 18)
      .attr('fill', COLORS.text3).attr('font-size', '9px').attr('font-family', 'var(--font-mono)')
      .text('B&B DECISION TREE (derived from candidate cuts)')

    // Build levels dynamically using optimal_removed edge details
    const treeNodes = [
      { x: 190, y: 35, label: 'Root (All active)', pruned: false, type: 'root' }
    ]

    bnb.optimal_removed.slice(0, 2).forEach((edge, idx) => {
      const sn = bnb.hospital_node_names[edge.src].split(' ').pop() || ''
      const tn = bnb.hospital_node_names[edge.tgt].split(' ').pop() || ''
      const edgeLabel = `${sn}➔${tn}`

      // "Remove"/"Retain" refer to the edge itself (remove it from the graph vs. leave it in
      // place) — deliberately not "include"/"exclude", which read ambiguously against "the cut".
      const y = 80 + idx * 50
      treeNodes.push({
        x: 100 - idx * 20,
        y: y,
        label: `Remove ${edgeLabel}`,
        pruned: false,
        type: 'branch'
      })
      treeNodes.push({
        x: 280 + idx * 20,
        y: y,
        label: `Retain ${edgeLabel}`,
        pruned: true,
        type: 'prune'
      })
    })

    // absoluteStep 2-8 are seven distinct narrative beats within this single phase — reveal
    // the tree progressively instead of rendering the whole thing identically for all seven.
    // 2 = Initialize incumbent (root only)
    // 3 = Choose next undecided edge (both children of the first fork appear, unexplored)
    // 4 = Explore the remove branch (left child highlighted as active)
    // 5 = Explore the keep branch (right child highlighted as active)
    // 6 = Evaluate a lower bound (bound annotation appears beside the keep branch)
    // 7 = Prune a dominated branch (the keep branch now renders as pruned)
    // 8 = Test a complete cut (the second candidate edge's fork appears)
    const revealCount = currentAbsoluteStep <= 2 ? 1 : currentAbsoluteStep === 8 ? 5 : 3
    const pruneVerdictShown = currentAbsoluteStep >= 7
    const activeIdx = currentAbsoluteStep === 4 ? 1 : currentAbsoluteStep === 5 ? 2 : -1

    treeNodes.forEach((n, i) => {
      if (i >= revealCount) return
      const isPrunedNow = n.pruned && pruneVerdictShown
      const isActive = i === activeIdx

      const circle = tg.append('circle').attr('cx', n.x).attr('cy', n.y)
        .attr('r', isActive ? 10 : 8)
        .attr('fill', isPrunedNow ? COLORS.riskHigh : n.type === 'root' ? COLORS.bfsTeal : isActive ? COLORS.amberBright : COLORS.amberDim)
        .attr('stroke', isActive ? COLORS.amberBright : 'none')
        .attr('stroke-width', isActive ? 2 : 0)
        .attr('opacity', 0).transition().delay(i * 100).duration(200).attr('opacity', 0.9)
      if (isActive) {
        circle.transition().delay(300).duration(250).attr('r', 12).transition().duration(250).attr('r', 10)
      }

      tg.append('text').attr('x', n.x).attr('y', n.y + 19)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text2)
        .attr('font-size', '8px').attr('font-family', 'var(--font-mono)')
        .text(isPrunedNow ? `${n.label} ✗` : n.label)

      if (i > 0) {
        const parentIdx = i % 2 === 1 ? Math.floor(i / 2) : Math.floor((i - 1) / 2)
        const parent = treeNodes[parentIdx]
        if (parent) {
          tg.append('line')
            .attr('x1', parent.x).attr('y1', parent.y + 8)
            .attr('x2', n.x).attr('y2', n.y - 8)
            .attr('stroke', isPrunedNow ? COLORS.riskHigh : COLORS.surface3)
            .attr('stroke-dasharray', isPrunedNow ? '3 2' : null)
            .attr('stroke-width', 1.2)
        }
      }
    })

    if (currentAbsoluteStep === 2) {
      tg.append('text').attr('x', 190).attr('y', 55)
        .attr('text-anchor', 'middle').attr('fill', COLORS.amberBright)
        .attr('font-size', '8px').attr('font-family', 'var(--font-mono)')
        .text(`incumbent bound = ${subgraphGreedy.cost}`)
    }
    if (currentAbsoluteStep === 6 && treeNodes[2]) {
      tg.append('text').attr('x', treeNodes[2].x).attr('y', treeNodes[2].y - 14)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text2)
        .attr('font-size', '8px').attr('font-family', 'var(--font-mono)')
        .text('bound ≥ incumbent?')
    }

    // Honest, data-derived context instead of a fabricated pruning percentage: the real
    // search-tree statistics aren't stored anywhere, but the candidate edge count is.
    tg.append('text')
      .attr('x', 368)
      .attr('y', 18)
      .attr('text-anchor', 'end')
      .attr('fill', COLORS.amberBright)
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-mono)')
      .text(`${edgeCount} candidate edges → 2^${edgeCount} possible subsets`)
    return
  }

  if (step === 2) {
    drawSubgraph(svg, data, true)
    
    if (currentAbsoluteStep === 10) {
      // "Exhaust all competitive branches" — the tree inset only exists during absoluteStep
      // 2-8 (it's cleared at the top of every enter() call), so by this step there's no tree
      // left to show "explored and pruned regions" on. Summarize the same idea in words
      // instead of promising a visual that no longer exists.
      svg.select('.g-annotations')
        .append('text').attr('class', 'bnb-cut-mark')
        .attr('x', 570).attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.bfsTeal)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)')
        .text(`Search complete — all ${subgraphGreedy.edges.length} candidate edges explored or safely pruned`)
    }

     // Show optimal removed edges sequentially with scissor animation
     bnb.optimal_removed.forEach((e, idx) => {
       const delay = idx * 300
       d3.timeout(() => {
         const store = useDemoStore.getState()
         if (store.selectedAlgo !== 'bnb_contain' || store.currentStep !== currentAbsoluteStep) return
         if (svg.select('.g-annotations').empty()) return // safety check
         
         const sp = HOSP_POSITIONS[e.src] || { x: 400, y: 300 }
         const tp = HOSP_POSITIONS[e.tgt] || { x: 400, y: 300 }
         const mx = (sp.x + tp.x) / 2, my = (sp.y + tp.y) / 2
         
         svg.select('.g-annotations')
           .append('text').attr('class', 'bnb-cut-mark')
           .attr('x', mx).attr('y', my)
           .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
           .attr('fill', COLORS.riskHigh).attr('font-size', '16px').attr('font-weight', 'bold')
           .attr('opacity', 0).text('✂')
           .transition().duration(250).attr('opacity', 1)
           
         // Pulse target node on cut — use stable ID assigned in drawSubgraph
         svg.select(`#hosp-n-${e.tgt}`)
           .transition().duration(150).attr('r', 26)
           .transition().duration(150).attr('r', 22)
       }, delay)
     })
    return
  }

  if (step >= 3) {
    drawSubgraph(svg, data, false)
    
    // Comparison panel with counting transition
    const cp = svg.append('g').attr('class', 'bnb-compare').attr('transform', 'translate(620, 240)')
    cp.append('rect').attr('x', 0).attr('y', 0).attr('width', 440).attr('height', 130)
      .attr('fill', COLORS.surface1).attr('stroke', COLORS.surface3).attr('rx', 8)
    
    cp.append('text').attr('x', 110).attr('y', 36)
      .attr('text-anchor', 'middle').attr('fill', COLORS.text2)
      .attr('font-size', '10px').attr('font-family', 'var(--font-sans)').text('Greedy (subgraph)')
      
    cp.append('text').attr('x', 330).attr('y', 36)
      .attr('text-anchor', 'middle').attr('fill', COLORS.text2)
      .attr('font-size', '10px').attr('font-family', 'var(--font-sans)').text('B&B Optimal')

    const gText = cp.append('text').attr('x', 110).attr('y', 72)
      .attr('text-anchor', 'middle').attr('fill', COLORS.amberMid)
      .attr('font-size', '28px').attr('font-family', 'var(--font-display)')
      .text('0')
    
    gText.transition().duration(800)
      .tween('text', () => {
        const interp = d3.interpolateNumber(0, subgraphGreedy.cost)
        return t => gText.text(`${Math.round(interp(t))} edges`)
      })

    const oText = cp.append('text').attr('x', 330).attr('y', 72)
      .attr('text-anchor', 'middle').attr('fill', COLORS.riskLow)
      .attr('font-size', '28px').attr('font-family', 'var(--font-display)')
      .text('0')
    
    oText.transition().duration(1000)
      .tween('text', () => {
        const interp = d3.interpolateNumber(0, bnb.optimal_cost)
        return t => oText.text(`${Math.round(interp(t))} edges`)
      })

    cp.append('text').attr('x', 220).attr('y', 110)
      .attr('text-anchor', 'middle').attr('fill', COLORS.text3)
      .attr('font-size', '10px').attr('font-family', 'var(--font-mono)')
      .text(`B&B saves ${subgraphGreedy.cost - bnb.optimal_cost} directed removals — exact optimal`)
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.bnb-tree, .bnb-cut-mark, .bnb-compare, .bnb-label').remove()
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()
  svg.select('.g-annotations').selectAll('*').remove()
  
  const svgEl = svg.node()
  if (svgEl) {
    initGraph(svgEl, data)
  }
  resetGraph(svg, data)
}

export const bnbModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => {
    const subgraphGreedy = computeSubgraphGreedy(data)
    return [
      { label: 'optimal cut (B&B)', value: String(data.algorithms.bnb_contain.optimal_cost) },
      { label: 'greedy cut on subgraph', value: String(subgraphGreedy.cost) },
      { label: 'directed removals saved', value: String(subgraphGreedy.cost - data.algorithms.bnb_contain.optimal_cost) },
      { label: 'solution quality', value: 'Exact optimal' },
    ]
  },
}
