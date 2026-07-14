import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule } from './index'
import type { AlgorithmVisualState, TopoVisualState } from '@/lib/execution/types'
import { initGraph, resetGraph } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>
type Point = { x: number; y: number }

function dagLayout(data: GraphData): Point[] {
  const topo = data.algorithms.topo_sort
  const depths = Array(topo.dag_nodes.length).fill(0)
  const outgoing = Array.from({ length: topo.dag_nodes.length }, () => [] as number[])
  topo.dag_edges.forEach(([source, target]) => outgoing[source]?.push(target))
  const traversal = [...topo.order_indices, ...topo.dag_nodes.map((_, id) => id).filter(id => !topo.order_indices.includes(id))]
  traversal.forEach(source => outgoing[source].forEach(target => { depths[target] = Math.max(depths[target], depths[source] + 1) }))
  const maxDepth = Math.max(1, ...depths)
  const columns = Array.from({ length: maxDepth + 1 }, () => [] as number[])
  depths.forEach((depth, id) => columns[Math.min(depth, maxDepth)].push(id))
  const points: Point[] = Array(topo.dag_nodes.length)
  columns.forEach((ids, depth) => ids.forEach((id, row) => {
    points[id] = { x: 100 + depth * (940 / maxDepth), y: 185 + (row + 1) * (330 / (ids.length + 1)) }
  }))
  return points
}

function drawPanel(svg: SVG, data: GraphData, state: TopoVisualState) {
  const names = data.algorithms.topo_sort.dag_nodes
  const layer = svg.select('.g-annotations')
  const panel = layer.append('g').attr('class', 'topo-panel')
  panel.append('rect').attr('x', 18).attr('y', 56).attr('width', 1104).attr('height', 66).attr('rx', 8)
    .attr('fill', COLORS.surface1).attr('fill-opacity', 0.96).attr('stroke', COLORS.surface3)
  panel.append('text').attr('x', 32).attr('y', 78).attr('fill', COLORS.text2).attr('font-size', 10)
    .attr('font-family', 'var(--font-mono)').text('FIFO QUEUE  front → back')
  panel.append('text').attr('x', 32).attr('y', 101).attr('fill', state.queue.length ? COLORS.bfsTeal : COLORS.text3)
    .attr('font-size', 12).attr('font-weight', 700).text(state.queue.length ? state.queue.map(id => names[id]).join('  →  ') : 'empty')
  panel.append('text').attr('x', 580).attr('y', 78).attr('fill', COLORS.text2).attr('font-size', 10)
    .attr('font-family', 'var(--font-mono)').text('OUTPUT ORDER')
  const outputNames = state.output.map(id => names[id])
  const outputLines = outputNames.length ? [outputNames.slice(0, 8), outputNames.slice(8)] : [[]]
  outputLines.filter((line, index) => line.length || index === 0).forEach((line, index) => {
    panel.append('text').attr('x', 580).attr('y', 98 + index * 15).attr('fill', outputNames.length ? COLORS.amberMid : COLORS.text3).attr('font-size', 10)
      .attr('font-weight', 700).text(line.length ? line.join(' → ') : 'empty')
  })
}

