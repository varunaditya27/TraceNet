import * as d3 from 'd3'
import type { GraphData, GraphNode } from './graph-data'
import { ROLE_COLORS, COLORS, TIMINGS } from './constants'

export function nodeRadius(node: GraphNode): number {
  return Math.min(22, Math.max(12, Math.sqrt(node.plasmid_args) * 2.8))
}

export function edgeOpacity(weight: number): number {
  return Math.min(0.70, 0.15 + weight * 0.55)
}

type SVGSel = d3.Selection<SVGSVGElement, unknown, null, undefined>

function addArrowMarkers(defs: d3.Selection<SVGDefsElement, unknown, null, undefined>): void {
  const markers = [
    { id: 'arrow-default', color: COLORS.text3 },
    { id: 'arrow-active', color: COLORS.amberMid },
    { id: 'arrow-danger', color: COLORS.riskHigh },
    { id: 'arrow-safe', color: COLORS.riskLow },
    { id: 'arrow-path', color: COLORS.pathGold },
  ]
  markers.forEach(({ id, color }) => {
    defs.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', color)
  })
}

function edgeEndpoints(
  sx: number, sy: number, tx: number, ty: number,
  sr: number, tr: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = tx - sx, dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x1: sx, y1: sy, x2: tx, y2: ty }
  const ux = dx / dist, uy = dy / dist
  return {
    x1: sx + ux * (sr + 3),
    y1: sy + uy * (sr + 3),
    x2: tx - ux * (tr + 7),
    y2: ty - uy * (tr + 7),
  }
}

export function initGraph(svgEl: SVGSVGElement, data: GraphData): void {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const defs = svg.append('defs')
  addArrowMarkers(defs)

  svg.append('g').attr('class', 'g-edges')
  svg.append('g').attr('class', 'g-nodes')
  svg.append('g').attr('class', 'g-labels')
  svg.append('g').attr('class', 'g-annotations')

  renderEdges(svg, data)
  renderNodes(svg, data)
  renderLabels(svg, data)
}

export function renderEdges(svg: SVGSel, data: GraphData): void {
  const gEdges = svg.select<SVGGElement>('.g-edges')
  gEdges.selectAll('*').remove()

  data.edges.forEach(edge => {
    const src = data.nodes[edge.src]
    const tgt = data.nodes[edge.tgt]
    const sr = nodeRadius(src), tr = nodeRadius(tgt)
    const ep = edgeEndpoints(src.x, src.y, tgt.x, tgt.y, sr, tr)

    gEdges.append('line')
      .attr('id', `e-${edge.src}-${edge.tgt}`)
      .attr('class', 'edge-line')
      .attr('x1', ep.x1).attr('y1', ep.y1)
      .attr('x2', ep.x2).attr('y2', ep.y2)
      .attr('stroke', COLORS.text3)
      .attr('stroke-width', Math.max(1.2, edge.weight * 4.5))
      .attr('opacity', edgeOpacity(edge.weight))
      .attr('marker-end', 'url(#arrow-default)')
      .attr('data-src', edge.src)
      .attr('data-tgt', edge.tgt)
      .attr('data-weight', edge.weight)
  })
}

export function renderNodes(svg: SVGSel, data: GraphData): void {
  const gNodes = svg.select<SVGGElement>('.g-nodes')
  gNodes.selectAll('*').remove()

  data.nodes.forEach(node => {
    const r = nodeRadius(node)
    gNodes.append('circle')
      .attr('id', `n-${node.id}`)
      .attr('class', 'node-circle')
      .attr('cx', node.x).attr('cy', node.y)
      .attr('r', r)
      .attr('fill', ROLE_COLORS[node.role])
      .attr('stroke', COLORS.surface0)
      .attr('stroke-width', 2)
      .attr('opacity', 1)
      .attr('data-id', node.id)
      .attr('data-role', node.role)
      .attr('data-gram', node.gram)
      .style('cursor', 'pointer')
  })
}

export function renderLabels(svg: SVGSel, data: GraphData): void {
  const gLabels = svg.select<SVGGElement>('.g-labels')
  gLabels.selectAll('*').remove()

  data.nodes.forEach(node => {
    const r = nodeRadius(node)
    gLabels.append('text')
      .attr('id', `lbl-${node.id}`)
      .attr('class', 'node-label')
      .attr('x', node.x)
      .attr('y', node.y + r + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text1)
      .attr('font-size', '14px')
      .attr('font-weight', 600)
      .attr('font-family', 'var(--font-sans)')
      .attr('paint-order', 'stroke')
      .attr('stroke', COLORS.surface0)
      .attr('stroke-width', 4)
      .attr('stroke-linejoin', 'round')
      .attr('pointer-events', 'none')
      .text(node.short)
  })
}

// === State mutators (called by algorithm modules) ===

