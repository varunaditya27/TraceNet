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
  nextAlignment?: number
  matchedPatternIndices?: number[]
  shiftReason?: 'mismatch' | 'match'
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
        matchedPatternIndices: isMatch
          ? Array.from({ length: pattern.length - patternIndex }, (_, offset) => patternIndex + offset)
          : Array.from({ length: pattern.length - patternIndex - 1 }, (_, offset) => patternIndex + 1 + offset),
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
        matchedPatternIndices: Array.from({ length: pattern.length }, (_, index) => index),
      })
      const nextCharacter = parentText[alignment + pattern.length]
      const shift = nextCharacter === undefined
        ? 1
        : Math.max(1, pattern.length - (table[nextCharacter] ?? -1))
      operations.push({ kind: 'shift', alignment, nextAlignment: alignment + shift, mismatchCharacter: nextCharacter, lastOccurrence: table[nextCharacter] ?? -1, shift, shiftReason: 'match', comparisons, matches: [...matches], matchedPatternIndices: Array.from({ length: pattern.length }, (_, index) => index) })
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
        matchedPatternIndices: Array.from({ length: pattern.length - patternIndex - 1 }, (_, offset) => patternIndex + 1 + offset),
      })
      operations.push({ kind: 'shift', alignment, nextAlignment: alignment + shift, patternIndex, textIndex: alignment + patternIndex, mismatchCharacter, lastOccurrence, shift, shiftReason: 'mismatch', comparisons, matches: [...matches], matchedPatternIndices: Array.from({ length: pattern.length - patternIndex - 1 }, (_, offset) => patternIndex + 1 + offset) })
      alignment += shift
    }
  }
  return operations
}

function visual(input: BoyerMooreInput, operation: BoyerMooreOperation, stage: BoyerMooreVisualState['stage'] = 'search'): BoyerMooreVisualState {
  return {
    geneName: input.gene_name,
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
    stage,
    nextAlignment: operation.nextAlignment,
    matchedPatternIndices: operation.matchedPatternIndices,
    naiveComparisons: input.comparisons_naive,
    speedup: input.speedup,
    patternSourceOffset: input.pattern_source_offset,
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
  const calculation = operation.shift === undefined ? undefined : operation.shiftReason === 'match'
    ? operation.mismatchCharacter === undefined
      ? 'match ends at the final searchable position; advance by 1 and stop'
      : `post-match shift = max(1, ${input.pattern.length} - ${operation.lastOccurrence ?? -1}) = ${operation.shift}`
    : `mismatch shift = max(1, ${operation.patternIndex} - ${operation.lastOccurrence ?? -1}) = ${operation.shift}`
  return {
    id: `bm-operation-${index}`,
    algorithmId: 'boyer_moore',
    phase: 'Full character execution',
    title,
    action: operation.kind === 'compare'
      ? `Compare pattern[${operation.patternIndex}] with parent[${operation.textIndex}] from right to left.`
      : operation.kind === 'shift'
        ? `Move the pattern ${operation.shift} cells, from alignment ${operation.alignment} to ${operation.nextAlignment}.`
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
      { key: 'alignment', value: operation.nextAlignment === undefined ? String(operation.alignment) : `${operation.alignment} → ${operation.nextAlignment}` },
      { key: 'comparisons', value: String(operation.comparisons) },
      { key: 'matches', value: operation.matches.join(', ') || '∅' },
      { key: 'last occurrence', value: operation.lastOccurrence === undefined ? '—' : String(operation.lastOccurrence) },
    ],
    calculation,
    takeaway: operation.kind === 'shift'
      ? `The search advances by ${operation.shift}, not merely one position.`
      : 'Only a full right-to-left agreement becomes a reported match.',
    pseudocodeLines: operation.kind === 'compare' ? [4, 5] : operation.kind === 'mismatch' ? [6] : operation.kind === 'shift' ? [operation.shiftReason === 'match' ? 7 : 6] : operation.kind === 'match' ? [7] : [2, 3],
    visualState: { boyerMoore: visual(input, operation) },
    operationIndex: index,
  }
}

