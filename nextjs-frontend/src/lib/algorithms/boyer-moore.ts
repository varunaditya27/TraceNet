import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import type { AlgorithmVisualState, BoyerMooreVisualState } from '@/lib/execution/types'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, addTextLabel } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [{ label: 'Detailed sequence execution', detail: 'Driven by deterministic Boyer-Moore comparison snapshots.' }]
const WINDOW_SIZE = 72

function cell(
  group: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  character: string,
  index: number,
  options: { fill?: string; stroke?: string; symbol?: string } = {},
) {
  group.append('rect')
    .attr('x', x).attr('y', y).attr('width', 13).attr('height', 22).attr('rx', 2)
    .attr('fill', options.fill ?? COLORS.surface1)
    .attr('stroke', options.stroke ?? COLORS.surface3)
  group.append('text')
    .attr('x', x + 6.5).attr('y', y + 15).attr('text-anchor', 'middle')
    .attr('fill', COLORS.text1).attr('font-size', 12)
    .attr('font-family', 'var(--font-mono)').text(character)
  if (index % 10 === 0) {
    group.append('text')
      .attr('x', x + 6.5).attr('y', y - 4).attr('text-anchor', 'middle')
      .attr('fill', COLORS.text2).attr('font-size', 10)
      .attr('font-family', 'var(--font-mono)').text(index)
  }
  if (options.symbol) {
    group.append('text')
      .attr('x', x + 6.5).attr('y', y + 40).attr('text-anchor', 'middle')
      .attr('fill', options.symbol === '✓' ? COLORS.riskLow : COLORS.riskHigh)
      .attr('font-size', 15).attr('font-weight', 700).text(options.symbol)
  }
}