export function resetGraph(svg: SVGSel, data: GraphData, duration: number = TIMINGS.nodeFade): void {
  if (duration === 0) {
    svg.selectAll('.node-circle')
      .interrupt()
      .attr('opacity', 1)
      .attr('transform', null)
      .attr('r', function() {
        const id = Number(d3.select(this).attr('data-id'))
        return id >= 0 && id < data.nodes.length ? nodeRadius(data.nodes[id]) : 12
      })
      .attr('fill', function() {
        const id = Number(d3.select(this).attr('data-id'))
        return id >= 0 && id < data.nodes.length ? ROLE_COLORS[data.nodes[id].role] : COLORS.nodeBridge
      })

    svg.selectAll('.edge-line')
      .interrupt()
      .attr('stroke', COLORS.text3)
      .attr('stroke-width', function() {
        return Math.max(1.2, Number(d3.select(this).attr('data-weight')) * 4.5)
      })
      .attr('opacity', function() {
        return edgeOpacity(Number(d3.select(this).attr('data-weight')))
      })
      .attr('stroke-dasharray', null)
      .attr('marker-end', 'url(#arrow-default)')

    svg.selectAll('.g-annotations').selectAll('*').remove()
    svg.selectAll('.algo-overlay, .halo, .inset-panel, .hop-label, .step-label, .cross-mark').remove()
    return
  }

  // Restore all nodes
  svg.selectAll('.node-circle')
    .transition().duration(duration)
    .attr('opacity', 1)
    .each(function() {
      const el = d3.select(this)
      const id = Number(el.attr('data-id'))
      if (id >= 0 && id < data.nodes.length) {
        el.attr('fill', ROLE_COLORS[data.nodes[id].role])
      }
    })

  // Restore all edges
  svg.selectAll('.edge-line')
    .transition().duration(duration)
    .attr('stroke', COLORS.text3)
    .attr('stroke-width', function() {
      return Math.max(1.2, Number(d3.select(this).attr('data-weight')) * 4.5)
    })
    .attr('opacity', function() {
      return edgeOpacity(Number(d3.select(this).attr('data-weight')))
    })
    .attr('stroke-dasharray', null)
    .attr('marker-end', 'url(#arrow-default)')

  // Remove annotations/overlays
  svg.selectAll('.g-annotations').selectAll('*').remove()
  svg.selectAll('.algo-overlay, .halo, .inset-panel, .hop-label, .step-label, .cross-mark').remove()
}

export function setNodeColor(svg: SVGSel, nodeId: number, color: string, opacity = 1, duration: number = TIMINGS.nodeState): void {
  const node = svg.select(`#n-${nodeId}`)
  if (duration === 0) {
    node.interrupt().attr('fill', color).attr('opacity', opacity)
    return
  }
  node.transition().duration(duration)
    .attr('fill', color)
    .attr('opacity', opacity)
}

export function setNodeOpacity(svg: SVGSel, nodeId: number, opacity: number, duration: number = TIMINGS.nodeFade): void {
  const node = svg.select(`#n-${nodeId}`)
  if (duration === 0) {
    node.interrupt().attr('opacity', opacity)
    return
  }
  node.transition().duration(duration).attr('opacity', opacity)
}

export function setEdgeActive(
  svg: SVGSel, src: number, tgt: number,
  color: string = COLORS.amberMid, width = 3.5, markerId = 'arrow-active',
  duration: number = TIMINGS.nodeState
): void {
  const edge = svg.select(`#e-${src}-${tgt}`)
  if (duration === 0) {
    edge.interrupt()
      .attr('stroke', color)
      .attr('stroke-width', width)
      .attr('opacity', 1)
      .attr('marker-end', `url(#${markerId})`)
    return
  }
  edge.transition().duration(duration)
    .attr('stroke', color)
    .attr('stroke-width', width)
    .attr('opacity', 1)
    .attr('marker-end', `url(#${markerId})`)
}

export function dimAllNodes(svg: SVGSel, opacity = 0.2, duration: number = TIMINGS.nodeFade): void {
  const nodes = svg.selectAll('.node-circle')
  if (duration === 0) {
    nodes.interrupt().attr('opacity', opacity)
    return
  }
  nodes.transition().duration(duration).attr('opacity', opacity)
}

export function dimAllEdges(svg: SVGSel, opacity = 0.05, duration: number = TIMINGS.nodeFade): void {
  const edges = svg.selectAll('.edge-line')
  if (duration === 0) {
    edges.interrupt().attr('opacity', opacity)
    return
  }
  edges.transition().duration(duration).attr('opacity', opacity)
}

export function highlightNode(svg: SVGSel, nodeId: number, color: string, scale = 1.2): void {
  svg.select(`#n-${nodeId}`)
    .transition().duration(TIMINGS.nodeState)
    .attr('fill', color)
    .attr('opacity', 1)
    .attr('transform', function() {
      const cx = d3.select(this).attr('cx')
      const cy = d3.select(this).attr('cy')
      return `translate(${cx},${cy}) scale(${scale}) translate(${-Number(cx)},${-Number(cy)})`
    })
}

export function addTextLabel(
  svg: SVGSel, x: number, y: number, text: string,
  color: string = COLORS.amberMid, fontSize = '11px', className = 'step-label'
): void {
  svg.select('.g-annotations')
    .append('text')
    .attr('class', className)
    .attr('x', x).attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('fill', color)
    .attr('font-size', fontSize)
    .attr('font-family', 'var(--font-mono)')
    .attr('pointer-events', 'none')
    .attr('opacity', 0)
    .text(text)
    .transition().duration(400)
    .attr('opacity', 1)
}
