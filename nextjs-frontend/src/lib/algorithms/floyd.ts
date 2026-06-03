import * as d3 from 'd3'
import type { GraphData } from '@/lib/graph-data'
import type { AlgorithmModule, StepDef } from './index'
import { resetGraph, dimAllNodes, dimAllEdges, setNodeColor, addTextLabel } from '@/lib/d3-graph'
import { COLORS } from '@/lib/constants'

type SVG = d3.Selection<SVGSVGElement, unknown, null, undefined>

const STEPS: StepDef[] = [
  { label: 'Initialize distance matrix', detail: 'Build 16×16 matrix. Diagonal = 0, direct edges = −log(w), others = ∞.' },
  { label: 'Relax all pairs', detail: 'For each intermediate node k, update dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). V³ = 4,096 operations.' },
  { label: 'Compute vulnerability scores', detail: 'Sum each row (total reach). Lower score = more connected = more dangerous. K. pneumoniae scores 1.393 — most vulnerable.' },
  { label: 'Most vulnerable node', detail: 'K. pneumoniae (node 0) has the lowest total distance to all reachable nodes — the most epidemiologically central species.' },
]

function drawMatrix(svg: SVG, data: GraphData, filledRows: number): void {
  svg.selectAll('.fw-matrix').remove()
  const fw = data.algorithms.floyd_warshall
  const n = 16
  const cellSize = 20
  const matW = n * cellSize
  const matH = n * cellSize
  const mx = (1140 - matW) / 2
  const my = (670 - matH) / 2 - 20

  const allDists = fw.dist_matrix.flat().filter((v): v is number => v !== null)
  const minD = Math.min(...allDists)
  const maxD = Math.max(...allDists)
  const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([maxD, minD])

  const gMatrix = svg.append('g').attr('class', 'fw-matrix')

  gMatrix.append('rect')
    .attr('x', mx - 8).attr('y', my - 24)
    .attr('width', matW + 16).attr('height', matH + 32)
    .attr('fill', COLORS.surface1)
    .attr('stroke', COLORS.surface3)
    .attr('rx', 6)

  gMatrix.append('text')
    .attr('x', mx + matW/2).attr('y', my - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', COLORS.text3)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('letter-spacing', '0.06em')
    .text('ALL-PAIRS DISTANCE MATRIX (16×16)')

  for (let i = 0; i < filledRows; i++) {
    for (let j = 0; j < n; j++) {
      const val = fw.dist_matrix[i][j]
      const color = val === null ? COLORS.surface3 : colorScale(val)
      gMatrix.append('rect')
        .attr('x', mx + j * cellSize).attr('y', my + i * cellSize)
        .attr('width', cellSize - 1).attr('height', cellSize - 1)
        .attr('fill', color)
        .attr('opacity', val === null ? 0.3 : 0.85)
    }
  }
}

function enter(svg: SVG, data: GraphData, step: number): void {
  const fw = data.algorithms.floyd_warshall

  if (step === 0) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.08)
    dimAllNodes(svg, 0.4)
    drawMatrix(svg, data, 0)
    // Animate rows filling in
    let row = 0
    const interval = setInterval(() => {
      row++
      drawMatrix(svg, data, row)
      if (row >= 16) clearInterval(interval)
    }, 80)
    return
  }

  if (step >= 1) {
    resetGraph(svg, data)
    dimAllEdges(svg, 0.08)
    dimAllNodes(svg, 0.4)
    drawMatrix(svg, data, 16)
  }

  if (step >= 2) {
    // Color nodes by vulnerability score
    const scores = fw.vulnerability_scores
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    scores.forEach((score, nodeId) => {
      const t = (score - minScore) / (maxScore - minScore)
      // Low score = high connectivity = amber; high score = dim
      const color = d3.interpolate(COLORS.amberBright, COLORS.text3)(t)
      setNodeColor(svg, nodeId, color, 0.4 + (1 - t) * 0.6)
    })
  }

  if (step >= 3) {
    // Highlight most vulnerable
    const mvId = fw.most_vulnerable
    setNodeColor(svg, mvId, COLORS.amberBright, 1)
    const node = data.nodes[mvId]
    addTextLabel(svg, node.x, node.y - 22, '★ most vulnerable', COLORS.amberBright, '10px', 'fw-label')
    // Top 3 most-connected by lowest score
    const sorted = fw.vulnerability_scores
      .map((s, i) => ({ s, i }))
      .sort((a, b) => a.s - b.s)
      .slice(0, 3)
    sorted.forEach(({ i }) => {
      if (i === mvId) return
      setNodeColor(svg, i, COLORS.amberMid, 0.9)
    })
  }
}

function exit(svg: SVG, data: GraphData): void {
  svg.selectAll('.fw-matrix, .fw-label').remove()
  resetGraph(svg, data)
}

export const floydModule: AlgorithmModule = {
  steps: STEPS,
  enter,
  exit,
  getResults: (data) => [
    { label: 'most vulnerable node', value: data.algorithms.floyd_warshall.most_vulnerable_name.split(' ').slice(-1)[0] },
    { label: 'reachable pairs (Gram-neg)', value: '132' },
    { label: 'isolated pairs (cross-Gram)', value: '48' },
    { label: 'total operations', value: '4,096' },
  ],
}
