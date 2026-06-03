import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, addTextLabel } from '@/lib/d3-graph'
import { COLORS, TIMINGS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'Target species', detail: 'Focus: K. pneumoniae (id=0) — highest plasmid ARG count (46). NDM-1 pattern to search: 30bp.' },
  { label: 'Pattern alignment', detail: 'Align NDM-1 sequence against CARD FASTA. Bad-character table built for 4-symbol DNA alphabet.' },
  { label: 'Bad-character skip', detail: 'Boyer-Moore skips mismatched positions using precomputed shift table — jumps ahead by up to pattern-length positions.' },
  { label: 'Matches found', detail: '2 matches at positions 0 and 813. BM: 951 comparisons vs Naive: 2119 — 2.23× speedup.' },
]

function drawDNAInset(svg: SVG, data: GraphData, phase: number): void {
  svg.selectAll('.bm-inset').remove()
  const bm = data.algorithms.boyer_moore
  const pattern = bm.pattern.slice(0, 20) // show first 20 chars
  const text = 'ATGGAATTGCCCAATATTAT' // first 20 of text for display

  const inset = svg.append('g')
    .attr('class', 'bm-inset')
    .attr('transform', 'translate(700, 480)')

  // Background panel
  inset.append('rect')
    .attr('x', 0).attr('y', 0)
    .attr('width', 380).attr('height', 120)
    .attr('fill', COLORS.surface2)
    .attr('stroke', COLORS.surface3)
    .attr('rx', 6)
    .attr('opacity', 0)
    .transition().duration(400).attr('opacity', 1)

  inset.append('text')
    .attr('x', 12).attr('y', 18)
    .attr('fill', COLORS.text3)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('letter-spacing', '0.08em')
    .text('NDM-1 · Boyer-Moore pattern search')

  // Text row
  inset.append('text')
    .attr('x', 12).attr('y', 42)
    .attr('fill', COLORS.text2)
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-mono)')
    .text('Text:    ' + text)

  // Pattern row with character colors
  const patChars = pattern.split('')
  const xStart = 12
  const charW = 8.5
  inset.append('text')
    .attr('x', xStart).attr('y', 64)
    .attr('fill', COLORS.text3)
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-mono)')
    .text('Pattern: ')

  const offset = 9 * charW // "Pattern: " is 9 chars
  patChars.forEach((ch, i) => {
    const match = phase >= 1 && text[i] === ch
    const shifted = phase >= 2 && i > 4
    inset.append('text')
      .attr('x', xStart + offset + i * charW + (shifted ? charW * 2 : 0))
      .attr('y', 64)
      .attr('fill', phase >= 1 ? (match ? COLORS.riskLow : COLORS.riskHigh) : COLORS.text2)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .text(ch)
  })

  if (phase >= 3) {
    inset.append('text')
      .attr('x', 12).attr('y', 92)
      .attr('fill', COLORS.amberMid)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .text(`Matches: [0, 813]   BM: ${bm.comparisons_bm} vs Naive: ${bm.comparisons_naive}   ${bm.speedup}× faster`)
  }
}

function enter(svg: SVG, data: GraphData, step: number): void {
  if (step === 0) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.05)
    dimAllNodes(svg, 0.15)
    // Pulse K. pneumoniae
    setNodeColor(svg, 0, COLORS.riskHigh, 1)
    addTextLabel(svg, data.nodes[0].x, data.nodes[0].y - 22, 'NDM-1 search target', COLORS.riskHigh, '10px', 'bm-label')
    return
  }
  svg.selectAll('.bm-label').remove()
  dimAllEdges(svg, 0.05)
  dimAllNodes(svg, 0.12)
  setNodeColor(svg, 0, COLORS.riskHigh, 1)
  drawDNAInset(svg, data, step - 1)
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.bm-inset, .bm-label').remove()
  resetGraph(svg, data)
}

export const boyerMooreModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'pattern matches in CARD FASTA', value: String(data.algorithms.boyer_moore.matches.length) },
    { label: 'Boyer-Moore comparisons', value: String(data.algorithms.boyer_moore.comparisons_bm) },
    { label: 'naive comparisons (baseline)', value: String(data.algorithms.boyer_moore.comparisons_naive) },
    { label: 'speedup factor', value: `${data.algorithms.boyer_moore.speedup}×` },
  ],
}