function drawDAG(svg: SVG, data: GraphData, state: TopoVisualState): void {
  const topo = data.algorithms.topo_sort
  const positions = dagLayout(data)
  svg.select('.g-edges').selectAll('*').remove()
  svg.select('.g-nodes').selectAll('*').remove()
  svg.select('.g-labels').selectAll('*').remove()
  svg.select('.g-annotations').selectAll('*').remove()
  const processed = new Set(state.processedEdges.map(([s, t]) => `${s}-${t}`))
  const emitted = new Set(state.output)
  const queued = new Set(state.queue)

  topo.dag_edges.forEach(([source, target]) => {
    const start = positions[source], end = positions[target]
    if (!start || !end) return
    const dx = end.x - start.x, dy = end.y - start.y, distance = Math.hypot(dx, dy) || 1
    const active = state.activeEdge?.[0] === source && state.activeEdge?.[1] === target
    const done = processed.has(`${source}-${target}`)
    const color = active ? state.edgeOutcome === 'unlock' ? COLORS.bfsTeal : COLORS.pathGold : COLORS.text3
    const marker = active ? state.edgeOutcome === 'unlock' ? 'arrow-safe' : 'arrow-path' : 'arrow-default'
    svg.select('.g-edges').append('line').attr('class', 'dag-edge').attr('data-source', source).attr('data-target', target)
      .attr('x1', start.x + dx / distance * 24).attr('y1', start.y + dy / distance * 24)
      .attr('x2', end.x - dx / distance * 29).attr('y2', end.y - dy / distance * 29)
      .attr('stroke', color).attr('stroke-width', active ? 4 : 1.7).attr('opacity', done && !active ? 0.18 : active ? 1 : 0.55)
      .attr('stroke-dasharray', done ? '5 5' : null).attr('marker-end', `url(#${marker})`)
  })

  topo.dag_nodes.forEach((name, id) => {
    const point = positions[id]
    if (!point) return
    const active = state.activeNode === id
    const cycleNode = state.complete && state.hasCycle && !emitted.has(id)
    const fill = cycleNode ? COLORS.riskHigh : emitted.has(id) ? COLORS.amberMid : queued.has(id) || state.indegrees[id] === 0 && state.initialized ? COLORS.bfsTeal : COLORS.surface2
    const circle = svg.select('.g-nodes').append('circle').attr('class', 'dag-node').attr('data-id', id)
      .attr('cx', point.x).attr('cy', point.y).attr('r', active ? 23 : 18).attr('fill', fill)
      .attr('stroke', active ? COLORS.text1 : queued.has(id) ? COLORS.bfsTeal : COLORS.surface3).attr('stroke-width', active ? 3 : 1.5)
    circle.append('title').text(`${name} · in-degree ${state.indegrees[id]}${queued.has(id) ? ' · queued' : ''}${emitted.has(id) ? ' · emitted' : ''}`)
    const ordinal = state.output.indexOf(id)
    if (ordinal >= 0) svg.select('.g-labels').append('text').attr('x', point.x).attr('y', point.y + 5)
      .attr('text-anchor', 'middle').attr('fill', COLORS.surface0).attr('font-size', 12).attr('font-weight', 800).text(ordinal + 1)
    svg.select('.g-labels').append('text').attr('x', point.x).attr('y', point.y + 35).attr('text-anchor', 'middle')
      .attr('fill', COLORS.text1).attr('font-size', 12).attr('font-family', 'var(--font-mono)').text(name)
    if (state.initialized) {
      svg.select('.g-annotations').append('g').attr('class', 'indegree-badge')
        .call(group => {
          group.append('circle').attr('cx', point.x + 20).attr('cy', point.y - 19).attr('r', 11)
            .attr('fill', state.indegrees[id] === 0 ? COLORS.bfsTeal : COLORS.surface1).attr('stroke', state.indegrees[id] === 0 ? COLORS.bfsTeal : COLORS.text3)
          group.append('text').attr('x', point.x + 20).attr('y', point.y - 15).attr('text-anchor', 'middle')
            .attr('fill', state.indegrees[id] === 0 ? COLORS.surface0 : COLORS.text1).attr('font-size', 10).attr('font-weight', 700).text(state.indegrees[id])
        })
    }
  })
  drawPanel(svg, data, state)
  svg.select('.g-annotations').append('text').attr('x', 570).attr('y', 650).attr('text-anchor', 'middle')
    .attr('fill', COLORS.text2).attr('font-size', 11).text('Arrow u → v means u must be emitted before v · cyan = available · amber = emitted · dashed = processed')
}

function enter(svg: SVG, data: GraphData, _step: number, visualState?: AlgorithmVisualState): void {
  const state = visualState?.topo
  if (!state) return
  svg.selectAll('*').interrupt()
  drawDAG(svg, data, state)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('*').interrupt()
  initGraph(svg.node()!, data)
  resetGraph(svg, data, 0)
}

export const topoModule: AlgorithmModule = {
  steps: [], enter, exit,
  getResults: data => [
    { label: 'topological order', value: data.algorithms.topo_sort.order.join(' → ') },
    { label: 'dependency edges processed', value: String(data.algorithms.topo_sort.dag_edges.length) },
    { label: 'cycle detected', value: data.algorithms.topo_sort.has_cycle ? 'Yes' : 'No' },
  ],
}
