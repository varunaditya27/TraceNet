import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule } from './index'
import type { BFSVisualState } from '@/lib/execution/types'
import { resetGraph, setNodeColor, dimAllNodes, dimAllEdges, setEdgeActive, addTextLabel, highlightNode } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

function drawQueue(svg: SVG, data: GraphData, state: BFSVisualState) {
  const panel = svg.select('.g-annotations').append('g').attr('class', 'bfs-queue algo-overlay')
  panel.append('rect').attr('x', 18).attr('y', 58).attr('width', 400).attr('height', 68).attr('rx', 8)
    .attr('fill', COLORS.surface1).attr('stroke', COLORS.surface3).attr('opacity', 0.96)
  panel.append('text').attr('x', 32).attr('y', 80).attr('fill', COLORS.text2).attr('font-size', 11)
    .attr('font-family', 'var(--font-mono)').text('FIFO QUEUE (node ids)  front → back')
  const queueText = state.queue.length ? state.queue.join('  →  ') : 'empty'
  panel.append('text').attr('x', 32).attr('y', 106).attr('fill', state.queue.length ? COLORS.bfsTeal : COLORS.text3)
    .attr('font-size', 13).attr('font-weight', 600).attr('font-family', 'var(--font-sans)').text(queueText)
}

function enter(svg: SVG, data: GraphData, _phase: number, visualState?: { bfs?: BFSVisualState }): void {
  const state = visualState?.bfs
  resetGraph(svg, data, 0)
  svg.selectAll('.bfs-queue, .hop-label').remove()
  if (!state) return

  if (!state.discovered.length) {
    drawQueue(svg, data, state)
    return
  }

  dimAllEdges(svg, 0.045, 0)
  dimAllNodes(svg, 0.18, 0)

  state.discovered.forEach(id => setNodeColor(svg, id, id === data.algorithms.bfs.source ? COLORS.amberMid : COLORS.bfsTeal, 1, 0))
  state.parents.forEach((parent, child) => {
    if (parent !== null && parent >= 0) setEdgeActive(svg, parent, child, COLORS.bfsTeal, 3, 'arrow-safe', 0)
  })

  if (state.activeNode !== undefined) highlightNode(svg, state.activeNode, COLORS.amberBright, 1.18)
  if (state.activeEdge) {
    const [src, tgt] = state.activeEdge
    const color = state.edgeOutcome === 'discover' ? COLORS.bfsTeal : state.edgeOutcome === 'skip' ? COLORS.riskHigh : COLORS.pathGold
    const marker = state.edgeOutcome === 'discover' ? 'arrow-safe' : state.edgeOutcome === 'skip' ? 'arrow-danger' : 'arrow-path'
    setEdgeActive(svg, src, tgt, color, 4, marker, 0)
  }

  state.distances.forEach((distance, id) => {
    if (distance >= 0) addTextLabel(svg, data.nodes[id].x, data.nodes[id].y - 22, String(distance), id === data.algorithms.bfs.source ? COLORS.amberBright : COLORS.bfsTeal, '12px', 'hop-label')
    else if (state.complete) addTextLabel(svg, data.nodes[id].x, data.nodes[id].y - 22, '∞', COLORS.text3, '12px', 'hop-label')
  })
  drawQueue(svg, data, state)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.bfs-queue, .hop-label').remove()
  resetGraph(svg, data, 0)
}

export const bfsModule: AlgorithmModule = {
  steps: [],
  enter,
  exit,
  getResults: data => {
    const finite = data.algorithms.bfs.distances.filter(distance => distance >= 0)
    return [
      { label: `nodes reachable from ${data.nodes[data.algorithms.bfs.source].short}`, value: String(finite.length) },
      { label: 'unreachable nodes', value: String(data.algorithms.bfs.distances.length - finite.length) },
      { label: 'maximum finite hop distance', value: String(finite.length ? Math.max(...finite) : 0) },
    ]
  },
}
