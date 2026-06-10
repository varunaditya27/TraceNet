import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import type { AlgorithmVisualState, FloydWarshallVisualState } from '@/lib/execution/types'
import { formatDistance } from '@/lib/execution/utils'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, setEdgeActive } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [{ label: 'Deterministic all-pairs execution', detail: 'Driven by inspectable (k,i,j) snapshots.' }]
const I_COLOR = COLORS.bfsTeal
const J_COLOR = '#f472b6'
const K_COLOR = COLORS.amberBright

function drawMatrix(svg: SVG, data: GraphData, state: FloydWarshallVisualState): void {
  svg.selectAll('.fw-matrix').remove()
  const n = state.matrix.length
  const cellSize = 30
  const matrixX = 628
  const matrixY = 118
  const group = svg.append('g').attr('class', 'fw-matrix')
  const finite = state.matrix.flat().filter((value): value is number => value !== null)
  const max = Math.max(...finite, 1)
  const color = d3.scaleSequential(d3.interpolateRdYlGn).domain([max, 0])

  group.append('rect')
    .attr('x', matrixX - 50).attr('y', matrixY - 58)
    .attr('width', n * cellSize + 62).attr('height', n * cellSize + 78)
    .attr('rx', 8).attr('fill', COLORS.surface1).attr('stroke', COLORS.surface3)
  group.append('text')
    .attr('x', matrixX).attr('y', matrixY - 34)
    .attr('fill', COLORS.text1).attr('font-size', 16).attr('font-weight', 700)
    .attr('font-family', 'var(--font-sans)').text('All-pairs distance matrix')
  group.append('text')
    .attr('x', matrixX + 245).attr('y', matrixY - 34)
    .attr('fill', state.updated ? COLORS.riskLow : COLORS.text2).attr('font-size', 14)
    .attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
    .text(state.updated === undefined ? 'Initialization' : state.updated ? 'UPDATED' : 'NO UPDATE')

  for (let index = 0; index < n; index += 1) {
    group.append('text')
      .attr('x', matrixX + index * cellSize + cellSize / 2).attr('y', matrixY - 9)
      .attr('text-anchor', 'middle').attr('fill', index === state.j ? J_COLOR : COLORS.text2)
      .attr('font-size', 11).attr('font-family', 'var(--font-mono)').text(index)
    group.append('text')
      .attr('x', matrixX - 14).attr('y', matrixY + index * cellSize + 19)
      .attr('text-anchor', 'middle').attr('fill', index === state.i ? I_COLOR : COLORS.text2)
      .attr('font-size', 11).attr('font-family', 'var(--font-mono)').text(index)
  }

  state.matrix.forEach((row, i) => row.forEach((value, j) => {
    const isCurrent = i === state.i && j === state.j
    const isIK = i === state.i && j === state.k
    const isKJ = i === state.k && j === state.j
    const stroke = isCurrent ? (state.updated ? COLORS.riskLow : J_COLOR) : isIK ? I_COLOR : isKJ ? K_COLOR : COLORS.surface3
    group.append('rect')
      .attr('x', matrixX + j * cellSize).attr('y', matrixY + i * cellSize)
      .attr('width', cellSize - 1).attr('height', cellSize - 1)
      .attr('fill', value === null ? COLORS.surface2 : color(value))
      .attr('fill-opacity', value === null ? 0.65 : 0.86)
      .attr('stroke', stroke).attr('stroke-width', isCurrent || isIK || isKJ ? 3 : 0.5)
    group.append('text')
      .attr('x', matrixX + j * cellSize + cellSize / 2)
      .attr('y', matrixY + i * cellSize + 19)
      .attr('text-anchor', 'middle')
      .attr('fill', value === null ? COLORS.text2 : COLORS.surface0)
      .attr('font-size', 12).attr('font-weight', isCurrent ? 700 : 500)
      .attr('font-family', 'var(--font-mono)')
      .text(value === null ? '∞' : value.toFixed(1))
  }))
}

