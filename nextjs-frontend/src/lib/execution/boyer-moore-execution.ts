import type { BMResult } from '../graph-data'
import type { BoyerMooreVisualState, ExecutionProgram, ExecutionStep } from './types'

export interface BoyerMooreInput extends BMResult {
  parent_text: string
}

const programCache = new WeakMap<BoyerMooreInput, ExecutionProgram>()

export interface BoyerMooreOperation {
  kind: 'align' | 'compare' | 'mismatch' | 'shift' | 'match'
  alignment: number
  patternIndex?: number
  textIndex?: number
  comparison?: 'match' | 'mismatch' | 'complete'
  mismatchCharacter?: string
  lastOccurrence?: number
  shift?: number
  comparisons: number
  matches: number[]
}

export function buildBadCharacterTable(pattern: string): Record<string, number> {
  const table: Record<string, number> = { A: -1, C: -1, G: -1, T: -1 }
  pattern.split('').forEach((character, index) => { table[character] = index })
  return table
}

export function generateBoyerMooreOperations(parentText: string, pattern: string): BoyerMooreOperation[] {
  if (!parentText || !pattern) {
    throw new Error('Boyer-Moore execution requires both a parent DNA sequence and a pattern')
  }
  if (pattern.length > parentText.length) {
    throw new Error('Boyer-Moore pattern cannot be longer than the parent DNA sequence')
  }
  const table = buildBadCharacterTable(pattern)
  const operations: BoyerMooreOperation[] = []
  const matches: number[] = []
  let comparisons = 0
  let alignment = 0

  while (alignment <= parentText.length - pattern.length) {
    operations.push({ kind: 'align', alignment, comparisons, matches: [...matches] })
    let patternIndex = pattern.length - 1
    while (patternIndex >= 0) {
      const textIndex = alignment + patternIndex
      comparisons += 1
      const isMatch = pattern[patternIndex] === parentText[textIndex]
      operations.push({
        kind: 'compare',
        alignment,
        patternIndex,
        textIndex,
        comparison: isMatch ? 'match' : 'mismatch',
        comparisons,
        matches: [...matches],
      })
      if (!isMatch) break
      patternIndex -= 1
    }
    if (patternIndex < 0) {
      matches.push(alignment)
      operations.push({
        kind: 'match',
        alignment,
        patternIndex: 0,
        textIndex: alignment,
        comparison: 'complete',
        comparisons,
        matches: [...matches],
      })
      const nextCharacter = parentText[alignment + pattern.length]
      const shift = nextCharacter === undefined
        ? 1
        : Math.max(1, pattern.length - (table[nextCharacter] ?? -1) - 1)
      operations.push({ kind: 'shift', alignment, mismatchCharacter: nextCharacter, lastOccurrence: table[nextCharacter] ?? -1, shift, comparisons, matches: [...matches] })
      alignment += shift
    } else {
      const mismatchCharacter = parentText[alignment + patternIndex]
      const lastOccurrence = table[mismatchCharacter] ?? -1
      const shift = Math.max(1, patternIndex - lastOccurrence)
      operations.push({
        kind: 'mismatch',
        alignment,
        patternIndex,
        textIndex: alignment + patternIndex,
        comparison: 'mismatch',
        mismatchCharacter,
        lastOccurrence,
        shift,
        comparisons,
        matches: [...matches],
      })
      operations.push({ kind: 'shift', alignment, mismatchCharacter, lastOccurrence, shift, comparisons, matches: [...matches] })
      alignment += shift
    }
  }
  return operations
}

function visual(input: BoyerMooreInput, operation: BoyerMooreOperation): BoyerMooreVisualState {
  return {
    parentText: input.parent_text,
    pattern: input.pattern,
    alignment: operation.alignment,
    patternIndex: operation.patternIndex,
    textIndex: operation.textIndex,
    comparison: operation.comparison,
    mismatchCharacter: operation.mismatchCharacter,
    lastOccurrence: operation.lastOccurrence,
    shift: operation.shift,
    comparisons: operation.comparisons,
    matches: operation.matches,
    badCharacterTable: buildBadCharacterTable(input.pattern),
  }
}

