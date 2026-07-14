import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import type { AlgorithmVisualState } from '@/lib/execution/types'
import { edgeOpacity, nodeRadius, resetGraph } from '@/lib/d3-graph'
import { COLORS, ROLE_COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [{ label: 'Detailed Kosaraju execution', detail: 'Driven by deterministic DFS snapshots.' }]
const COMPONENT_COLORS = [COLORS.sccViolet, COLORS.riskLow, COLORS.bfsTeal, COLORS.amberMid]

function drawStack(svg: SVG, data: GraphData, title: string, ids: number[], x: number, y: number, color: string) {
  const group = svg.select('.g-annotations').append('g').attr('class', 'scc-stack')
  group.append('text')
    .attr('x', x).attr('y', y)
    .attr('fill', COLORS.text1).attr('font-size', 14).attr('font-weight', 600)
    .attr('font-family', 'var(--font-sans)').text(title)
  group.append('text').attr('x', x + 150).attr('y', y).attr('text-anchor', 'end')
    .attr('fill', COLORS.text3).attr('font-size', 10).attr('font-family', 'var(--font-mono)').text('TOP ↓')
  ;[...ids].reverse().forEach((id, index) => {
    const boxY = y + 10 + index * 23
    group.append('rect')
      .attr('x', x).attr('y', boxY).attr('width', 154).attr('height', 20)
      .attr('rx', 4).attr('fill', COLORS.surface2).attr('stroke', color)
    group.append('text')
      .attr('x', x + 8).attr('y', boxY + 14)
      .attr('fill', COLORS.text1).attr('font-size', 11)
      .attr('font-family', 'var(--font-mono)').text(data.nodes[id].short)
  })
}

function reverseEdges(svg: SVG, data: GraphData, transposed: boolean) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  svg.selectAll<SVGLineElement, unknown>('.edge-line').each(function () {
    const line = d3.select(this)
    const src = Number(line.attr('data-src'))
    const tgt = Number(line.attr('data-tgt'))
    const source = data.nodes[transposed ? tgt : src]
    const target = data.nodes[transposed ? src : tgt]
    const sourceRadius = nodeRadius(source)
    const targetRadius = nodeRadius(target)
    const dx = target.x - source.x
    const dy = target.y - source.y
    const distance = Math.hypot(dx, dy) || 1
    const ux = dx / distance
    const uy = dy / distance
    if (reducedMotion) {
      line
        .attr('x1', source.x + ux * (sourceRadius + 4))
        .attr('y1', source.y + uy * (sourceRadius + 4))
        .attr('x2', target.x - ux * (targetRadius + 10))
        .attr('y2', target.y - uy * (targetRadius + 10))
        .attr('marker-end', 'url(#arrow-default)')
    } else {
      line
        .attr('x1', source.x + ux * (sourceRadius + 4))
        .attr('y1', source.y + uy * (sourceRadius + 4))
        .attr('x2', target.x - ux * (targetRadius + 10))
        .attr('y2', target.y - uy * (targetRadius + 10))
        .attr('marker-end', 'url(#arrow-default)')
    }
  })
}

function drawComponentRegions(svg: SVG, data: GraphData, components: number[][]) {
  const layer = svg.select('.g-annotations')
  const panel = layer.append('g').attr('class', 'scc-region')
  const panelHeight = 38 + components.length * 38
  panel.append('rect').attr('x', 18).attr('y', 62).attr('width', 370).attr('height', panelHeight).attr('rx', 8)
    .attr('fill', COLORS.surface1).attr('fill-opacity', 0.96).attr('stroke', COLORS.surface3)
  panel.append('text').attr('x', 32).attr('y', 84).attr('fill', COLORS.text1).attr('font-size', 13)
    .attr('font-weight', 700).text('STRONGLY CONNECTED COMPONENTS')
  components.forEach((component, index) => {
    if (!component.length) return
    const color = COMPONENT_COLORS[index % COMPONENT_COLORS.length]
    component.forEach(id => {
      const node = data.nodes[id]
      layer.append('circle').attr('class', 'scc-region').attr('cx', node.x).attr('cy', node.y)
        .attr('r', nodeRadius(node) + 7).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 3)
    })
    panel.append('circle').attr('cx', 34).attr('cy', 108 + index * 38).attr('r', 5).attr('fill', color)
    panel.append('text').attr('x', 46).attr('y', 112 + index * 38).attr('fill', color).attr('font-size', 12)
      .attr('font-weight', 700).text(`SCC ${index + 1} · ${component.length} species`)
    panel.append('text').attr('x', 46).attr('y', 127 + index * 38).attr('fill', COLORS.text2).attr('font-size', 10)
      .text(`node ids: ${component.join(', ')}`)
  })
}

