import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule } from './index'
import type { AlgorithmVisualState, BoyerMooreVisualState } from '@/lib/execution/types'
import { resetGraph, dimAllNodes, dimAllEdges } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

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
    .attr('role', 'img').attr('aria-label', `${state.geneName ?? 'DNA'} Boyer-Moore sequence search at alignment ${state.alignment}`)
  panel.append('rect')
    .attr('x', 0).attr('y', 0).attr('width', 960).attr('height', 395).attr('rx', 10)
    .attr('fill', COLORS.surface2).attr('stroke', COLORS.surface3).attr('stroke-width', 1.5)

  panel.append('text')
    .attr('x', 24).attr('y', 32).attr('fill', COLORS.text1)
    .attr('font-size', 17).attr('font-weight', 700).attr('font-family', 'var(--font-sans)')
    .text(`${state.geneName ?? 'DNA'} bad-character Boyer-Moore search`)
  panel.append('text')
    .attr('x', 24).attr('y', 57).attr('fill', COLORS.text2)
    .attr('font-size', 13).attr('font-family', 'var(--font-sans)')
    .text(`Parent text: ${state.parentText.length} bp · Pattern: ${state.pattern.length} bp · zero-based offsets · bad-character heuristic only`)

  if (state.stage === 'result') {
    const maxComparisons = Math.max(state.comparisons, state.naiveComparisons ?? 0, 1)
    panel.append('text').attr('x', 24).attr('y', 96).attr('fill', COLORS.text1).attr('font-size', 14).attr('font-weight', 700).text('Character comparisons')
    ;[
      ['Boyer-Moore', state.comparisons, COLORS.bfsTeal],
      ['Naive search', state.naiveComparisons ?? 0, COLORS.amberMid],
    ].forEach(([label, value, color], index) => {
      const numeric = Number(value)
      const y = 124 + index * 58
      panel.append('text').attr('x', 24).attr('y', y).attr('fill', COLORS.text2).attr('font-size', 12).text(String(label))
      panel.append('rect').attr('x', 145).attr('y', y - 16).attr('width', 650 * numeric / maxComparisons).attr('height', 20).attr('rx', 4).attr('fill', String(color))
      panel.append('text').attr('x', 810).attr('y', y).attr('fill', COLORS.text1).attr('font-size', 12).attr('font-family', 'var(--font-mono)').text(numeric)
    })
    panel.append('text').attr('x', 24).attr('y', 250).attr('fill', COLORS.text1).attr('font-size', 14).attr('font-weight', 700).text(`Sequence map · ${state.speedup?.toFixed(2) ?? '—'}× fewer comparisons`)
    panel.append('line').attr('x1', 24).attr('x2', 930).attr('y1', 290).attr('y2', 290).attr('stroke', COLORS.surface3).attr('stroke-width', 8)
    state.matches.forEach(offset => {
      const x = 24 + 906 * offset / Math.max(1, state.parentText.length - 1)
      panel.append('line').attr('x1', x).attr('x2', x).attr('y1', 270).attr('y2', 310).attr('stroke', COLORS.riskLow).attr('stroke-width', 4)
      panel.append('text').attr('x', x).attr('y', 330).attr('text-anchor', 'middle').attr('fill', COLORS.riskLow).attr('font-size', 11).attr('font-family', 'var(--font-mono)').text(`match ${offset}`)
    })
    panel.append('text').attr('x', 24).attr('y', 365).attr('fill', COLORS.text2).attr('font-size', 12).text('Both algorithms report the same exact, overlapping-capable, zero-based match offsets.')
    return
  }

  const displayAlignment = state.nextAlignment ?? state.alignment
  const focus = state.nextAlignment ?? state.textIndex ?? state.alignment
  const windowStart = Math.max(0, Math.min(state.parentText.length - WINDOW_SIZE, focus - 38))
  const windowEnd = Math.min(state.parentText.length, windowStart + WINDOW_SIZE)
  const parentWindow = state.parentText.slice(windowStart, windowEnd)
  const startX = 24
  const parentY = 110
  const patternY = 178
  const cellWidth = 13

  panel.append('text').attr('x', 24).attr('y', 89).attr('fill', COLORS.bfsTeal)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Parent text')
  panel.append('text').attr('x', 230).attr('y', 89).attr('fill', COLORS.text3).attr('font-size', 11).attr('font-family', 'var(--font-mono)')
    .text(`showing bases ${windowStart}–${windowEnd - 1} of ${state.parentText.length}`)
  if (windowStart > 0) panel.append('text').attr('x', 12).attr('y', 126).attr('fill', COLORS.text3).text('…')
  if (windowEnd < state.parentText.length) panel.append('text').attr('x', 947).attr('y', 126).attr('fill', COLORS.text3).text('…')
  const showPattern = state.stage !== 'load'
  const patternAligned = state.stage === 'align' || state.stage === 'search'
  if (showPattern) panel.append('text').attr('x', 24).attr('y', 157).attr('fill', COLORS.amberMid)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text(patternAligned ? 'Aligned pattern' : 'Query pattern preview')
  if (state.stage === 'pattern') panel.append('text').attr('x', 230).attr('y', 157).attr('fill', COLORS.text3).attr('font-size', 10)
    .text(`sampled from parent offset ${state.patternSourceOffset ?? '—'} for validation`)

  parentWindow.split('').forEach((character, localIndex) => {
    const absoluteIndex = windowStart + localIndex
    const patternIndex = absoluteIndex - state.alignment
    const previouslyMatched = state.nextAlignment === undefined && (state.matchedPatternIndices ?? []).includes(patternIndex)
    const active = state.nextAlignment === undefined && absoluteIndex === state.textIndex
    const comparisonColor = state.comparison === 'match' || state.comparison === 'complete' ? COLORS.riskLow : COLORS.riskHigh
    cell(panel, startX + localIndex * cellWidth, parentY, character, absoluteIndex, {
      fill: active ? `${comparisonColor}33` : previouslyMatched ? `${COLORS.riskLow}22` : COLORS.surface1,
      stroke: active ? comparisonColor : previouslyMatched ? COLORS.riskLow : COLORS.surface3,
      symbol: active ? (state.comparison === 'mismatch' ? '×' : '✓') : undefined,
    })
  })

  if (showPattern) state.pattern.split('').forEach((character, patternIndex) => {
    const absoluteIndex = displayAlignment + patternIndex
    if (absoluteIndex < windowStart || absoluteIndex >= windowEnd) return
    const previouslyMatched = state.nextAlignment === undefined && (state.matchedPatternIndices ?? []).includes(patternIndex)
    const active = state.nextAlignment === undefined && patternIndex === state.patternIndex
    const comparisonColor = state.comparison === 'match' || state.comparison === 'complete' ? COLORS.riskLow : COLORS.riskHigh
    cell(panel, startX + (absoluteIndex - windowStart) * cellWidth, patternY, character, patternIndex, {
      fill: active ? `${comparisonColor}33` : previouslyMatched ? `${COLORS.riskLow}22` : COLORS.surface0,
      stroke: active ? comparisonColor : previouslyMatched ? COLORS.riskLow : COLORS.amberDim,
    })
  })

  if (patternAligned) panel.append('line')
    .attr('x1', startX + Math.max(0, displayAlignment - windowStart) * cellWidth)
    .attr('x2', startX + Math.min(WINDOW_SIZE, displayAlignment - windowStart + state.pattern.length) * cellWidth)
    .attr('y1', patternY + 30).attr('y2', patternY + 30)
    .attr('stroke', COLORS.amberMid).attr('stroke-width', 3)
  if (state.nextAlignment !== undefined) {
    for (let skipped = state.alignment + 1; skipped < state.nextAlignment; skipped += 1) {
      const x = startX + (skipped - windowStart) * cellWidth
      if (x >= startX && x <= startX + WINDOW_SIZE * cellWidth) {
        panel.append('text').attr('x', x).attr('y', patternY + 48).attr('text-anchor', 'middle')
          .attr('fill', COLORS.riskHigh).attr('font-size', 11).text('×')
      }
    }
    panel.append('text').attr('x', 350).attr('y', 245).attr('fill', COLORS.text3).attr('font-size', 10)
      .text(`× marks ${Math.max(0, state.nextAlignment - state.alignment - 1)} eliminated candidate alignment(s)`)
  }

  const showTable = state.stage !== 'load' && state.stage !== 'pattern'
  const tableEntries = Object.entries(state.badCharacterTable)
  if (showTable) panel.append('text').attr('x', 24).attr('y', 260).attr('fill', COLORS.text1)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Bad-character table')
  if (showTable) tableEntries.forEach(([character, last], index) => {
    const x = 24 + index * 75
    panel.append('rect').attr('x', x).attr('y', 273).attr('width', 62).attr('height', 36)
      .attr('rx', 4).attr('fill', character === state.mismatchCharacter ? `${COLORS.pathGold}33` : COLORS.surface1).attr('stroke', character === state.mismatchCharacter ? COLORS.pathGold : COLORS.surface3)
    panel.append('text').attr('x', x + 15).attr('y', 296).attr('fill', COLORS.text1)
      .attr('font-size', 13).attr('font-family', 'var(--font-mono)').text(character)
    panel.append('text').attr('x', x + 43).attr('y', 296).attr('fill', COLORS.amberBright)
      .attr('font-size', 13).attr('font-family', 'var(--font-mono)').text(last)
  })

  const status = state.nextAlignment !== undefined ? `Shift ${state.alignment} → ${state.nextAlignment}` : state.comparison === 'mismatch' ? 'Mismatch ×' : state.comparison === 'complete' ? 'Complete match ✓' : state.comparison === 'match' ? 'Match ✓' : 'Ready'
  const details = [
    `Alignment ${state.nextAlignment === undefined ? state.alignment : `${state.alignment} → ${state.nextAlignment}`}`,
    status,
    `Mismatch ${state.mismatchCharacter ?? '—'}`,
    `Last occurrence ${state.lastOccurrence ?? '—'}`,
    `Shift ${state.shift ?? '—'}`,
    `Comparisons ${state.comparisons}`,
    `Matches ${state.matches.join(', ') || 'none yet'}`,
  ]
  if (state.stage === 'align' || state.stage === 'search') panel.append('text').attr('x', 350).attr('y', 260).attr('fill', COLORS.text1)
    .attr('font-size', 13).attr('font-weight', 700).attr('font-family', 'var(--font-sans)').text('Current operation')
  if (state.stage === 'align' || state.stage === 'search') details.forEach((detail, index) => {
    panel.append('text').attr('x', 350 + (index % 2) * 285).attr('y', 287 + Math.floor(index / 2) * 27)
      .attr('fill', index === 1 ? (state.comparison === 'mismatch' ? COLORS.riskHigh : COLORS.riskLow) : COLORS.text2)
      .attr('font-size', 13).attr('font-family', 'var(--font-mono)').text(detail)
  })
  if (state.stage === 'search') panel.append('text').attr('x', 24).attr('y', 377).attr('fill', COLORS.text3).attr('font-size', 10)
    .text('Green outline = matched suffix · bright green = current match · red × = mismatch/skipped candidate · gold = query alignment')
}

