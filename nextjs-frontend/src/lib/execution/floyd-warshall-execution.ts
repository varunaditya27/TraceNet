import type { GraphData } from '../graph-data'
import type { ExecutionProgram, ExecutionStep, FloydWarshallVisualState } from './types'
import { cloneMatrix, formatDistance } from './utils.ts'

export interface FloydWarshallOperation {
  index: number
  k: number
  i: number
  j: number
  oldValue: number | null
  firstSegment: number | null
  secondSegment: number | null
  candidate: number | null
  selectedValue: number | null
  updated: boolean
  matrix: (number | null)[][]
}

const programCache = new WeakMap<GraphData, ExecutionProgram>()

export function createInitialDistanceMatrix(data: GraphData): (number | null)[][] {
  const matrix = Array.from({ length: data.nodes.length }, () =>
    Array.from({ length: data.nodes.length }, () => null as number | null)
  )
  data.nodes.forEach(node => { matrix[node.id][node.id] = 0 })
  data.edges.forEach(edge => {
    const current = matrix[edge.src][edge.tgt]
    matrix[edge.src][edge.tgt] = current === null ? edge.dist : Math.min(current, edge.dist)
  })
  return matrix
}

export function generateFloydWarshallOperations(data: GraphData): FloydWarshallOperation[] {
  const matrix = createInitialDistanceMatrix(data)
  const operations: FloydWarshallOperation[] = []
  let index = 0
  for (let k = 0; k < matrix.length; k += 1) {
    for (let i = 0; i < matrix.length; i += 1) {
      for (let j = 0; j < matrix.length; j += 1) {
        const oldValue = matrix[i][j]
        const firstSegment = matrix[i][k]
        const secondSegment = matrix[k][j]
        const candidate = firstSegment === null || secondSegment === null ? null : firstSegment + secondSegment
        const updated = candidate !== null && (oldValue === null || candidate < oldValue - 1e-12)
        if (updated) matrix[i][j] = candidate
        operations.push({
          index,
          k,
          i,
          j,
          oldValue,
          firstSegment,
          secondSegment,
          candidate,
          selectedValue: matrix[i][j],
          updated,
          matrix: cloneMatrix(matrix),
        })
        index += 1
      }
    }
  }
  return operations
}

function visual(operation: FloydWarshallOperation, isFinalStep = false): FloydWarshallVisualState {
  return {
    matrix: operation.matrix,
    k: operation.k,
    i: operation.i,
    j: operation.j,
    oldValue: operation.oldValue,
    firstSegment: operation.firstSegment,
    secondSegment: operation.secondSegment,
    candidate: operation.candidate,
    selectedValue: operation.selectedValue,
    updated: operation.updated,
    isFinalStep,
  }
}

function operationStep(data: GraphData, operation: FloydWarshallOperation, finalOperationIndex: number): ExecutionStep {
  const candidateText = operation.candidate === null ? '∞' : formatDistance(operation.candidate)
  return {
    id: `fw-operation-${operation.index}`,
    algorithmId: 'floyd_warshall',
    phase: `Intermediate k=${operation.k}: ${data.nodes[operation.k].short}`,
    title: operation.updated ? 'Update the distance cell' : 'Keep the existing distance',
    action: `Inspect (k=${operation.k}, i=${operation.i}, j=${operation.j}) and compare the current route with the route through ${data.nodes[operation.k].short}.`,
    reason: 'Any shortest path either avoids k or splits into a shortest i→k segment and a shortest k→j segment.',
    visualExplanation: `${data.nodes[operation.i].short} is cyan, ${data.nodes[operation.j].short} is pink, and ${data.nodes[operation.k].short} is amber. The three recurrence cells are outlined in the same colors.`,
    dataStructureLabel: 'Current recurrence',
    dataStructureState: [
      { key: 'k / intermediate', value: `${operation.k} · ${data.nodes[operation.k].short}` },
      { key: 'i / source', value: `${operation.i} · ${data.nodes[operation.i].short}` },
      { key: 'j / destination', value: `${operation.j} · ${data.nodes[operation.j].short}` },
      { key: 'old dist[i][j]', value: formatDistance(operation.oldValue) },
      { key: 'dist[i][k]', value: formatDistance(operation.firstSegment) },
      { key: 'dist[k][j]', value: formatDistance(operation.secondSegment) },
      { key: 'candidate', value: candidateText },
      { key: 'selected', value: formatDistance(operation.selectedValue) },
      { key: 'status', value: operation.updated ? 'Updated' : 'No update' },
    ],
    calculation: `${formatDistance(operation.oldValue)} vs ${formatDistance(operation.firstSegment)} + ${formatDistance(operation.secondSegment)} = ${candidateText}`,
    takeaway: operation.updated
      ? 'The route through k is shorter, so the matrix remembers it.'
      : 'The current route is already as good or better, so the cell stays unchanged.',
    pseudocodeLines: [6],
    visualState: {
      activeNode: operation.k,
      activeEdge: operation.i === operation.k || operation.k === operation.j ? undefined : [operation.i, operation.k],
      floydWarshall: visual(operation, operation.index === finalOperationIndex),
    },
    operationIndex: operation.index,
    phaseIndex: operation.k,
  }
}

