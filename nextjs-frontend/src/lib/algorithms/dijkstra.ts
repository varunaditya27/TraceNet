import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, setEdgeActive, addTextLabel } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'
import { useDemoStore } from '@/store/demo-store'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

// AlgorithmModule.steps is unused dead weight — nothing in the app reads it (see
// algorithm-lessons.ts for the live narrative content). Left empty deliberately.
const STEPS: StepDef[] = []

function enter(svg: SVG, data: GraphData, step: number, _visualState?: any, absoluteStep?: number): void {
  const dijk = data.algorithms.dijkstra

  // Always remove old Dijkstra annotations/labels first to avoid piling up
  svg.selectAll('.dijk-label').remove()

  const absStep = absoluteStep ?? step

  // Helper for rendering formula legend in top-right
  const drawFormulaLegend = (formula: string, desc: string, highlight = false) => {
    const legend = svg.select('.g-annotations')
      .append('g')
      .attr('class', 'dijk-label')
      .attr('transform', 'translate(850, 40)')

    legend.append('rect')
      .attr('width', 240)
      .attr('height', 60)
      .attr('rx', 6)
      .attr('fill', COLORS.surface2)
      .attr('stroke', COLORS.surface3)
      .attr('stroke-width', 1.5)

    legend.append('text')
      .attr('x', 12)
      .attr('y', 22)
      .attr('fill', COLORS.text2)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)')
      .text(desc)

    legend.append('text')
      .attr('x', 12)
      .attr('y', 42)
      .attr('fill', highlight ? COLORS.riskHigh : COLORS.amberBright)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-mono)')
      .text(formula)
  }

  // Phase 0: Initialization (absoluteStep 0 to 3)
  if (absStep <= 3) {
    if (absStep === 0) {
      // 0: Transform transfer weights
      resetGraph(svg, data)
      dimAllNodes(svg, 0.4)
      dimAllEdges(svg, 0.2)
      // Only label the source's own edges here — labeling all 144 directed edges on a
      // near-complete 16-node graph is unreadable clutter, and the source's edges are
      // exactly what steps 4-8 zoom into next.
      data.edges
        .filter(edge => edge.src === dijk.source)
        .forEach(edge => {
          const srcNode = data.nodes[edge.src]
          const tgtNode = data.nodes[edge.tgt]
          if (!srcNode || !tgtNode) return
          const mx = (srcNode.x + tgtNode.x) / 2
          const my = (srcNode.y + tgtNode.y) / 2
          const logCost = -Math.log(edge.weight)
          addTextLabel(svg, mx, my - 6, logCost.toFixed(2), COLORS.text2, '9px', 'dijk-label')
        })
      drawFormulaLegend('d = -log(weight)', 'Edge Weight Transformation')
    } else if (absStep === 1) {
      // 1: Initialize all distances
      resetGraph(svg, data)
      dimAllEdges(svg, 0.05)
      dimAllNodes(svg, 0.2)
      data.nodes.forEach(node => {
        addTextLabel(svg, node.x, node.y - 18, '∞', COLORS.text2, '11px', 'dijk-label')
      })
      drawFormulaLegend('dist[v] = ∞', 'Initial Tentative Distances')
    } else if (absStep === 2) {
      // 2: Seed the source
      resetGraph(svg, data)
      dimAllEdges(svg, 0.05)
      dimAllNodes(svg, 0.2)
      data.nodes.forEach(node => {
        if (node.id !== dijk.source) {
          addTextLabel(svg, node.x, node.y - 18, '∞', COLORS.text2, '11px', 'dijk-label')
        } else {
          setNodeColor(svg, node.id, COLORS.amberMid, 1)
          addTextLabel(svg, node.x, node.y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')
        }
      })
      drawFormulaLegend('dist[source] = 0', 'Seed Source Node')
    } else if (absStep === 3) {
      // 3: Initialize the min-heap
      resetGraph(svg, data)
      dimAllEdges(svg, 0.05)
      dimAllNodes(svg, 0.2)
      setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
      addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

      // Draw Priority Queue Heap box in bottom-left
      const pqGroup = svg.select('.g-annotations')
        .append('g')
        .attr('class', 'dijk-label')
        .attr('transform', 'translate(50, 520)')
      
      pqGroup.append('rect')
        .attr('width', 220)
        .attr('height', 80)
        .attr('rx', 6)
        .attr('fill', COLORS.surface2)
        .attr('stroke', COLORS.surface3)
        .attr('stroke-width', 1.5)
      
      pqGroup.append('text')
        .attr('x', 12)
        .attr('y', 25)
        .attr('fill', COLORS.text1)
        .attr('font-size', '12px')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-weight', 600)
        .text('Min-Priority Queue Heap')
      
      pqGroup.append('text')
        .attr('x', 12)
        .attr('y', 52)
        .attr('fill', COLORS.amberBright)
        .attr('font-size', '13px')
        .attr('font-family', 'var(--font-mono)')
        .text(`[(0.000, ${data.nodes[dijk.source].short})]`)
    }
    return
  }

  // Step 4: Inspect outgoing weighted edge (relaxation happens before extraction)
  if (absStep === 4) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

    // Node 8 (K. oxytoca) is the target we zoom into, but relaxation really happens for
    // every direct edge from the source — show the rest dimly so "closest unsettled node"
    // (step 7) is visually earned rather than asserted from a single unrepresentative example.
    const sourceEdges = data.edges.filter(edge => edge.src === dijk.source)
    const targetId = 8
    sourceEdges.forEach(edge => {
      if (edge.tgt !== targetId) setEdgeActive(svg, edge.src, edge.tgt, COLORS.amberDim, 1.5, 'arrow-default', 0)
    })
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y + 32,
      `${sourceEdges.length} direct edges — 1 shown in detail`, COLORS.text2, '9px', 'dijk-label')

    const tgtNode = data.nodes[targetId]
    const edge08 = sourceEdges.find(edge => edge.tgt === targetId)
    if (tgtNode && edge08) {
      setNodeColor(svg, targetId, COLORS.nodeBridge, 0.8)
      addTextLabel(svg, tgtNode.x, tgtNode.y - 18, 'd=∞', COLORS.text3, '11px', 'dijk-label')

      // Highlight the inspected edge
      setEdgeActive(svg, dijk.source, targetId, COLORS.amberBright, 3.5, 'arrow-active', 0)

      // Show edge properties, derived live from the real edge record (not hardcoded)
      const mx = (data.nodes[dijk.source].x + tgtNode.x) / 2
      const my = (data.nodes[dijk.source].y + tgtNode.y) / 2
      addTextLabel(svg, mx, my - 16, `w = ${edge08.weight.toFixed(3)}`, COLORS.text2, '9px', 'dijk-label')
      addTextLabel(svg, mx, my - 4, `cost = ${edge08.dist.toFixed(3)}`, COLORS.amberBright, '10px', 'dijk-label')
    }
    return
  }

  // Step 5: Calculate a candidate distance
  if (absStep === 5) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

    const targetId = 8
    const tgtNode = data.nodes[targetId]
    const candidate = dijk.distances[targetId]
    if (tgtNode && candidate !== null) {
      setNodeColor(svg, targetId, COLORS.nodeBridge, 0.8)
      setEdgeActive(svg, dijk.source, targetId, COLORS.amberBright, 3.5, 'arrow-active', 0)

      // Candidate calculation text bubble next to the node, derived from dijk.distances
      addTextLabel(svg, tgtNode.x, tgtNode.y - 18, `Candidate: 0 + ${candidate.toFixed(3)} = ${candidate.toFixed(3)}`, COLORS.amberBright, '11px', 'dijk-label')
      addTextLabel(svg, tgtNode.x, tgtNode.y - 30, 'Current: ∞', COLORS.text3, '10px', 'dijk-label')
    }
    drawFormulaLegend('candidate = dist[u] + cost(u, v)', 'Candidate Distance Calculation')
    return
  }

  // Step 6: Accept improving relaxation (tentative — not yet extracted from the heap)
  if (absStep === 6) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

    const targetId = 8
    const tgtNode = data.nodes[targetId]
    const dist8 = dijk.distances[targetId]
    if (tgtNode && dist8 !== null) {
      // Settle/update target node in safe green
      setNodeColor(svg, targetId, COLORS.riskLow, 1)
      addTextLabel(svg, tgtNode.x, tgtNode.y - 18, `d=${dist8.toFixed(3)} (Updated)`, COLORS.riskLow, '11px', 'dijk-label')

      // Pulse target node
      svg.select(`#n-${targetId}`)
        .transition().duration(250).attr('r', 22)
        .transition().duration(250).attr('r', 16)

      // Active parent edge highlighted in safe green
      setEdgeActive(svg, dijk.source, targetId, COLORS.riskLow, 3.5, 'arrow-safe', 0)
      drawFormulaLegend(`${dist8.toFixed(3)} < ∞ (Accepted)`, 'Relaxation Accepted')
    }
    return
  }

  // Step 7: Extract the closest unsettled node (now finalized — the earlier relaxation made this the min-heap entry)
  if (absStep === 7) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

    // Highlight Node 8 (K. oxytoca) as popped node
    const extNodeId = 8
    const extNode = data.nodes[extNodeId]
    const extDist = dijk.distances[extNodeId]
    if (extNode && extDist !== null) {
      setNodeColor(svg, extNodeId, COLORS.amberBright, 1)

      // Pulse animation
      svg.select(`#n-${extNodeId}`)
        .transition().duration(250).attr('r', 24)
        .transition().duration(250).attr('r', 16)

      addTextLabel(svg, extNode.x, extNode.y - 18, `d=${extDist.toFixed(3)} (Popped)`, COLORS.amberBright, '11px', 'dijk-label')

      // Min-Priority queue representation showing POP
      const pqGroup = svg.select('.g-annotations')
        .append('g')
        .attr('class', 'dijk-label')
        .attr('transform', 'translate(50, 520)')

      pqGroup.append('rect').attr('width', 220).attr('height', 80).attr('rx', 6).attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3).attr('stroke-width', 1.5)
      pqGroup.append('text').attr('x', 12).attr('y', 25).attr('fill', COLORS.text1).attr('font-size', '12px').attr('font-family', 'var(--font-sans)').attr('font-weight', 600).text('Min-Priority Queue Heap')
      pqGroup.append('text')
        .attr('x', 12).attr('y', 52)
        .attr('fill', COLORS.riskHigh)
        .attr('font-size', '12px')
        .attr('font-family', 'var(--font-mono)')
        .attr('text-decoration', 'line-through')
        .text(`POP: (${extDist.toFixed(3)}, ${extNode.short})`)
    }
    return
  }

  // Step 8: Reject non-improving candidates
  if (absStep === 8) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)

    // Highlight source and settled Node 8
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

    const activeId = 8
    const actNode = data.nodes[activeId]
    const activeDist = dijk.distances[activeId]
    if (actNode && activeDist !== null) {
      setNodeColor(svg, activeId, COLORS.amberMid, 1)
      addTextLabel(svg, actNode.x, actNode.y - 18, `d=${activeDist.toFixed(3)}`, COLORS.amberBright, '11px', 'dijk-label')
    }

    // Highlight target Node 1 (already settled via its own direct edge from the source)
    const targetId = 1
    const tgtNode = data.nodes[targetId]
    const targetDist = dijk.distances[targetId]
    const edge81 = data.edges.find(edge => edge.src === activeId && edge.tgt === targetId)
    if (actNode && tgtNode && activeDist !== null && targetDist !== null && edge81) {
      setNodeColor(svg, targetId, COLORS.amberMid, 1)
      addTextLabel(svg, tgtNode.x, tgtNode.y - 18, `d=${targetDist.toFixed(3)}`, COLORS.amberBright, '11px', 'dijk-label')

      // Show non-improving candidate inspection edge in danger/red and dashed
      setEdgeActive(svg, activeId, targetId, COLORS.riskHigh, 3, 'arrow-danger', 0)
      svg.select(`#e-${activeId}-${targetId}`).attr('stroke-dasharray', '4 4')

      const candidate = activeDist + edge81.dist
      const mx = (actNode.x + tgtNode.x) / 2
      const my = (actNode.y + tgtNode.y) / 2
      addTextLabel(svg, mx, my - 16, `cost = ${edge81.dist.toFixed(3)}`, COLORS.text2, '9px', 'dijk-label')
      addTextLabel(svg, mx, my - 4, `${activeDist.toFixed(3)} + ${edge81.dist.toFixed(3)} = ${candidate.toFixed(3)} ≥ ${targetDist.toFixed(3)}`, COLORS.riskHigh, '10px', 'dijk-label')
      drawFormulaLegend(`${candidate.toFixed(3)} ≥ ${targetDist.toFixed(3)} (Rejected)`, 'Relaxation Rejected', true)
    }
    return
  }

  // Step 9: Settle all reachable species
  if (absStep === 9) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)

    const maxDist = Math.max(...dijk.distances.filter((d): d is number => d !== null))
    const colorScale = d3.scaleSequential([0, maxDist], d3.interpolate(COLORS.amberBright, COLORS.amberDim))

    // Set source node color immediately
    setNodeColor(svg, dijk.source, COLORS.amberMid, 1)
    addTextLabel(svg, data.nodes[dijk.source].x, data.nodes[dijk.source].y - 18, 'd=0', COLORS.amberBright, '11px', 'dijk-label')

    // Stagger colors for settled nodes
    const settled = dijk.distances
      .map((dist, nodeId) => ({ dist, nodeId }))
      .filter((item): item is { dist: number; nodeId: number } => item.dist !== null && item.nodeId !== dijk.source)
      .sort((a, b) => a.dist - b.dist)

    settled.forEach((item, index) => {
      const delay = index * 100
      d3.timeout(() => {
        const store = useDemoStore.getState()
        if (store.selectedAlgo !== 'dijkstra' || store.currentStep !== absStep) return
        if (svg.select(`#n-${item.nodeId}`).empty()) return // safety
        
        // Pulse node
        svg.select(`#n-${item.nodeId}`)
          .transition().duration(150).attr('r', 20)
          .transition().duration(150).attr('r', 16)

        setNodeColor(svg, item.nodeId, colorScale(item.dist), 1, 300)
        addTextLabel(svg, data.nodes[item.nodeId].x, data.nodes[item.nodeId].y - 18, `d=${item.dist.toFixed(3)}`, colorScale(item.dist), '10px', 'dijk-label')

        // Highlight parent edge
        const parentId = dijk.parent[item.nodeId]
        if (parentId !== null && parentId !== -1) {
          setEdgeActive(svg, parentId, item.nodeId, COLORS.amberDim, 2.5, 'arrow-default', 300)
        }
      }, delay)
    })

    // Show infinite/unreachable nodes
    dijk.distances.forEach((dist, nodeId) => {
      if (dist === null) {
        setNodeColor(svg, nodeId, COLORS.text3, 0.2)
        addTextLabel(svg, data.nodes[nodeId].x, data.nodes[nodeId].y - 18, '∞', COLORS.text3, '11px', 'dijk-label')
      }
    })
  }

  // Phase 2: Highlight ESKAPE paths (absoluteStep 10)
  if (absStep === 10) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)

    // Base colors
    const maxDist = Math.max(...dijk.distances.filter((d): d is number => d !== null))
    const colorScale = d3.scaleSequential([0, maxDist], d3.interpolate(COLORS.amberBright, COLORS.amberDim))
    dijk.distances.forEach((dist, nodeId) => {
      if (dist === null) {
        setNodeColor(svg, nodeId, COLORS.text3, 0.2)
      } else if (nodeId === dijk.source) {
        setNodeColor(svg, nodeId, COLORS.amberMid, 1)
      } else {
        setNodeColor(svg, nodeId, colorScale(dist), 1)
      }
    })

    // Highlight ESKAPE paths
    const eskapeIds = Object.keys(dijk.eskape_paths)
      .map(Number)
      .filter(targetId => dijk.eskape_paths[String(targetId)]?.dist !== null)

    eskapeIds.forEach(targetId => {
      const pathKey = String(targetId)
      const pathData = dijk.eskape_paths[pathKey]
      if (!pathData || pathData.path.length < 2) return
      const path = pathData.path

      for (let i = 0; i < path.length - 1; i++) {
        const edgeEl = svg.select(`#e-${path[i]}-${path[i+1]}`)
        if (edgeEl.empty()) {
          // Draw virtual path line
          const srcNode = data.nodes[path[i]]
          const tgtNode = data.nodes[path[i+1]]
          if (!srcNode || !tgtNode) continue
          const sr = 16, tr = 16
          const dx = tgtNode.x - srcNode.x
          const dy = tgtNode.y - srcNode.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            const ux = dx / dist, uy = dy / dist
            const x1 = srcNode.x + ux * (sr + 3)
            const y1 = srcNode.y + uy * (sr + 3)
            const x2 = tgtNode.x - ux * (tr + 7)
            const y2 = tgtNode.y - uy * (tr + 7)

            svg.select('.g-annotations')
              .append('line')
              .attr('class', 'dijk-path-arc dijk-label')
              .attr('x1', x1).attr('y1', y1)
              .attr('x2', x2).attr('y2', y2)
              .attr('stroke', COLORS.pathGold)
              .attr('stroke-width', 2.5)
              .attr('opacity', 1)
              .attr('marker-end', 'url(#arrow-path)')
              .attr('stroke-dasharray', '4 4')
          }
        } else {
          setEdgeActive(svg, path[i], path[i+1], COLORS.pathGold, 2.5, 'arrow-path', 500)
        }
      }

      // Label target
      const node = data.nodes[targetId]
      if (node) {
        addTextLabel(svg, node.x, node.y - 20, `d=${pathData.dist?.toFixed(3)}`, COLORS.pathGold, '10px', 'dijk-label')
      }
    })

    // Show unreachable ESKAPE dynamically
    const unreachableEskapeIds = Object.keys(dijk.eskape_paths)
      .map(Number)
      .filter(targetId => dijk.eskape_paths[String(targetId)]?.dist === null)

    unreachableEskapeIds.forEach(id => {
      const node = data.nodes[id]
      if (node) {
        setNodeColor(svg, id, COLORS.text3, 0.15)
        addTextLabel(svg, node.x, node.y - 20, '∅', COLORS.text3, '12px', 'dijk-label')
      }
    })
  }

  // Phase 3: Highest-risk edge (absoluteStep 11)
  if (absStep >= 11) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.2)

    // Highlight highest-risk edge
    const hr = dijk.highest_risk
    const sn = data.nodes[hr.src]
    const tn = data.nodes[hr.tgt]
    if (sn && tn) {
      setNodeColor(svg, hr.src, COLORS.riskHigh, 1)
      setNodeColor(svg, hr.tgt, COLORS.riskHigh, 1)
      // Forward edge (exists in DOM)
      setEdgeActive(svg, hr.src, hr.tgt, COLORS.riskHigh, 3, 'arrow-danger', 500)
      // Reverse direction: use the real reverse edge if it's already in the DOM (same
      // check step 10 uses), only falling back to a synthetic dashed arc if it isn't.
      const reverseEdgeEl = svg.select(`#e-${hr.tgt}-${hr.src}`)
      if (!reverseEdgeEl.empty()) {
        setEdgeActive(svg, hr.tgt, hr.src, COLORS.riskHigh, 2, 'arrow-danger', 500)
        reverseEdgeEl.attr('stroke-dasharray', '5 3').attr('opacity', 0.7)
      } else {
        const dx = sn.x - tn.x, dy = sn.y - tn.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          const ux = dx / dist, uy = dy / dist
          svg.select('.g-annotations')
            .append('line')
            .attr('class', 'dijk-label')
            .attr('x1', tn.x + ux * 23).attr('y1', tn.y + uy * 23)
            .attr('x2', sn.x - ux * 23).attr('y2', sn.y - uy * 23)
            .attr('stroke', COLORS.riskHigh).attr('stroke-width', 2)
            .attr('stroke-dasharray', '5 3').attr('opacity', 0.7)
            .attr('marker-end', 'url(#arrow-danger)')
        }
      }
      addTextLabel(svg,
        (sn.x + tn.x) / 2,
        (sn.y + tn.y) / 2 - 12,
        `p=${hr.probability.toFixed(3)}`, COLORS.riskHigh, '11px', 'dijk-label'
      )
    }

    // Draw conversion details panel in bottom-left
    const panel = svg.select('.g-annotations')
      .append('g')
      .attr('class', 'dijk-label')
      .attr('transform', 'translate(50, 480)')
    
    panel.append('rect')
      .attr('width', 280)
      .attr('height', 120)
      .attr('rx', 6)
      .attr('fill', COLORS.surface2)
      .attr('stroke', COLORS.surface3)
      .attr('stroke-width', 1.5)
    
    panel.append('text')
      .attr('x', 12).attr('y', 25)
      .attr('fill', COLORS.text1)
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-weight', 600)
      .text('Highest-Risk Transmission Edge')
    
    panel.append('text')
      .attr('x', 12).attr('y', 52)
      .attr('fill', COLORS.text2)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)')
      .text(`Edge: ${dijk.highest_risk.src_name} → ${dijk.highest_risk.tgt_name}`)
    
    const transformedCost = -Math.log(hr.probability)
    panel.append('text')
      .attr('x', 12).attr('y', 78)
      .attr('fill', COLORS.amberBright)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .text(`Transformed Cost d = ${transformedCost.toFixed(3)}`)

    panel.append('text')
      .attr('x', 12).attr('y', 100)
      .attr('fill', COLORS.riskHigh)
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-weight', 'bold')
      .text(`Probability p = exp(-d) = ${Math.exp(-transformedCost).toFixed(3)}`)
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
    const reachableEskape = Object.values(dijk.eskape_paths).filter(path => path.dist !== null).length
    const unreachable = dijk.distances.filter(dist => dist === null).length
    const closest = dijk.distances
      .filter((dist, id): dist is number => dist !== null && id !== dijk.source)
      .sort((a, b) => a - b)[0]
    return [
      { label: 'ESKAPE nodes reachable from source', value: String(reachableEskape) },
      { label: 'nodes unreachable (other component)', value: String(unreachable) },
      { label: 'highest probability edge', value: `${dijk.highest_risk.probability.toFixed(3)}` },
      { label: 'closest node distance', value: closest !== undefined ? closest.toFixed(3) : '—' },
    ]
  },
}