function enter(svg: SVG, data: GraphData, _step: number, visualState?: AlgorithmVisualState): void {
  const state = visualState ?? {}
  svg.selectAll('*').interrupt()
  resetGraph(svg, data, 0)
  svg.selectAll('.g-annotations').selectAll('*').remove()
  svg.selectAll('.node-circle').attr('transform', null)
  reverseEdges(svg, data, state.graphDirection === 'transposed')

  svg.selectAll<SVGLineElement, unknown>('.edge-line')
    .attr('stroke', COLORS.text3)
    .attr('stroke-width', function () { return Math.max(1.2, Number(d3.select(this).attr('data-weight')) * 4.5) })
    .attr('opacity', function () { return Math.max(0.16, edgeOpacity(Number(d3.select(this).attr('data-weight')))) })

  svg.selectAll<SVGCircleElement, unknown>('.node-circle')
    .attr('fill', function () {
      const id = Number(d3.select(this).attr('data-id'))
      return ROLE_COLORS[data.nodes[id].role]
    })
    .attr('opacity', 0.28)
    .attr('stroke', COLORS.surface0).attr('stroke-width', 2)
    .attr('r', function () {
      const id = Number(d3.select(this).attr('data-id'))
      return nodeRadius(data.nodes[id])
    })

  state.visitedNodes?.forEach(id => {
    svg.select(`#n-${id}`).attr('fill', COLORS.amberDim).attr('opacity', 0.85)
  })
  state.currentComponent?.forEach(id => {
    svg.select(`#n-${id}`).attr('fill', COLORS.sccViolet).attr('opacity', 1)
  })
  state.discoveredComponents?.forEach((component, index) => {
    component.forEach(id => svg.select(`#n-${id}`).attr('fill', COMPONENT_COLORS[index % COMPONENT_COLORS.length]).attr('opacity', 1))
  })
  if (state.activeNode !== undefined) {
    const radius = nodeRadius(data.nodes[state.activeNode])
    svg.select(`#n-${state.activeNode}`)
      .attr('fill', COLORS.amberBright).attr('opacity', 1).attr('r', radius * 1.35)
      .attr('stroke', COLORS.text1).attr('stroke-width', 3)
  }
  if (state.activeEdge) {
    const [src, tgt] = state.activeEdge
    const edgeId = state.graphDirection === 'transposed' ? `#e-${tgt}-${src}` : `#e-${src}-${tgt}`
    const outcome = state.sccEdgeOutcome
    const color = outcome === 'discover' ? COLORS.bfsTeal : outcome === 'visited' ? COLORS.riskHigh : COLORS.pathGold
    const marker = outcome === 'discover' ? 'arrow-safe' : outcome === 'visited' ? 'arrow-danger' : 'arrow-path'
    svg.select(edgeId).attr('stroke', color).attr('stroke-width', 4).attr('opacity', 1)
      .attr('marker-end', `url(#${marker})`)
  }

  const modeLabel = state.graphDirection === 'transposed' ? 'TRANSPOSED GRAPH Gᵀ · ALL ARROWS REVERSED' : 'ORIGINAL DIRECTED GRAPH G'
  svg.select('.g-annotations').append('text')
    .attr('class', 'scc-mode-label')
    .attr('x', 570).attr('y', 38).attr('text-anchor', 'middle')
    .attr('fill', state.graphDirection === 'transposed' ? COLORS.sccViolet : COLORS.bfsTeal)
    .attr('font-size', 15).attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
    .text(modeLabel)
  if (state.graphDirection === 'transposed') {
    svg.select('.g-annotations').append('text').attr('class', 'scc-mode-label')
      .attr('x', 570).attr('y', 55).attr('text-anchor', 'middle').attr('fill', COLORS.text2)
      .attr('font-size', 10).text('This dataset has reciprocal links, so G and Gᵀ have the same visible edge pairs.')
  }

  drawStack(svg, data, 'DFS recursion stack', state.recursionStack ?? [], 720, 70, COLORS.bfsTeal)
  drawStack(svg, data, 'Finishing-order stack', state.finishStack ?? [], 900, 70, COLORS.amberMid)
  if (state.revealAllComponents) drawComponentRegions(svg, data, data.algorithms.scc.groups)
  else if (state.discoveredComponents?.length) drawComponentRegions(svg, data, state.discoveredComponents)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('*').interrupt()
  svg.selectAll('.scc-stack, .scc-region, .scc-mode-label').remove()
  reverseEdges(svg, data, false)
  resetGraph(svg, data, 0)
}

export const sccModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'strongly connected components', value: String(data.algorithms.scc.n_components) },
    ...data.algorithms.scc.groups.map((group, index) => ({
      label: `SCC ${index + 1}: ${group.map(id => data.nodes[id].short).join(', ')}`,
      value: `${group.length} species`,
    })),
  ],
}