export function generateFloydWarshallProgram(data: GraphData): ExecutionProgram {
  const cached = programCache.get(data)
  if (cached) return cached
  const operations = generateFloydWarshallOperations(data)
  const finalOperationIndex = operations.length - 1
  const emptyMatrix = Array.from({ length: data.nodes.length }, () =>
    Array.from({ length: data.nodes.length }, () => null as number | null)
  )
  const diagonalMatrix = cloneMatrix(emptyMatrix)
  data.nodes.forEach(node => { diagonalMatrix[node.id][node.id] = 0 })
  const initialMatrix = createInitialDistanceMatrix(data)
  const first = operations[0]
  const firstUpdate = operations.find(operation => operation.updated)
  const updateCount = operations.filter(operation => operation.updated).length

  // This dataset's two graph components are complete digraphs, so no indirect route through
  // a third species ever beats an existing direct edge — every single operation is a
  // rejection (verified: updateCount === 0). Rather than force a fabricated "accept" example
  // that contradicts its own underlying data, pick the most illustrative real rejection: the
  // earliest k-phase, with (i, j, k) all distinct, and the largest candidate/old gap (a clean,
  // obvious "no" rather than a near-miss rounding artifact). If a future regenerated dataset
  // *does* contain a real update, firstUpdate is used instead and the text below adapts.
  const distinctRejects = operations
    .filter((op): op is FloydWarshallOperation & { candidate: number; oldValue: number } =>
      !op.updated && op.candidate !== null && op.oldValue !== null &&
      op.i !== op.j && op.i !== op.k && op.j !== op.k)
    .map(op => ({ op, gap: op.candidate - op.oldValue }))
  const bestObviousReject = [...distinctRejects].sort((a, b) => (a.op.k - b.op.k) || (b.gap - a.gap))[0]?.op
  const closestNearMiss = [...distinctRejects].sort((a, b) => a.gap - b.gap)[0]?.op

  const sampleOperation = firstUpdate ?? bestObviousReject ?? first
  const contrastOperation = firstUpdate
    ? (operations.find(op => !op.updated && op.candidate !== null && op !== sampleOperation) ?? first)
    : (closestNearMiss ?? sampleOperation)

  const secondPair = operations[1]
  const endFirstK = operations[data.nodes.length ** 2 - 1]
  const nextK = operations[data.nodes.length ** 2]
  const final = operations.at(-1)!

  const introVisual = (
    matrix: (number | null)[][],
    operation = first,
    options: { isIntroStep?: boolean; revealRoles?: Array<'i' | 'j' | 'k'>; emphasizeRole?: 'i' | 'j' | 'k' } = {},
  ): FloydWarshallVisualState => ({
    ...visual(operation, operation.index === finalOperationIndex),
    matrix,
    isIntroStep: options.isIntroStep ?? false,
    revealRoles: options.revealRoles,
    emphasizeRole: options.emphasizeRole,
  })

  // Mirrors the graph/matrix reveal gating for the right-sidebar "state" card, so a role the
  // current guided step hasn't introduced yet doesn't already show a concrete value there either.
  const redactedDataStructureState = (operation: FloydWarshallOperation, roles: Array<'i' | 'j' | 'k'>) => {
    const hasI = roles.includes('i')
    const hasJ = roles.includes('j')
    const hasK = roles.includes('k')
    const hasBoth = hasI && hasJ
    const candidateText = operation.candidate === null ? '∞' : formatDistance(operation.candidate)
    return [
      { key: 'k / intermediate', value: hasK ? `${operation.k} · ${data.nodes[operation.k].short}` : '—' },
      { key: 'i / source', value: hasI ? `${operation.i} · ${data.nodes[operation.i].short}` : '—' },
      { key: 'j / destination', value: hasJ ? `${operation.j} · ${data.nodes[operation.j].short}` : '—' },
      { key: 'old dist[i][j]', value: hasBoth ? formatDistance(operation.oldValue) : '—' },
      { key: 'dist[i][k]', value: hasBoth ? formatDistance(operation.firstSegment) : '—' },
      { key: 'dist[k][j]', value: hasBoth ? formatDistance(operation.secondSegment) : '—' },
      { key: 'candidate', value: hasBoth ? candidateText : '—' },
      { key: 'selected', value: hasBoth ? formatDistance(operation.selectedValue) : '—' },
      { key: 'status', value: hasBoth ? (operation.updated ? 'Updated' : 'No update') : '—' },
    ]
  }
  const selected: Array<{ title: string; operation: FloydWarshallOperation; action: string; lines: number[]; matrix?: (number | null)[][]; visual?: string; reason?: string; takeaway?: string }> = [
    { title: 'Define the all-pairs objective', operation: first, action: 'Find the shortest weighted path between every ordered pair of species.', lines: [], matrix: emptyMatrix, visual: 'No species is highlighted yet — the objective covers every ordered pair equally.', reason: `This must hold for all ${data.nodes.length}×${data.nodes.length} ordered pairs, not just ones with a direct edge.`, takeaway: 'All-pairs distance is a strictly larger goal than single-source shortest paths.' },
    { title: 'Create an empty distance matrix', operation: first, action: `Allocate ${data.nodes.length} × ${data.nodes.length} cells.`, lines: [], matrix: emptyMatrix, visual: 'The matrix fills with empty cells; no species pair has a known distance yet.', reason: 'Every ordered pair needs its own cell before any distance can be recorded.', takeaway: 'The matrix is the single data structure the whole algorithm reads and writes.' },
    { title: 'Set diagonal cells to zero', operation: first, action: 'Set dist[i][i] = 0 because no travel is needed.', lines: [1], matrix: diagonalMatrix, visual: 'Diagonal cells (each species to itself) turn to 0.0 in the matrix.' },
    { title: 'Copy direct edge costs', operation: first, action: 'Write each real -log(weight) edge cost into its matrix cell.', lines: [2], matrix: initialMatrix, visual: "Matrix cells with a direct edge now show that edge's transformed cost." },
    { title: 'Mark missing edges as infinity', operation: first, action: 'Leave pairs without a direct edge as infinity.', lines: [2], matrix: initialMatrix, visual: 'Matrix cells without a direct edge display ∞.' },
    { title: 'Explain intermediate node k', operation: first, action: 'Allow one more species to appear inside candidate paths.', lines: [3], visual: `${data.nodes[first.k].short} turns amber as the intermediate species under discussion.` },
    { title: 'Select the first k phase', operation: first, action: `Use ${data.nodes[first.k].short} as intermediate k.`, lines: [3], visual: `${data.nodes[first.k].short} stays amber — it is the fixed k for this entire phase.` },
    { title: 'Select source row i', operation: first, action: `Choose row ${first.i}: ${data.nodes[first.i].short}.`, lines: [4], visual: `${data.nodes[first.i].short} now also highlights as source row i (the same node as k here).` },
    { title: 'Select destination column j', operation: first, action: `Choose column ${first.j}: ${data.nodes[first.j].short}.`, lines: [5], visual: `${data.nodes[first.j].short} now also highlights as destination column j, completing the (i, j, k) triple.` },
    { title: 'Highlight the three recurrence cells', operation: sampleOperation, action: 'Highlight dist[i][j], dist[i][k], and dist[k][j].', lines: [6] },
    { title: 'Calculate the candidate route', operation: sampleOperation, action: 'Add the i→k and k→j segment costs.', lines: [6] },
    { title: 'Compare old and candidate values', operation: sampleOperation, action: 'Take the minimum of the old cell and candidate sum.', lines: [6] },
    {
      title: sampleOperation.updated ? 'Accept an improving update' : 'Confirm the direct route already wins',
      operation: sampleOperation,
      action: sampleOperation.updated
        ? `Replace dist[${data.nodes[sampleOperation.i].short}][${data.nodes[sampleOperation.j].short}] because the route through ${data.nodes[sampleOperation.k].short} is shorter.`
        : `Keep dist[${data.nodes[sampleOperation.i].short}][${data.nodes[sampleOperation.j].short}] = ${formatDistance(sampleOperation.oldValue)} — routing through ${data.nodes[sampleOperation.k].short} would cost ${sampleOperation.candidate === null ? '∞' : formatDistance(sampleOperation.candidate)}, more than the existing edge.`,
      reason: sampleOperation.updated
        ? 'The candidate beats the previously known distance.'
        : `${data.nodes[sampleOperation.i].short} and ${data.nodes[sampleOperation.j].short} already have a direct edge — routing through a third species only adds cost on top of it.`,
      lines: [7],
    },
    {
      title: sampleOperation.updated ? 'Retain a non-improving cell elsewhere' : 'Recognize the pattern across the whole graph',
      operation: contrastOperation,
      action: sampleOperation.updated
        ? 'Keep dist[i][j] because a different candidate does not improve it.'
        : `Even the closest near-miss in this graph — ${data.nodes[contrastOperation.i].short}→${data.nodes[contrastOperation.j].short} via ${data.nodes[contrastOperation.k].short} — still costs more than the direct edge. ${updateCount} of ${operations.length} recurrence checks ever improve a cell in this dataset.`,
      reason: sampleOperation.updated
        ? 'Only strict improvements are worth writing back into the matrix.'
        : 'Both components of this graph are complete digraphs — every reachable pair already has a direct edge, so no third-species detour can ever be cheaper.',
      lines: [7],
    },
    { title: 'Advance to the next (i,j) pair', operation: secondPair, action: 'Increment j, then i after each row completes.', lines: [4, 5] },
    { title: 'Complete the current k phase', operation: endFirstK, action: `Finish all ${data.nodes.length ** 2} pairs for k=${endFirstK.k}.`, lines: [3, 4, 5, 6] },
    { title: 'Move to the next intermediate', operation: nextK, action: `Start k=${nextK.k}: ${data.nodes[nextK.k].short}.`, lines: [3] },
    {
      title: 'Present the final matrix',
      operation: final,
      action: `After ${operations.length} operations, compare the generated matrix with the stored result.`,
      reason: "Aggregating each row of the finished matrix reveals which species has the least total separation from every other species.",
      visual: `${data.algorithms.floyd_warshall.most_vulnerable_name}'s row and column are outlined in gold — the most vulnerable species, with the lowest aggregate distance across the graph.`,
      takeaway: "The most vulnerable species isn't the one with the single shortest edge — it's the one that stays cheaply reachable from everywhere.",
      lines: [7, 8],
    },
  ]

  const guided = selected.map((item, index) => {
    const base = operationStep(data, item.operation, finalOperationIndex)
    // Steps 0-4 narrate the matrix itself (no node/role has been chosen yet). Steps 5-8 all
    // narrate the same (i=0, j=0, k=0) triple as four separate concepts ("explain k" -> "select
    // k" -> "select row i" -> "select column j"); reveal each role only once its step introduces
    // it. Steps 9+ use real, naturally-distinct operations and need no gating (undefined = all shown).
    const revealRoles: Array<'i' | 'j' | 'k'> | undefined =
      index < 5 ? [] : index === 5 || index === 6 ? ['k'] : index === 7 ? ['k', 'i'] : undefined
    const rowAndColKnown = revealRoles === undefined || (revealRoles.includes('i') && revealRoles.includes('j'))
    return {
      ...base,
      id: `fw-guided-${index}`,
      phase: index < 5 ? 'Initialize' : index < 17 ? 'Dynamic programming' : 'Result',
      title: item.title,
      action: item.action,
      reason: item.reason ?? base.reason,
      takeaway: item.takeaway ?? base.takeaway,
      visualExplanation: item.visual ?? base.visualExplanation,
      calculation: rowAndColKnown ? base.calculation : undefined,
      pseudocodeLines: item.lines,
      dataStructureState: revealRoles ? redactedDataStructureState(item.operation, revealRoles) : base.dataStructureState,
      visualState: {
        ...base.visualState,
        floydWarshall: introVisual(item.matrix ?? item.operation.matrix, item.operation, {
          isIntroStep: index < 5,
          revealRoles,
          emphasizeRole: index === 7 ? 'i' : index === 8 ? 'j' : undefined,
        }),
      },
    }
  })
  const program = {
    guided,
    full: operations.map(operation => operationStep(data, operation, finalOperationIndex)),
    phaseStarts: Array.from({ length: data.nodes.length }, (_, k) => k * data.nodes.length ** 2),
  }
  programCache.set(data, program)
  return program
}