function drawSequencePanel(svg: SVG, state: BoyerMooreVisualState) {
  svg.selectAll('.bm-panel').remove()
  const panel = svg.append('g').attr('class', 'bm-panel').attr('transform', 'translate(92,145)')
  panel.append('rect')
    .attr('x', 0).attr('y', 0).attr('width', 960).attr('height', 395).attr('rx', 10)
    .attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3).attr('stroke-width', 1.5)

  panel.append('text')
    .attr('x', 24).attr('y', 32).attr('fill', COLORS.text1)
    .attr('font-size', 17).attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
    .text('NDM-1 Boyer-Moore sequence search')
  panel.append('text')
    .attr('x', 24).attr('y', 57).attr('fill', COLORS.text2)
    .attr('font-size', 13).attr('font-family', 'var(--font-sans)')
    .text(`Parent text: ${state.parentText.length} bp · Pattern: ${state.pattern.length} bp · right-to-left comparisons`)

  const focus = state.textIndex ?? state.alignment
  const windowStart = Math.max(0, Math.min(state.parentText.length - WINDOW_SIZE, focus - 38))
  const windowEnd = Math.min(state.parentText.length, windowStart + WINDOW_SIZE)
  const parentWindow = state.parentText.slice(windowStart, windowEnd)
  const startX = 24
  const parentY = 110
  const patternY = 178
  const cellWidth = 13

  panel.append('text').attr('x', 24).attr('y', 89).attr('fill', COLORS.bfsTeal)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Parent text')
  panel.append('text').attr('x', 24).attr('y', 157).attr('fill', COLORS.amberMid)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Pattern')

  parentWindow.split('').forEach((character, localIndex) => {
    const absoluteIndex = windowStart + localIndex
    const active = absoluteIndex === state.textIndex
    const comparisonColor = state.comparison === 'match' || state.comparison === 'complete' ? COLORS.riskLow : COLORS.riskHigh
    cell(panel, startX + localIndex * cellWidth, parentY, character, absoluteIndex, {
      fill: active ? `${comparisonColor}33` : COLORS.surface1,
      stroke: active ? comparisonColor : COLORS.surface3,
      symbol: active ? (state.comparison === 'mismatch' ? '×' : '✓') : undefined,
    })
  })

  state.pattern.split('').forEach((character, patternIndex) => {
    const absoluteIndex = state.alignment + patternIndex
    if (absoluteIndex < windowStart || absoluteIndex >= windowEnd) return
    const active = patternIndex === state.patternIndex
    const comparisonColor = state.comparison === 'match' || state.comparison === 'complete' ? COLORS.riskLow : COLORS.riskHigh
    cell(panel, startX + (absoluteIndex - windowStart) * cellWidth, patternY, character, patternIndex, {
      fill: active ? `${comparisonColor}33` : COLORS.surface0,
      stroke: active ? comparisonColor : COLORS.amberDim,
    })
  })

  panel.append('line')
    .attr('x1', startX + Math.max(0, state.alignment - windowStart) * cellWidth)
    .attr('x2', startX + Math.min(WINDOW_SIZE, state.alignment - windowStart + state.pattern.length) * cellWidth)
    .attr('y1', patternY + 30).attr('y2', patternY + 30)
    .attr('stroke', COLORS.amberMid).attr('stroke-width', 3)

  const tableEntries = Object.entries(state.badCharacterTable)
  panel.append('text').attr('x', 24).attr('y', 260).attr('fill', COLORS.text1)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Bad-character table')
  tableEntries.forEach(([character, last], index) => {
    const x = 24 + index * 75
    panel.append('rect').attr('x', x).attr('y', 273).attr('width', 62).attr('height', 36)
      .attr('rx', 4).attr('fill', COLORS.surface1).attr('stroke', COLORS.surface3)
    panel.append('text').attr('x', x + 15).attr('y', 296).attr('fill', COLORS.text1)
      .attr('font-size', 13).attr('font-family', 'var(--font-mono)').text(character)
    panel.append('text').attr('x', x + 43).attr('y', 296).attr('fill', COLORS.amberBright)
      .attr('font-size', 13).attr('font-family', 'var(--font-mono)').text(last)
  })

  const status = state.comparison === 'mismatch' ? 'Mismatch ×' : state.comparison === 'complete' ? 'Complete match ✓' : state.comparison === 'match' ? 'Match ✓' : 'Ready'
  const details = [
    `Alignment ${state.alignment}`,
    status,
    `Mismatch ${state.mismatchCharacter ?? '—'}`,
    `Last occurrence ${state.lastOccurrence ?? '—'}`,
    `Shift ${state.shift ?? '—'}`,
    `Comparisons ${state.comparisons}`,
    `Matches ${state.matches.join(', ') || 'none yet'}`,
  ]
  panel.append('text').attr('x', 350).attr('y', 260).attr('fill', COLORS.text1)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Current operation')
  details.forEach((detail, index) => {
    panel.append('text').attr('x', 350 + (index % 2) * 285).attr('y', 287 + Math.floor(index / 2) * 27)
      .attr('fill', index === 1 ? (state.comparison === 'mismatch' ? COLORS.riskHigh : COLORS.riskLow) : COLORS.text2)
      .attr('font-size', 13).attr('font-family', 'var(--font-mono)').text(detail)
  })
}

function enter(svg: SVG, data: GraphData, _step: number, visualState?: AlgorithmVisualState): void {
  svg.selectAll('*').interrupt()
  resetGraph(svg, data, 0)
  dimAllEdges(svg, 0.035, 0)
  dimAllNodes(svg, 0.1, 0)
  setNodeColor(svg, 0, COLORS.riskHigh, 1, 0)
  svg.select(`#n-0`).attr('r', 24)
  addTextLabel(svg, data.nodes[0].x, data.nodes[0].y - 30, 'NDM-1 sequence context', COLORS.riskHigh, '14px', 'bm-label')
  if (visualState?.boyerMoore) drawSequencePanel(svg, visualState.boyerMoore)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('*').interrupt()
  svg.selectAll('.bm-panel, .bm-label').remove()
  resetGraph(svg, data, 0)
}

export const boyerMooreModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'parent text length', value: `${data.algorithms.boyer_moore.parent_text.length} bp` },
    { label: 'pattern length', value: `${data.algorithms.boyer_moore.pattern.length} bp` },
    { label: 'match positions', value: data.algorithms.boyer_moore.matches.join(', ') },
    { label: 'Boyer-Moore comparisons', value: String(data.algorithms.boyer_moore.comparisons_bm) },
    { label: 'naive comparisons', value: String(data.algorithms.boyer_moore.comparisons_naive) },
  ],
}