function drawRecurrence(svg: SVG, data: GraphData, state: FloydWarshallVisualState) {
  svg.selectAll('.fw-recurrence').remove()
  const group = svg.append('g').attr('class', 'fw-recurrence').attr('transform', 'translate(38,92)')
  group.append('rect').attr('width', 515).attr('height', 245).attr('rx', 8)
    .attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3)
  group.append('text').attr('x', 20).attr('y', 32).attr('fill', COLORS.text1)
    .attr('font-size', 17).attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
    .text('dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])')
  const rows = [
    ['k · intermediate', state.k === undefined ? '—' : `${state.k} · ${data.nodes[state.k].short}`, K_COLOR],
    ['i · source', state.i === undefined ? '—' : `${state.i} · ${data.nodes[state.i].short}`, I_COLOR],
    ['j · destination', state.j === undefined ? '—' : `${state.j} · ${data.nodes[state.j].short}`, J_COLOR],
    ['old dist[i][j]', formatDistance(state.oldValue), COLORS.text1],
    ['dist[i][k] + dist[k][j]', `${formatDistance(state.firstSegment)} + ${formatDistance(state.secondSegment)}`, COLORS.text1],
    ['candidate', formatDistance(state.candidate), COLORS.text1],
    ['selected value', formatDistance(state.selectedValue), state.updated ? COLORS.riskLow : COLORS.text1],
  ] as const
  rows.forEach(([label, value, color], index) => {
    const y = 63 + index * 25
    group.append('text').attr('x', 20).attr('y', y).attr('fill', COLORS.text2)
      .attr('font-size', 13).attr('font-family', 'var(--font-sans)').text(label)
    group.append('text').attr('x', 220).attr('y', y).attr('fill', color)
      .attr('font-size', 13).attr('font-weight', 600).attr('font-family', 'var(--font-mono)').text(value)
  })
}

function enter(svg: SVG, data: GraphData, _step: number, visualState?: AlgorithmVisualState): void {
  const state = visualState?.floydWarshall
  if (!state) return
  svg.selectAll('*').interrupt()
  resetGraph(svg, data, 0)
  dimAllEdges(svg, 0.035, 0)
  dimAllNodes(svg, 0.14, 0)
  if (state.i !== undefined) setNodeColor(svg, state.i, I_COLOR, 1, 0)
  if (state.j !== undefined) setNodeColor(svg, state.j, J_COLOR, 1, 0)
  if (state.k !== undefined) setNodeColor(svg, state.k, K_COLOR, 1, 0)
  if (state.i !== undefined) svg.select(`#n-${state.i}`).attr('r', 21)
  if (state.j !== undefined) svg.select(`#n-${state.j}`).attr('r', 21)
  if (state.k !== undefined) svg.select(`#n-${state.k}`).attr('r', 24)
  if (state.i !== undefined && state.k !== undefined) setEdgeActive(svg, state.i, state.k, I_COLOR, 3.5, 'arrow-active', 0)
  if (state.k !== undefined && state.j !== undefined) setEdgeActive(svg, state.k, state.j, K_COLOR, 3.5, 'arrow-path', 0)
  drawRecurrence(svg, data, state)
  drawMatrix(svg, data, state)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('*').interrupt()
  svg.selectAll('.fw-matrix, .fw-recurrence').remove()
  resetGraph(svg, data, 0)
}

export const floydModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => {
    const matrix = data.algorithms.floyd_warshall.dist_matrix
    const reachablePairs = matrix.flat().filter(value => value !== null).length
    return [
      { label: 'most vulnerable node', value: data.algorithms.floyd_warshall.most_vulnerable_name },
      { label: 'finite ordered pairs', value: String(reachablePairs) },
      { label: 'unreachable ordered pairs', value: String(matrix.length ** 2 - reachablePairs) },
      { label: 'inspectable operations', value: String(matrix.length ** 3) },
    ]
  },
}
