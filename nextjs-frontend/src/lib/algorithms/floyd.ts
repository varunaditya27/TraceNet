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

// The distance matrix + recurrence panel need a dedicated right/bottom footprint that's
// wider than the graph's native layout leaves free, so the species graph is compressed into
// a top-left zone (x:[0,560], y:[0,400] of the 1140x670 viewBox) instead of overlapping them.
const GRAPH_ZONE_TRANSFORM = 'translate(-55, -10) scale(0.6)'

function drawMatrix(svg: SVG, data: GraphData, state: FloydWarshallVisualState): void {
  const n = state.matrix.length
  const cellSize = 30
  const matrixX = 628
  const matrixY = 118

  let group: any = svg.select('.fw-matrix')
  if (group.empty()) {
    group = svg.append('g').attr('class', 'fw-matrix')
    
    // Background and border rendered once
    group.append('rect')
      .attr('class', 'fw-bg')
      .attr('x', matrixX - 50).attr('y', matrixY - 58)
      .attr('width', n * cellSize + 62).attr('height', n * cellSize + 78)
      .attr('rx', 8).attr('fill', COLORS.surface1).attr('stroke', COLORS.surface3)

    group.append('text')
      .attr('class', 'fw-title')
      .attr('x', matrixX).attr('y', matrixY - 34)
      .attr('fill', COLORS.text1).attr('font-size', 16).attr('font-weight', 700)
      .attr('font-family', 'var(--font-sans)').text('All-pairs distance matrix')
      
    // Render static grid headers once
    for (let index = 0; index < n; index += 1) {
      group.append('text')
        .attr('class', `fw-col-hdr-${index}`)
        .attr('x', matrixX + index * cellSize + cellSize / 2).attr('y', matrixY - 9)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11).attr('font-family', 'var(--font-mono)').text(index)
      group.append('text')
        .attr('class', `fw-row-hdr-${index}`)
        .attr('x', matrixX - 14).attr('y', matrixY + index * cellSize + 19)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11).attr('font-family', 'var(--font-mono)').text(index)
    }
  }

  // Update status label
  let statusText: any = group.select('.fw-status')
  if (statusText.empty()) {
    statusText = group.append('text').attr('class', 'fw-status')
      .attr('x', matrixX + 245).attr('y', matrixY - 34)
      .attr('font-size', 14).attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
  }
  const isIntroPhase = state.isIntroStep ?? false
  statusText
    .attr('fill', isIntroPhase ? COLORS.amberMid : state.updated ? COLORS.riskLow : COLORS.text2)
    .text(isIntroPhase ? 'Initialization' : state.updated ? 'UPDATED' : 'NO UPDATE')

  // The same reveal gating used for the graph nodes applies here: a role not yet introduced
  // by the current guided step shouldn't already be highlighted in the matrix either.
  const revealRoles = state.revealRoles ?? (['i', 'j', 'k'] as const)
  const effectiveI = revealRoles.includes('i') ? state.i : undefined
  const effectiveJ = revealRoles.includes('j') ? state.j : undefined
  const effectiveK = revealRoles.includes('k') ? state.k : undefined

  // Update headers highlight colors
  for (let index = 0; index < n; index += 1) {
    group.select(`.fw-col-hdr-${index}`)
      .attr('fill', index === effectiveJ ? J_COLOR : COLORS.text2)
      .attr('font-weight', index === effectiveJ ? 700 : 500)
    group.select(`.fw-row-hdr-${index}`)
      .attr('fill', index === effectiveI ? I_COLOR : COLORS.text2)
      .attr('font-weight', index === effectiveI ? 700 : 500)
  }

  const finite = state.matrix.flat().filter((value): value is number => value !== null)
  const max = Math.max(...finite, 1)

  // Color scale correction: 0 is Red (High-risk), max is Green (Isolated)
  const color = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, max])

  state.matrix.forEach((row, i) => row.forEach((value, j) => {
    const isCurrent = i === effectiveI && j === effectiveJ
    const isIK = i === effectiveI && j === effectiveK
    const isKJ = i === effectiveK && j === effectiveJ
    const stroke = isCurrent ? (state.updated ? COLORS.riskLow : J_COLOR) : isIK ? I_COLOR : isKJ ? K_COLOR : COLORS.surface3
    const cellId = `fw-cell-${i}-${j}`
    const textId = `fw-text-${i}-${j}`

    let rect: any = group.select(`#${cellId}`)
    if (rect.empty()) {
      rect = group.append('rect')
        .attr('id', cellId)
        .attr('x', matrixX + j * cellSize).attr('y', matrixY + i * cellSize)
        .attr('width', cellSize - 1).attr('height', cellSize - 1)
    }

    // Flash green if cell updated
    if (isCurrent && state.updated) {
      rect.interrupt()
        .attr('fill', COLORS.riskLow)
        .transition().duration(250)
        .attr('fill', value === null ? COLORS.surface2 : color(value))
    } else {
      rect.attr('fill', value === null ? COLORS.surface2 : color(value))
    }

    rect
      .attr('fill-opacity', value === null ? 0.65 : 0.86)
      .attr('stroke', stroke)
      .attr('stroke-width', isCurrent || isIK || isKJ ? 3 : 0.5)

    let txt: any = group.select(`#${textId}`)
    if (txt.empty()) {
      txt = group.append('text')
        .attr('id', textId)
        .attr('x', matrixX + j * cellSize + cellSize / 2)
        .attr('y', matrixY + i * cellSize + 19)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('font-family', 'var(--font-mono)')
    }
    txt
      .attr('fill', value === null ? COLORS.text2 : COLORS.surface0)
      .attr('font-weight', isCurrent ? 700 : 500)
      .text(value === null ? '∞' : value.toFixed(1))
  }))

  // Draw legend bar
  const legendY = matrixY + n * cellSize + 13
  const legendWidth = 180
  const legendX = matrixX + (n * cellSize - legendWidth) / 2
  const gradId = 'fw-legend-gradient'

  let legendGrad: any = svg.select(`#${gradId}`)
  if (legendGrad.empty()) {
    legendGrad = svg.select('defs')
      .append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%')
    
    const stops = [0, 0.25, 0.5, 0.75, 1]
    stops.forEach(t => {
      legendGrad.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', d3.interpolateRdYlGn(t))
    })
  }

  // Draw legend once
  if (group.select('.fw-legend-bar').empty()) {
    group.append('rect')
      .attr('class', 'fw-legend-bar')
      .attr('x', legendX).attr('y', legendY)
      .attr('width', legendWidth).attr('height', 8)
      .attr('rx', 2)
      .attr('fill', `url(#${gradId})`)
    
    group.append('text')
      .attr('x', legendX - 8).attr('y', legendY + 7)
      .attr('text-anchor', 'end')
      .attr('fill', COLORS.text2)
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-sans)')
      .text('High-Risk')

    group.append('text')
      .attr('x', legendX + legendWidth + 8).attr('y', legendY + 7)
      .attr('text-anchor', 'start')
      .attr('fill', COLORS.text2)
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-sans)')
      .text('Isolated')
  }

  // Highlight row/column of the most vulnerable node at the last step
  const isFinalStep = state.isFinalStep ?? false
  group.selectAll('.fw-mv-line').remove()
  
  if (isFinalStep) {
    const mv = data.algorithms.floyd_warshall.most_vulnerable
    
    // Draw gold row indicator
    group.append('rect')
      .attr('class', 'fw-mv-line')
      .attr('x', matrixX).attr('y', matrixY + mv * cellSize)
      .attr('width', n * cellSize).attr('height', cellSize)
      .attr('fill', 'none')
      .attr('stroke', COLORS.pathGold)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '3 3')

    // Draw gold column indicator
    group.append('rect')
      .attr('class', 'fw-mv-line')
      .attr('x', matrixX + mv * cellSize).attr('y', matrixY)
      .attr('width', cellSize).attr('height', n * cellSize)
      .attr('fill', 'none')
      .attr('stroke', COLORS.pathGold)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '3 3')
  }
}

