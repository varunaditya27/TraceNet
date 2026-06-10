import { buildAlgorithmLessons, executionStepToLessonStep } from '../algorithm-lessons'
import type { AlgorithmId, GraphData } from '../graph-data'
import { generateBoyerMooreProgram } from './boyer-moore-execution'
import { generateFloydWarshallProgram } from './floyd-warshall-execution'
import { generateSCCProgram } from './scc-execution'
import type { ExecutionMode, ExecutionProgram } from './types'

export function getExecutionProgram(data: GraphData, algorithmId: AlgorithmId): ExecutionProgram {
  if (algorithmId === 'scc') return generateSCCProgram(data)
  if (algorithmId === 'boyer_moore') return generateBoyerMooreProgram(data.algorithms.boyer_moore)
  if (algorithmId === 'floyd_warshall') return generateFloydWarshallProgram(data)

  const lesson = buildAlgorithmLessons(data)[algorithmId]
  const guided = lesson.steps.map((step, index) => ({
    id: `${algorithmId}-guided-${index}`,
    algorithmId,
    phase: step.title,
    title: step.title,
    action: step.action,
    reason: step.reason,
    visualExplanation: step.visualExplanation,
    dataStructureLabel: step.dataStructureState.label,
    dataStructureState: step.dataStructureState.entries,
    calculation: step.calculation,
    takeaway: step.takeaway,
    pseudocodeLines: step.pseudocodeLines,
    visualState: step.visualState,
    operationIndex: step.operationIndex,
    phaseIndex: step.phaseIndex,
  }))
  return { guided, full: guided, phaseStarts: [0] }
}

export function getExecutionSteps(data: GraphData, algorithmId: AlgorithmId, mode: ExecutionMode) {
  const program = getExecutionProgram(data, algorithmId)
  return (mode === 'full' ? program.full : program.guided).map(executionStepToLessonStep)
}