function operationStep(input: BoyerMooreInput, operation: BoyerMooreOperation, index: number): ExecutionStep {
  const title = {
    align: 'Place the pattern at the next alignment',
    compare: operation.comparison === 'match' ? 'Characters match' : 'Characters mismatch',
    mismatch: 'Apply the bad-character lookup',
    shift: 'Shift the complete pattern',
    match: 'Record a complete match',
  }[operation.kind]
  const calculation = operation.shift === undefined
    ? undefined
    : `shift = max(1, ${operation.patternIndex ?? input.pattern.length} - ${operation.lastOccurrence ?? -1}) = ${operation.shift}`
  return {
    id: `bm-operation-${index}`,
    algorithmId: 'boyer_moore',
    phase: 'Full character execution',
    title,
    action: operation.kind === 'compare'
      ? `Compare pattern[${operation.patternIndex}] with parent[${operation.textIndex}] from right to left.`
      : operation.kind === 'shift'
        ? `Move the pattern ${operation.shift} character cells to the right.`
        : operation.kind === 'mismatch'
          ? `Look up ${operation.mismatchCharacter} in the bad-character table.`
          : operation.kind === 'match'
            ? `Append alignment ${operation.alignment} to the match list.`
            : `Align pattern position 0 with parent position ${operation.alignment}.`,
    reason: operation.kind === 'shift'
      ? 'Every skipped alignment is impossible under the bad-character rule.'
      : 'Boyer-Moore compares from the pattern’s right edge so a mismatch can justify a large jump.',
    visualExplanation: 'The sliding window keeps the active parent and pattern cells visible; ✓ and × supplement color.',
    dataStructureLabel: 'Boyer-Moore state',
    dataStructureState: [
      { key: 'alignment', value: String(operation.alignment) },
      { key: 'comparisons', value: String(operation.comparisons) },
      { key: 'matches', value: operation.matches.join(', ') || '∅' },
      { key: 'last occurrence', value: operation.lastOccurrence === undefined ? '—' : String(operation.lastOccurrence) },
    ],
    calculation,
    takeaway: operation.kind === 'shift'
      ? `The search advances by ${operation.shift}, not merely one position.`
      : 'Only a full right-to-left agreement becomes a reported match.',
    pseudocodeLines: operation.kind === 'compare' ? [4, 5] : operation.kind === 'mismatch' || operation.kind === 'shift' ? [6] : operation.kind === 'match' ? [7] : [2, 3],
    visualState: { boyerMoore: visual(input, operation), activeNode: 0 },
    operationIndex: index,
  }
}

export function generateBoyerMooreProgram(input: BoyerMooreInput): ExecutionProgram {
  const cached = programCache.get(input)
  if (cached) return cached
  const operations = generateBoyerMooreOperations(input.parent_text, input.pattern)
  const firstAlignment = operations.find(operation => operation.kind === 'align')!
  const firstComparison = operations.find(operation => operation.kind === 'compare')!
  const firstMismatch = operations.find(operation => operation.kind === 'mismatch')!
  const firstShift = operations.find(operation => operation.kind === 'shift')!
  const comparisonAfterShift = operations.find(operation => operation.kind === 'compare' && operation.alignment > 0) ?? firstComparison
  const firstMatch = operations.find(operation => operation.kind === 'match')!
  const secondAlignment = operations.find(operation => operation.kind === 'align' && operation.alignment > firstMatch.alignment) ?? firstAlignment
  const finalOperation = operations.at(-1)!
  const selected = [
    firstAlignment, firstAlignment, firstAlignment, firstAlignment, firstComparison,
    firstComparison, firstMismatch, firstMismatch, firstShift, firstShift,
    comparisonAfterShift, firstMatch, firstMatch, secondAlignment, finalOperation,
  ]
  const titles = [
    'Load the parent DNA text',
    'Select a shorter resistance pattern',
    'Build the bad-character table',
    'Place the pattern at alignment zero',
    'Start at the rightmost pattern character',
    'Compare one aligned character pair',
    'Detect a mismatch',
    'Look up the mismatch character',
    'Calculate the safe shift',
    'Move the whole pattern',
    'Continue comparing right to left',
    'Detect a complete match',
    'Record the match position',
    'Continue searching the remaining text',
    'Compare Boyer-Moore with naive search',
  ]
  const guided = selected.map((operation, index) => {
    const base = operationStep(input, operation, index)
    return {
      ...base,
      id: `bm-guided-${index}`,
      phase: index < 3 ? 'Prepare' : index < 14 ? 'Search' : 'Result',
      title: titles[index],
      action: index === 0
        ? `Load ${input.parent_text.length} bp of real ${input.gene_name} FASTA sequence as the parent text.`
        : index === 1
          ? `Use the ${input.pattern.length} bp query, only ${(input.pattern.length / input.parent_text.length * 100).toFixed(1)}% of the parent length.`
          : index === 2
            ? 'Store the rightmost pattern index for A, C, G, and T.'
            : index === 14
              ? `Report ${input.comparisons_bm} Boyer-Moore comparisons versus ${input.comparisons_naive} naive comparisons.`
              : base.action,
      calculation: index === 1
        ? `${input.parent_text.length} / ${input.pattern.length} = ${(input.parent_text.length / input.pattern.length).toFixed(1)}× longer parent text`
        : base.calculation,
      takeaway: index === 0 || index === 1
        ? 'The pattern is visibly and substantially shorter than the parent sequence.'
        : base.takeaway,
    }
  })
  const program = { guided, full: operations.map((operation, index) => operationStep(input, operation, index)), phaseStarts: [0] }
  programCache.set(input, program)
  return program
}
