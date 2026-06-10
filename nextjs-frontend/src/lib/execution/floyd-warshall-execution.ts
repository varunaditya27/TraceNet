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

function visual(operation: FloydWarshallOperation): FloydWarshallVisualState {
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
  }
}

function operationStep(data: GraphData, operation: FloydWarshallOperation): ExecutionStep {
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
      floydWarshall: visual(operation),
    },
    operationIndex: operation.index,
    phaseIndex: operation.k,
  }
}

export function generateFloydWarshallProgram(data: GraphData): ExecutionProgram {
  const cached = programCache.get(data)
  if (cached) return cached
  const operations = generateFloydWarshallOperations(data)
  const emptyMatrix = Array.from({ length: data.nodes.length }, () =>
    Array.from({ length: data.nodes.length }, () => null as number | null)
  )
  const diagonalMatrix = cloneMatrix(emptyMatrix)
  data.nodes.forEach(node => { diagonalMatrix[node.id][node.id] = 0 })
  const initialMatrix = createInitialDistanceMatrix(data)
  const first = operations[0]
  const firstUpdate = operations.find(operation => operation.updated) ?? first
  const firstReject = operations.find(operation => !operation.updated && operation.candidate !== null) ?? first
  const secondPair = operations[1]
  const endFirstK = operations[data.nodes.length ** 2 - 1]
  const nextK = operations[data.nodes.length ** 2]
  const final = operations.at(-1)!

  const introVisual = (matrix: (number | null)[][], operation = first): FloydWarshallVisualState => ({ ...visual(operation), matrix })
  const selected: Array<{ title: string; operation: FloydWarshallOperation; action: string; lines: number[]; matrix?: (number | null)[][] }> = [
    { title: 'Define the all-pairs objective', operation: first, action: 'Find the shortest weighted path between every ordered pair of species.', lines: [1], matrix: emptyMatrix },
    { title: 'Create an empty distance matrix', operation: first, action: `Allocate ${data.nodes.length} × ${data.nodes.length} cells.`, lines: [1], matrix: emptyMatrix },
    { title: 'Set diagonal cells to zero', operation: first, action: 'Set dist[i][i] = 0 because no travel is needed.', lines: [1], matrix: diagonalMatrix },
    { title: 'Copy direct edge costs', operation: first, action: 'Write each real -log(weight) edge cost into its matrix cell.', lines: [2], matrix: initialMatrix },
    { title: 'Mark missing edges as infinity', operation: first, action: 'Leave pairs without a direct edge as infinity.', lines: [2], matrix: initialMatrix },
    { title: 'Explain intermediate node k', operation: first, action: 'Allow one more species to appear inside candidate paths.', lines: [3] },
    { title: 'Select the first k phase', operation: first, action: `Use ${data.nodes[first.k].short} as intermediate k.`, lines: [3] },
    { title: 'Select source row i', operation: first, action: `Choose row ${first.i}: ${data.nodes[first.i].short}.`, lines: [4] },
    { title: 'Select destination column j', operation: first, action: `Choose column ${first.j}: ${data.nodes[first.j].short}.`, lines: [5] },
    { title: 'Highlight the three recurrence cells', operation: firstUpdate, action: 'Highlight dist[i][j], dist[i][k], and dist[k][j].', lines: [6] },
    { title: 'Calculate the candidate route', operation: firstUpdate, action: 'Add the i→k and k→j segment costs.', lines: [6] },
    { title: 'Compare old and candidate values', operation: firstUpdate, action: 'Take the minimum of the old cell and candidate sum.', lines: [6] },
    { title: 'Accept an improving update', operation: firstUpdate, action: 'Replace dist[i][j] because the route through k is shorter.', lines: [6] },
    { title: 'Retain a non-improving cell', operation: firstReject, action: 'Keep dist[i][j] because the candidate does not improve it.', lines: [6] },
    { title: 'Advance to the next (i,j) pair', operation: secondPair, action: 'Increment j, then i after each row completes.', lines: [4, 5] },
    { title: 'Complete the current k phase', operation: endFirstK, action: `Finish all ${data.nodes.length ** 2} pairs for k=${endFirstK.k}.`, lines: [3, 4, 5, 6] },
    { title: 'Move to the next intermediate', operation: nextK, action: `Start k=${nextK.k}: ${data.nodes[nextK.k].short}.`, lines: [3] },
    { title: 'Present the final matrix', operation: final, action: `After ${operations.length} operations, compare the generated matrix with the stored result.`, lines: [7, 8] },
  ]

  const guided = selected.map((item, index) => {
    const base = operationStep(data, item.operation)
    return {
      ...base,
      id: `fw-guided-${index}`,
      phase: index < 5 ? 'Initialize' : index < 17 ? 'Dynamic programming' : 'Result',
      title: item.title,
      action: item.action,
      pseudocodeLines: item.lines,
      visualState: {
        ...base.visualState,
        floydWarshall: introVisual(item.matrix ?? item.operation.matrix, item.operation),
      },
    }
  })
  const program = {
    guided,
    full: operations.map(operation => operationStep(data, operation)),
    phaseStarts: Array.from({ length: data.nodes.length }, (_, k) => k * data.nodes.length ** 2),
  }
  programCache.set(data, program)
  return program
}