function enter(svg: SVG, data: GraphData, _step: number, visualState?: AlgorithmVisualState): void {
  svg.selectAll('*').interrupt()
  resetGraph(svg, data, 0)
  dimAllEdges(svg, 0.035, 0)
  dimAllNodes(svg, 0.1, 0)
  if (visualState?.boyerMoore) drawSequencePanel(svg, visualState.boyerMoore)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('*').interrupt()
  svg.selectAll('.bm-panel, .bm-label').remove()
  resetGraph(svg, data, 0)
}

export const boyerMooreModule: AlgorithmModule = {
  steps: [],
  enter,
  exit,
  getResults: (data) => [
    { label: 'parent text length', value: `${data.algorithms.boyer_moore.parent_text.length} bp` },
    { label: 'pattern length', value: `${data.algorithms.boyer_moore.pattern.length} bp` },
    { label: 'match positions', value: data.algorithms.boyer_moore.matches.join(', ') },
    { label: 'Boyer-Moore comparisons', value: String(data.algorithms.boyer_moore.comparisons_bm) },
    { label: 'naive comparisons', value: String(data.algorithms.boyer_moore.comparisons_naive) },
    { label: 'comparison reduction', value: `${data.algorithms.boyer_moore.speedup.toFixed(2)}×` },
  ],
}