function drawRecurrence(svg: SVG, data: GraphData, state: FloydWarshallVisualState) {
  svg.selectAll('.fw-recurrence').remove()
  // Docked bottom-left, below the compressed graph zone — the matrix owns the right column,
  // so these two explainer panels must not compete with each other or with the graph for space.
  const group = svg.append('g').attr('class', 'fw-recurrence').attr('transform', 'translate(30, 415)')
  group.append('rect').attr('width', 515).attr('height', 245).attr('rx', 8)
    .attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3)
  group.append('text').attr('x', 20).attr('y', 32).attr('fill', COLORS.text1)
    .attr('font-size', 17).attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
    .text('dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])')

  // Mirror the same reveal gating as the graph/matrix: a role the current guided step hasn't
  // introduced yet shouldn't already show a concrete value here either, and the derived rows
  // (old/candidate/selected) only mean anything once both i and j are known.
  const revealRoles = state.revealRoles ?? (['i', 'j', 'k'] as const)
  const effectiveI = revealRoles.includes('i') ? state.i : undefined
  const effectiveJ = revealRoles.includes('j') ? state.j : undefined
  const effectiveK = revealRoles.includes('k') ? state.k : undefined
  const rowAndColKnown = effectiveI !== undefined && effectiveJ !== undefined

  let diagonalNote = ''
  if (effectiveI !== undefined && effectiveJ !== undefined && effectiveI === effectiveJ) {
    diagonalNote = ' (self, always 0.0)'
  }

  const rows = [
    ['k · intermediate', effectiveK === undefined || !data.nodes[effectiveK] ? '—' : `${effectiveK} · ${data.nodes[effectiveK].short}`, K_COLOR],
    ['i · source', effectiveI === undefined || !data.nodes[effectiveI] ? '—' : `${effectiveI} · ${data.nodes[effectiveI].short}`, I_COLOR],
    ['j · destination', effectiveJ === undefined || !data.nodes[effectiveJ] ? '—' : `${effectiveJ} · ${data.nodes[effectiveJ].short}`, J_COLOR],
    ['old dist[i][j]', rowAndColKnown ? formatDistance(state.oldValue) : '—', COLORS.text1],
    ['dist[i][k] + dist[k][j]', rowAndColKnown ? `${formatDistance(state.firstSegment)} + ${formatDistance(state.secondSegment)}` : '—', COLORS.text1],
    ['candidate', rowAndColKnown ? formatDistance(state.candidate) : '—', COLORS.text1],
    ['selected value', rowAndColKnown ? formatDistance(state.selectedValue) + diagonalNote : '—', rowAndColKnown && state.updated ? COLORS.riskLow : COLORS.text1],
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

  // Performance: don't delete everything, just clean overlays when needed
  svg.selectAll('.fw-recurrence-line, .fw-mv-halo, .fw-divider').remove()

  resetGraph(svg, data, 0)
  dimAllEdges(svg, 0.035, 0)
  dimAllNodes(svg, 0.14, 0)

  // Compress the graph into its reserved zone so the matrix/recurrence panels never sit on top of it
  svg.select('.g-nodes').attr('transform', GRAPH_ZONE_TRANSFORM)
  svg.select('.g-edges').attr('transform', GRAPH_ZONE_TRANSFORM)
  svg.select('.g-labels').attr('transform', GRAPH_ZONE_TRANSFORM)
  svg.select('.g-annotations').attr('transform', GRAPH_ZONE_TRANSFORM)

  svg.append('line')
    .attr('class', 'fw-divider')
    .attr('x1', 565).attr('y1', 10).attr('x2', 565).attr('y2', 660)
    .attr('stroke', COLORS.surface3).attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4').attr('opacity', 0.5)

  // Most steps reveal i, j, and k together (default order, k drawn last). A few curated guided
  // steps reuse the identical (i, j, k) triple to narrate distinct concepts one at a time, so
  // they instead reveal only the roles introduced so far and let the newest role win visually
  // when two roles land on the same node (see revealRoles/emphasizeRole in FloydWarshallVisualState).
  const revealRoles = state.revealRoles ?? (['i', 'j', 'k'] as const)
  const showI = revealRoles.includes('i')
  const showJ = revealRoles.includes('j')
  const showK = revealRoles.includes('k')
  const emphasize = state.emphasizeRole
  const drawOrder = (['i', 'j', 'k'] as const)
    .filter(role => role !== emphasize && revealRoles.includes(role))
    .concat(emphasize && revealRoles.includes(emphasize) ? [emphasize] : [])

  drawOrder.forEach(role => {
    if (role === 'i' && state.i !== undefined) {
      setNodeColor(svg, state.i, I_COLOR, 1, 0)
      svg.select(`#n-${state.i}`).attr('r', 21)
    }
    if (role === 'j' && state.j !== undefined) {
      setNodeColor(svg, state.j, J_COLOR, 1, 0)
      svg.select(`#n-${state.j}`).attr('r', 21)
    }
    if (role === 'k' && state.k !== undefined) {
      setNodeColor(svg, state.k, K_COLOR, 1, 0)
      svg.select(`#n-${state.k}`).attr('r', 24)
    }
  })

  if (showI && showK && state.i !== undefined && state.k !== undefined) setEdgeActive(svg, state.i, state.k, I_COLOR, 3.5, 'arrow-active', 0)
  if (showK && showJ && state.k !== undefined && state.j !== undefined) setEdgeActive(svg, state.k, state.j, K_COLOR, 3.5, 'arrow-path', 0)

  drawRecurrence(svg, data, state)
  drawMatrix(svg, data, state)

  // Highlight most vulnerable node if final step
  const isFinalStep = state.isFinalStep ?? false
  if (isFinalStep) {
    const mv = data.algorithms.floyd_warshall.most_vulnerable
    const mvNode = data.nodes[mv]
    if (mvNode) {
      setNodeColor(svg, mv, COLORS.pathGold, 1, 0)
      svg.select(`#n-${mv}`)
        .transition().duration(600).attr('r', 26)
        .transition().duration(600).attr('r', 21)

      svg.select('.g-annotations')
        .append('circle')
        .attr('class', 'fw-mv-halo')
        .attr('cx', mvNode.x)
        .attr('cy', mvNode.y)
        .attr('r', 32)
        .attr('fill', 'none')
        .attr('stroke', COLORS.pathGold)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0)
        .transition().duration(800)
        .attr('opacity', 0.8)
    }
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('*').interrupt()
  svg.selectAll('.fw-matrix, .fw-recurrence, .fw-mv-halo, .fw-divider').remove()
  svg.select('.g-nodes').attr('transform', null)
  svg.select('.g-edges').attr('transform', null)
  svg.select('.g-labels').attr('transform', null)
  svg.select('.g-annotations').attr('transform', null)
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
