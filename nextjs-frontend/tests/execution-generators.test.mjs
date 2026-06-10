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

const graphData = JSON.parse(
  await readFile(new URL('../public/data/hgt_graph.json', import.meta.url), 'utf8'),
)

test('Kosaraju guided execution preserves discovery order and delays final SCC reveal', () => {
  const program = generateSCCProgram(graphData)
  assert.ok(program.guided.length >= 17)
  assert.equal(program.guided[0].visualState.revealAllComponents, false)
  assert.ok(program.guided.slice(0, 12).every(step => !step.visualState.revealAllComponents))
  assert.ok(program.guided.slice(0, 9).every(step => (step.visualState.discoveredComponents ?? []).length === 0))
  assert.equal(program.guided.at(-2).visualState.revealAllComponents, true)
  assert.ok(program.full.some(step => step.visualState.graphDirection === 'transposed'))
  assert.ok(program.full.some(step => (step.visualState.currentComponent ?? []).length > 0))
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
  assert.ok(generateBoyerMooreProgram(input).guided.length >= 15)
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
