import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { buildAlgorithmLessons } from '../src/lib/algorithm-lessons.ts'
import {
  buildBadCharacterTable,
  generateBoyerMooreOperations,
  generateBoyerMooreProgram,
} from '../src/lib/execution/boyer-moore-execution.ts'
import {
  generateFloydWarshallOperations,
  generateFloydWarshallProgram,
} from '../src/lib/execution/floyd-warshall-execution.ts'
import { generateSCCProgram } from '../src/lib/execution/scc-execution.ts'
import { generateBFSProgram } from '../src/lib/execution/bfs-execution.ts'
import { generateTopoProgram } from '../src/lib/execution/topo-execution.ts'

const graphData = JSON.parse(
  await readFile(new URL('../public/data/hgt_graph.json', import.meta.url), 'utf8'),
)

test('BFS execution follows FIFO order and reproduces stored distances and parents', () => {
  const program = generateBFSProgram(graphData)
  const final = program.full.at(-1).visualState.bfs
  assert.deepEqual(final.distances, graphData.algorithms.bfs.distances)
  assert.deepEqual(final.parents, graphData.algorithms.bfs.parent.map(parent => parent < 0 ? null : parent))
  assert.deepEqual(final.queue, [])
  assert.equal(final.complete, true)
  assert.ok(program.full.some(step => step.visualState.bfs.edgeOutcome === 'skip'))
  assert.ok(program.guided.length < program.full.length)
})

test('Kosaraju guided execution preserves discovery order and delays final SCC reveal', () => {
  const program = generateSCCProgram(graphData)
  assert.ok(program.guided.length >= 17)
  assert.equal(program.guided[0].visualState.revealAllComponents, false)
  assert.ok(program.guided.slice(0, 12).every(step => !step.visualState.revealAllComponents))
  assert.ok(program.guided.slice(0, 9).every(step => (step.visualState.discoveredComponents ?? []).length === 0))
  assert.equal(program.guided.at(-2).visualState.revealAllComponents, true)
  assert.ok(program.full.some(step => step.visualState.graphDirection === 'transposed'))
  assert.ok(program.full.some(step => (step.visualState.currentComponent ?? []).length > 0))
  const transposeIndex = program.full.findIndex(step => step.title === 'Construct the transposed graph')
  const secondPassIndex = program.full.findIndex(step => step.title === 'Pop the next finish-order node')
  assert.deepEqual(program.phaseStarts, [0, transposeIndex, secondPassIndex])
  const clearStep = program.full.find(step => step.title === 'Clear the visited set')
  assert.deepEqual(clearStep.visualState.visitedNodes, [])
  assert.ok(program.full.some(step => step.title === 'Skip an assigned stack entry'))
  assert.ok(program.full.some(step => step.title === 'Skip an already visited target'))
  assert.ok(program.guided.every(step => step.pseudocodeLines.every(line => line >= 1 && line <= 10)))
  const completed = program.full.filter(step => step.title === 'Complete one SCC').map(step => [...step.visualState.currentComponent].sort((a, b) => a - b))
  const expected = graphData.algorithms.scc.groups.map(group => [...group].sort((a, b) => a - b))
  assert.deepEqual(completed.sort((a, b) => a[0] - b[0]), expected.sort((a, b) => a[0] - b[0]))
})

test('Kahn execution processes every edge, preserves FIFO order, and detects cycles', () => {
  const program = generateTopoProgram(graphData)
  const final = program.full.at(-1).visualState.topo
  assert.deepEqual(final.output.map(id => graphData.algorithms.topo_sort.dag_nodes[id]), graphData.algorithms.topo_sort.order)
  assert.equal(final.processedEdges.length, graphData.algorithms.topo_sort.dag_edges.length)
  assert.ok(final.indegrees.every(degree => degree === 0))
  assert.equal(final.hasCycle, false)
  assert.ok(program.guided.length < program.full.length)
  assert.ok(program.full.some(step => step.visualState.topo.edgeOutcome === 'unlock'))

  const cyclic = structuredClone(graphData)
  cyclic.algorithms.topo_sort.dag_edges.push([7, 4])
  const cyclicFinal = generateTopoProgram(cyclic).full.at(-1).visualState.topo
  assert.equal(cyclicFinal.hasCycle, true)
  assert.ok(cyclicFinal.output.length < cyclic.algorithms.topo_sort.dag_nodes.length)
})

