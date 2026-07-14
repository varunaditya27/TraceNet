import type { GraphData } from '../graph-data'
import type { ExecutionProgram, ExecutionStep, TopoVisualState } from './types'

const copy = (state: TopoVisualState): TopoVisualState => ({
  ...state,
  indegrees: [...state.indegrees], queue: [...state.queue], output: [...state.output],
  processedEdges: state.processedEdges.map(edge => [...edge] as [number, number]),
  activeEdge: state.activeEdge ? [...state.activeEdge] as [number, number] : undefined,
})

export function generateTopoProgram(data: GraphData): ExecutionProgram {
  const topo = data.algorithms.topo_sort
  const n = topo.dag_nodes.length
  const adjacency = Array.from({ length: n }, () => [] as number[])
  topo.dag_edges.forEach(([source, target]) => adjacency[source]?.push(target))
  adjacency.forEach(list => list.sort((a, b) => a - b))
  const state: TopoVisualState = { indegrees: Array(n).fill(0), queue: [], output: [], processedEdges: [] }
  const full: ExecutionStep[] = []
  const name = (id: number) => topo.dag_nodes[id] ?? `node ${id}`
  const values = () => [
    { key: 'queue (front → back)', value: `[${state.queue.map(name).join(', ')}]` },
    { key: 'output', value: `[${state.output.map(name).join(' → ')}]` },
    { key: 'emitted', value: `${state.output.length}/${n}` },
  ]
  const push = (step: Omit<ExecutionStep, 'id' | 'algorithmId' | 'operationIndex' | 'visualState'>) => {
    full.push({ ...step, id: `topo-${full.length}`, algorithmId: 'topo_sort', operationIndex: full.length, visualState: { topo: copy(state) } })
  }

  push({ phase: 'Initialize', phaseIndex: 0, title: 'Load the dependency DAG', action: 'Display genes and directed prerequisite constraints.', reason: 'Kahn’s algorithm operates on a directed graph.', visualExplanation: 'Each arrow u → v means u must be emitted before v.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'The arrows encode ordering constraints, not proven clinical chronology.', pseudocodeLines: [1] })
  state.initialized = true
  push({ phase: 'Initialize', phaseIndex: 0, title: 'Allocate zeroed in-degrees', action: 'Create one zero counter for every gene.', reason: 'Each counter will record unmet incoming prerequisites.', visualExplanation: 'Every node receives an in-degree badge containing 0.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'Allocation and edge counting are separate operations.', pseudocodeLines: [1] })
  topo.dag_edges.forEach(([source, target]) => {
    state.activeEdge = [source, target]
    state.indegrees[target] += 1
    state.edgeOutcome = 'decrement'
    push({ phase: 'Count in-degrees', phaseIndex: 0, title: `Count ${name(source)} → ${name(target)}`, action: `Increment indegree[${name(target)}] to ${state.indegrees[target]}.`, reason: 'Every incoming constraint contributes one unmet prerequisite.', visualExplanation: 'One edge turns gold and its target badge increments.', dataStructureLabel: 'Kahn state', dataStructureState: values(), calculation: `indegree[${name(target)}] = ${state.indegrees[target]}`, takeaway: `${name(target)} currently has ${state.indegrees[target]} incoming constraint${state.indegrees[target] === 1 ? '' : 's'}.`, pseudocodeLines: [1] })
  })
  state.activeEdge = undefined
  state.edgeOutcome = undefined
  push({ phase: 'Count in-degrees', phaseIndex: 0, title: 'Finish counting in-degrees', action: `Finish counting all ${topo.dag_edges.length} dependency edges.`, reason: 'The counters now equal each gene’s number of incoming constraints.', visualExplanation: 'Every badge shows its computed initial in-degree; only zero badges are cyan.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'Zero-degree genes are the only valid initial queue entries.', pseudocodeLines: [1] })
  state.indegrees.forEach((degree, id) => {
    if (degree !== 0) return
    state.queue.push(id)
    state.activeNode = id
    push({ phase: 'Initialize queue', phaseIndex: 1, title: `Enqueue initial zero-degree gene ${name(id)}`, action: `Add ${name(id)} to the back of the FIFO queue.`, reason: 'It has no unmet prerequisite.', visualExplanation: 'The zero badge turns cyan and the gene appears at the back of the visible queue.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'Initial ties are resolved by DAG node-array order.', pseudocodeLines: [2] })
  })

  while (state.queue.length) {
    const u = state.queue.shift()!
    state.activeNode = u
    state.activeEdge = undefined
    push({ phase: 'Process queue', phaseIndex: 2, title: `Dequeue ${name(u)}`, action: `Remove ${name(u)} from the front of the queue.`, reason: 'Its current in-degree is zero.', visualExplanation: 'The current gene grows amber; the queue visibly shrinks.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'Only a zero-degree gene can be emitted.', pseudocodeLines: [3, 4] })
    state.output.push(u)
    push({ phase: 'Process queue', phaseIndex: 2, title: `Emit ${name(u)}`, action: `Append ${name(u)} at output position ${state.output.length}.`, reason: 'All its prerequisites have already been emitted.', visualExplanation: `Ordinal ${state.output.length} appears inside only this newly emitted node.`, dataStructureLabel: 'Kahn state', dataStructureState: values(), calculation: `output[${state.output.length - 1}] = ${name(u)}`, takeaway: 'The output grows one gene at a time.', pseudocodeLines: [4] })
    for (const v of adjacency[u]) {
      state.activeEdge = [u, v]
      state.edgeOutcome = 'inspect'
      push({ phase: 'Process queue', phaseIndex: 2, title: `Remove constraint ${name(u)} → ${name(v)}`, action: 'Process this outgoing dependency edge.', reason: `${name(u)} is now emitted, so this prerequisite is satisfied.`, visualExplanation: 'Exactly one outgoing edge is highlighted before removal.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'Removing a constraint can unlock its target.', pseudocodeLines: [5] })
      state.indegrees[v] -= 1
      state.processedEdges.push([u, v])
      state.edgeOutcome = state.indegrees[v] === 0 ? 'unlock' : 'decrement'
      push({ phase: 'Process queue', phaseIndex: 2, title: `Decrement ${name(v)} to ${state.indegrees[v]}`, action: `Set indegree[${name(v)}] to ${state.indegrees[v]}.`, reason: 'One incoming prerequisite has been removed.', visualExplanation: state.indegrees[v] === 0 ? 'The processed edge becomes dashed and the target badge turns cyan.' : 'The processed edge becomes dashed and the target badge decreases.', dataStructureLabel: 'Kahn state', dataStructureState: values(), calculation: `indegree[${name(v)}] = ${state.indegrees[v]}`, takeaway: state.indegrees[v] === 0 ? `${name(v)} is now eligible for the queue.` : `${name(v)} still has unmet prerequisites.`, pseudocodeLines: [5, 6] })
      if (state.indegrees[v] === 0) {
        state.queue.push(v)
        push({ phase: 'Process queue', phaseIndex: 2, title: `Enqueue newly unlocked ${name(v)}`, action: `Add ${name(v)} to the back of the queue.`, reason: 'Its in-degree has just become zero.', visualExplanation: 'The target joins the queue while preserving FIFO order.', dataStructureLabel: 'Kahn state', dataStructureState: values(), takeaway: 'A gene becomes available exactly when its last prerequisite is removed.', pseudocodeLines: [6] })
      }
    }
  }

  state.activeNode = undefined
  state.activeEdge = undefined
  state.edgeOutcome = undefined
  state.complete = true
  state.hasCycle = state.output.length < n
  push({ phase: 'Validate', phaseIndex: 3, title: state.hasCycle ? 'Cycle detected' : 'Topological order complete', action: `Compare emitted count ${state.output.length} with node count ${n}.`, reason: state.hasCycle ? 'The queue emptied while some nodes still had unmet prerequisites.' : 'Every node was emitted before the queue became empty.', visualExplanation: state.hasCycle ? 'Unemitted positive-degree nodes turn red.' : 'Every node has one final ordinal and every edge is processed.', dataStructureLabel: 'Final Kahn state', dataStructureState: [...values(), { key: 'cycle detected', value: state.hasCycle ? 'Yes' : 'No' }], calculation: `${state.output.length} ${state.hasCycle ? '<' : '='} ${n}`, takeaway: state.hasCycle ? 'A topological order does not exist for a cyclic graph.' : 'The complete output is one valid topological order.', pseudocodeLines: [7, 8] })

  const compact = full.flatMap((step, index) => {
    if (step.title.startsWith('Count ') || step.title.startsWith('Remove constraint ') || step.title.startsWith('Dequeue ')) return []
    if (step.title.startsWith('Enqueue newly unlocked ')) return []
    if (step.title.startsWith('Decrement ') && !step.title.endsWith(' to 0')) return []
    if (step.title.startsWith('Decrement ') && step.title.endsWith(' to 0')) {
      const enqueue = full[index + 1]
      return [{
        ...enqueue,
        id: `${step.id}-guided-unlock`,
        title: step.title.replace('Decrement ', 'Unlock and enqueue ').replace(' to 0', ''),
        action: `${step.action} Then add the newly zero-degree gene to the back of the FIFO queue.`,
        reason: 'Its final incoming constraint was processed, so it is now eligible.',
        visualExplanation: 'The processed edge is dashed, the badge becomes cyan, and the target appears at the back of the queue.',
        calculation: step.calculation,
        pseudocodeLines: [5, 6],
      }]
    }
    return [step]
  })
  const initialQueueSteps = compact.filter(step => step.title.startsWith('Enqueue initial zero-degree gene'))
  const lastInitialQueueStep = initialQueueSteps.at(-1)
  const guided = compact
    .filter(step => !step.title.startsWith('Enqueue initial zero-degree gene') || step === lastInitialQueueStep)
    .map(step => step === lastInitialQueueStep ? {
      ...step,
      title: 'Initialize the zero-degree queue',
      action: `Enqueue every initial zero-degree gene in node-array order: ${stateNameList(step.visualState?.topo?.queue ?? [], topo.dag_nodes)}.`,
      visualExplanation: 'All initially available genes are cyan and appear from front to back in the visible FIFO queue.',
      takeaway: 'The explicit insertion order makes tie-breaking deterministic.',
    } : step)
  return { guided, full, phaseStarts: [0, full.findIndex(step => step.phase === 'Initialize queue'), full.findIndex(step => step.phase === 'Process queue'), full.length - 1] }
}

function stateNameList(ids: number[], names: string[]): string {
  return ids.map(id => names[id]).join(' → ')
}
