import type { AlgorithmId } from '../graph-data'

export type ExecutionMode = 'guided' | 'full'
export type GraphDirection = 'original' | 'transposed'

export interface DataStateEntry {
  key: string
  value: string
}

export interface AlgorithmVisualState {
  graphDirection?: GraphDirection
  activeNode?: number
  activeEdge?: [number, number]
  visitedNodes?: number[]
  recursionStack?: number[]
  finishStack?: number[]
  currentComponent?: number[]
  discoveredComponents?: number[][]
  revealAllComponents?: boolean
  boyerMoore?: BoyerMooreVisualState
  floydWarshall?: FloydWarshallVisualState
}

export interface ExecutionStep {
  id: string
  algorithmId: AlgorithmId
  phase: string
  title: string
  action: string
  reason: string
  visualExplanation: string
  dataStructureLabel: string
  dataStructureState: DataStateEntry[]
  calculation?: string
  takeaway: string
  pseudocodeLines: number[]
  visualState?: AlgorithmVisualState
  operationIndex?: number
  phaseIndex?: number
}

export interface BoyerMooreVisualState {
  parentText: string
  pattern: string
  alignment: number
  patternIndex?: number
  textIndex?: number
  comparison?: 'match' | 'mismatch' | 'complete'
  mismatchCharacter?: string
  lastOccurrence?: number
  shift?: number
  comparisons: number
  matches: number[]
  badCharacterTable: Record<string, number>
}

export interface FloydWarshallVisualState {
  matrix: (number | null)[][]
  k?: number
  i?: number
  j?: number
  oldValue?: number | null
  firstSegment?: number | null
  secondSegment?: number | null
  candidate?: number | null
  selectedValue?: number | null
  updated?: boolean
}

export interface ExecutionProgram {
  guided: ExecutionStep[]
  full: ExecutionStep[]
  phaseStarts?: number[]
}