test('Boyer-Moore uses a substantially shorter pattern and computes safe shifts', () => {
  const input = graphData.algorithms.boyer_moore
  assert.ok(input.parent_text.length >= input.pattern.length * 8)
  const table = buildBadCharacterTable(input.pattern)
  const operations = generateBoyerMooreOperations(input.parent_text, input.pattern)
  const mismatch = operations.find(operation => operation.kind === 'mismatch')
  assert.ok(mismatch)
  assert.equal(mismatch.lastOccurrence, table[mismatch.mismatchCharacter] ?? -1)
  assert.equal(mismatch.shift, Math.max(1, mismatch.patternIndex - mismatch.lastOccurrence))
  assert.deepEqual(
    operations.filter(operation => operation.kind === 'match').map(operation => operation.alignment),
    input.matches,
  )
  assert.equal(operations.at(-1).comparisons, input.comparisons_bm)
  const program = generateBoyerMooreProgram(input)
  assert.ok(program.guided.length >= 15)
  const firstMatchIndex = operations.findIndex(operation => operation.kind === 'match')
  const postMatchShift = operations[firstMatchIndex + 1]
  const nextCharacter = input.parent_text[postMatchShift.alignment + input.pattern.length]
  assert.equal(postMatchShift.shift, Math.max(1, input.pattern.length - (table[nextCharacter] ?? -1)))
  assert.equal(postMatchShift.nextAlignment, postMatchShift.alignment + postMatchShift.shift)
  const searchStates = program.guided.filter(step => step.phase === 'Search').map(step => step.visualState.boyerMoore)
  assert.ok(searchStates.every((state, index) => index === 0 || state.alignment >= searchStates[index - 1].alignment))
  assert.ok(searchStates.every((state, index) => index === 0 || state.comparisons >= searchStates[index - 1].comparisons))
  assert.equal(program.guided.at(-1).visualState.boyerMoore.stage, 'result')
  assert.deepEqual(program.guided.at(-1).visualState.boyerMoore.matches, input.matches)
  assert.equal(input.text_length, 813)
  assert.equal(input.pattern_source_offset, 137)
  assert.deepEqual(input.matches, [137])

  const noMatchInput = { ...input, parent_text: 'AAAAAAAA', text_length: 8, pattern: 'TT', pattern_length: 2, matches: [], comparisons_bm: 4, comparisons_naive: 7, speedup: 1.75 }
  assert.doesNotThrow(() => generateBoyerMooreProgram(noMatchInput))
  assert.deepEqual(generateBoyerMooreProgram(noMatchInput).guided.at(-1).visualState.boyerMoore.matches, [])
  const immediateMatchInput = { ...input, parent_text: 'AAAAA', text_length: 5, pattern: 'AAA', pattern_length: 3, matches: [0, 1, 2], comparisons_bm: 9, comparisons_naive: 9, speedup: 1 }
  assert.doesNotThrow(() => generateBoyerMooreProgram(immediateMatchInput))
})

test('Floyd-Warshall exposes all V cubed operations and reaches the stored matrix', () => {
  const operations = generateFloydWarshallOperations(graphData)
  assert.equal(operations.length, graphData.nodes.length ** 3)
  const finalMatrix = operations.at(-1).matrix
  graphData.algorithms.floyd_warshall.dist_matrix.forEach((row, i) => {
    row.forEach((expected, j) => {
      const actual = finalMatrix[i][j]
      if (expected === null) assert.equal(actual, null)
      else assert.ok(Math.abs(actual - expected) < 0.0002, `${i},${j}: ${actual} != ${expected}`)
    })
  })
  const program = generateFloydWarshallProgram(graphData)
  assert.equal(program.full.length, 4096)
  assert.equal(program.phaseStarts.length, 16)
  assert.ok(program.guided.length >= 17)
})

test('all eight algorithms provide at least ten educational guided steps', () => {
  const lessons = buildAlgorithmLessons(graphData)
  Object.values(lessons).forEach(lesson => {
    assert.ok(lesson.steps.length >= 10, `${lesson.id} has only ${lesson.steps.length} steps`)
    lesson.steps.forEach(step => {
      assert.ok(step.title)
      assert.ok(step.action)
      assert.ok(step.reason)
      assert.ok(step.visualExplanation)
      assert.ok(step.takeaway)
      assert.ok(step.pseudocodeLines.length > 0)
    })
  })
})