export function generateBoyerMooreProgram(input: BoyerMooreInput): ExecutionProgram {
  const cached = programCache.get(input)
  if (cached) return cached
  const operations = generateBoyerMooreOperations(input.parent_text, input.pattern)
  const at = (predicate: (operation: BoyerMooreOperation) => boolean) => operations.findIndex(predicate)
  const firstAlignIndex = at(operation => operation.kind === 'align')
  const selected = new Map<number, string>()
  const select = (index: number, title: string) => { if (index >= 0 && index < operations.length && !selected.has(index)) selected.set(index, title) }
  select(firstAlignIndex, 'Place the pattern at alignment zero')
  operations.map((operation, index) => ({ operation, index })).filter(({ operation }) => operation.kind === 'mismatch').slice(0, 2).forEach(({ index }, mismatchNumber) => {
    select(index - 1, `Encounter mismatch ${mismatchNumber + 1}`)
    select(index, `Look up bad character ${mismatchNumber + 1}`)
    const shiftIndex = operations.findIndex((operation, candidate) => candidate > index && operation.kind === 'shift')
    select(shiftIndex, `Apply safe shift ${mismatchNumber + 1}`)
    select(operations.findIndex((operation, candidate) => candidate > shiftIndex && operation.kind === 'align'), 'Try the next candidate alignment')
  })
  const matchIndices = operations.map((operation, index) => ({ operation, index })).filter(({ operation }) => operation.kind === 'match').slice(0, 2)
  const firstMatchOperationIndex = matchIndices[0]?.index ?? -1
  const firstMatchAlignIndex = firstMatchOperationIndex < 0
    ? -1
    : operations.map((operation, index) => ({ operation, index })).filter(({ operation, index }) => index < firstMatchOperationIndex && operation.kind === 'align').at(-1)?.index ?? -1
  const earlySearchEnd = Math.max(...selected.keys())
  const bridgeMismatchIndex = operations.findIndex((operation, index) => index > earlySearchEnd && index < firstMatchAlignIndex && operation.kind === 'mismatch')
  const bridgeShiftIndex = operations.findIndex((operation, index) => index > bridgeMismatchIndex && index < firstMatchAlignIndex && operation.kind === 'shift')
  select(bridgeMismatchIndex - 1, 'Compare at the current candidate')
  select(bridgeMismatchIndex, 'Explain the current mismatch')
  select(bridgeShiftIndex, 'Apply the justified shift')
  const interveningAlignments = operations
    .map((operation, index) => ({ operation, index }))
    .filter(({ operation, index }) => operation.kind === 'align' && index > earlySearchEnd && index < firstMatchAlignIndex)
  const checkpointCount = Math.min(4, interveningAlignments.length)
  const checkpointPositions = new Set(Array.from({ length: checkpointCount }, (_, checkpoint) =>
    checkpointCount === 1 ? 0 : Math.round((checkpoint * (interveningAlignments.length - 1)) / (checkpointCount - 1)),
  ))
  ;[...checkpointPositions].forEach((position, checkpoint) => {
    const alignIndex = interveningAlignments[position]?.index ?? -1
    const mismatchIndex = operations.findIndex((operation, index) => index > alignIndex && index < firstMatchAlignIndex && operation.kind === 'mismatch')
    const shiftIndex = operations.findIndex((operation, index) => index > mismatchIndex && index < firstMatchAlignIndex && operation.kind === 'shift')
    select(alignIndex, `Traversal checkpoint ${checkpoint + 1} of ${checkpointPositions.size}`)
    select(mismatchIndex - 1, `Compare at checkpoint ${checkpoint + 1}`)
    select(mismatchIndex, `Explain checkpoint mismatch ${checkpoint + 1}`)
    select(shiftIndex, `Apply checkpoint shift ${checkpoint + 1}`)
  })
  matchIndices.forEach(({ operation, index }, matchNumber) => {
    const preceding = operations.map((candidate, candidateIndex) => ({ candidate, candidateIndex })).filter(({ candidate, candidateIndex }) => candidateIndex < index && candidate.kind === 'align').at(-1)?.candidateIndex ?? firstAlignIndex
    select(preceding, 'Reach the candidate containing the pattern')
    const successfulComparisons = operations
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(({ candidate, candidateIndex }) => candidateIndex < index && candidate.kind === 'compare' && candidate.alignment === operation.alignment)
    const comparisonPositions = new Set([0, Math.floor(successfulComparisons.length / 3), Math.floor((2 * successfulComparisons.length) / 3), successfulComparisons.length - 1])
    ;[...comparisonPositions].filter(position => position >= 0).sort((left, right) => left - right).forEach((position, comparisonNumber, positions) => {
      const comparison = successfulComparisons[position]
      select(comparison?.candidateIndex ?? -1, comparisonNumber === 0
        ? 'Match the rightmost character'
        : comparisonNumber === positions.length - 1
          ? 'Complete the right-to-left scan'
          : `Continue matching right to left (${comparisonNumber + 1}/${positions.length})`)
    })
    select(index, `Reveal and record match ${matchNumber + 1}`)
    select(operations.findIndex((candidate, candidateIndex) => candidateIndex > index && candidate.kind === 'shift'), 'Shift safely after the match')
  })
  const chronological = [...selected.entries()].sort(([left], [right]) => left - right)
  const prepStages: Array<[BoyerMooreVisualState['stage'], string, string, number[]]> = [
    ['load', 'Load the parent DNA text', `Load ${input.parent_text.length} bp of ${input.gene_name} reference sequence.`, [1]],
    ['pattern', 'Select the query pattern', `Use the ${input.pattern.length} bp substring sampled from parent offset ${input.pattern_source_offset ?? 'unknown'}; this guarantees one known validation match without duplicating the parent.`, [1]],
    ['table', 'Build the bad-character table', 'Store the rightmost query index for each DNA character.', [1]],
  ]
  const guided: ExecutionStep[] = prepStages.map(([stage, title, action, lines], index) => {
    const base = operationStep(input, operations[firstAlignIndex], index)
    return { ...base, id: `bm-guided-prep-${index}`, phase: 'Prepare', title, action, visualExplanation: stage === 'load' ? 'Only the parent sequence window is introduced.' : stage === 'pattern' ? 'The shorter query appears separately before alignment.' : 'The completed table appears; no search comparison has started.', pseudocodeLines: lines, visualState: { boyerMoore: visual(input, operations[firstAlignIndex], stage) } }
  })
  chronological.forEach(([operationIndex, title], index) => {
    const operation = operations[operationIndex]
    const base = operationStep(input, operation, guided.length)
    const previousIndex = index === 0 ? operationIndex : chronological[index - 1][0]
    guided.push({ ...base, id: `bm-guided-search-${index}`, phase: 'Search', title, action: operation.kind === 'align' && operationIndex - previousIndex > 1 ? `Jump ahead in this guided summary to candidate alignment ${operation.alignment}; full mode contains every intervening mismatch and shift.` : base.action, visualState: { boyerMoore: visual(input, operation, operation.kind === 'align' ? 'align' : 'search') } })
  })
  const finalOperation = { ...operations.at(-1)!, alignment: operations.at(-1)!.nextAlignment ?? operations.at(-1)!.alignment, nextAlignment: undefined }
  const finalBase = operationStep(input, finalOperation, guided.length)
  guided.push({ ...finalBase, id: 'bm-guided-result', phase: 'Result', title: 'Compare with naive search', action: `Compare ${input.comparisons_bm} bad-character Boyer-Moore comparisons with ${input.comparisons_naive} naive comparisons.`, reason: 'Both methods search the same parent and query and report the same zero-based matches.', visualExplanation: 'A final summary compares work and marks both match offsets on the complete parent sequence.', calculation: `${input.comparisons_naive} / ${input.comparisons_bm} = ${input.speedup.toFixed(2)}×`, takeaway: `The bad-character-only search used ${input.speedup.toFixed(2)}× fewer character comparisons on this input.`, pseudocodeLines: [8], visualState: { boyerMoore: visual(input, finalOperation, 'result') } })

  // Keep the guided tour concise by omitting the requested one-based step ranges.
  const omittedGuidedSteps = new Set([18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])
  const conciseGuided = guided.filter((_, index) => !omittedGuidedSteps.has(index + 1))

  const full = operations.map((operation, index) => operationStep(input, operation, index))
  const firstMatchIndex = operations.findIndex(operation => operation.kind === 'match')
  const secondMatchIndex = operations.findIndex((operation, index) => index > firstMatchIndex && operation.kind === 'match')
  const program = { guided: conciseGuided, full, phaseStarts: [0, firstMatchIndex, secondMatchIndex, full.length - 1].filter(index => index >= 0) }
  programCache.set(input, program)
  return program
}
