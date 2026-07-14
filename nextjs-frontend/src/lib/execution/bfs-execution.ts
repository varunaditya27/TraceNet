import type { GraphData } from '../graph-data'
import type { BFSVisualState, ExecutionProgram, ExecutionStep } from './types'

const snapshot = (state: BFSVisualState): BFSVisualState => ({
  ...state,
  queue: [...state.queue],
  distances: [...state.distances],
  parents: [...state.parents],
  discovered: [...state.discovered],
  processed: [...state.processed],
  activeEdge: state.activeEdge ? [...state.activeEdge] as [number, number] : undefined,
})

export function generateBFSProgram(data: GraphData): ExecutionProgram {
  const source = data.algorithms.bfs.source
  const name = (id: number) => data.nodes[id]?.short ?? `node ${id}`
  const adjacency = Array.from({ length: data.nodes.length }, () => [] as number[])
  data.edges.forEach(edge => adjacency[edge.src]?.push(edge.tgt))
  adjacency.forEach(neighbors => neighbors.sort((a, b) => a - b))

  const state: BFSVisualState = {
    queue: [], distances: Array(data.nodes.length).fill(-1), parents: Array(data.nodes.length).fill(null),
    discovered: [], processed: [],
  }
  const full: ExecutionStep[] = []
  const push = (step: Omit<ExecutionStep, 'id' | 'algorithmId' | 'operationIndex' | 'visualState'>) => {
    full.push({ ...step, id: `bfs-${full.length}`, algorithmId: 'bfs', operationIndex: full.length, visualState: { bfs: snapshot(state) } })
  }
  const entries = () => [
    { key: 'queue (front → back)', value: `[${state.queue.map(name).join(', ')}]` },
    { key: 'discovered', value: String(state.discovered.length) },
    { key: 'processed', value: String(state.processed.length) },
  ]

  push({ phase: 'Initialize', phaseIndex: 0, title: 'Initialize BFS state', action: 'Set every distance to -1 and every parent to null.', reason: '-1 distinguishes nodes that have not been reached.', visualExplanation: 'The complete graph is visible; no node is active yet.', dataStructureLabel: 'BFS state', dataStructureState: entries(), takeaway: 'Traversal begins with no assumed reachability.', pseudocodeLines: [1] })
  state.distances[source] = 0
  state.queue.push(source)
  state.discovered.push(source)
  state.activeNode = source
  push({ phase: 'Initialize', phaseIndex: 0, title: `Enqueue source ${name(source)}`, action: `Set dist[${source}] = 0 and enqueue ${name(source)}.`, reason: 'The source is zero transfers from itself and is the first frontier.', visualExplanation: 'The source grows amber and appears at the front of the visible FIFO queue.', dataStructureLabel: 'BFS state', dataStructureState: entries(), calculation: `dist[${source}] = 0`, takeaway: 'The source is BFS layer zero.', pseudocodeLines: [2, 3] })

  while (state.queue.length) {
    const u = state.queue.shift()!
    state.activeNode = u
    state.activeEdge = undefined
    state.edgeOutcome = undefined
    push({ phase: 'Traverse', phaseIndex: 1, title: `Dequeue ${name(u)}`, action: `Remove ${name(u)} from the front of the queue.`, reason: 'BFS expands nodes in FIFO order.', visualExplanation: `${name(u)} is outlined amber as the node whose outgoing edges are being scanned.`, dataStructureLabel: 'BFS state', dataStructureState: entries(), takeaway: 'Only the dequeued node is the current frontier.', pseudocodeLines: [4, 5] })

    for (const v of adjacency[u]) {
      state.activeEdge = [u, v]
      state.edgeOutcome = 'inspect'
      push({ phase: 'Traverse', phaseIndex: 1, title: `Inspect ${name(u)} → ${name(v)}`, action: `Read the directed edge from ${name(u)} to ${name(v)}.`, reason: 'Only outgoing edges can carry the traversal forward.', visualExplanation: 'Exactly one directed edge is highlighted gold while its target is tested.', dataStructureLabel: 'BFS state', dataStructureState: entries(), takeaway: 'Direction matters: an incoming edge is not traversed backward.', pseudocodeLines: [6] })
      if (state.distances[v] === -1) {
        state.distances[v] = state.distances[u] + 1
        state.parents[v] = u
        state.queue.push(v)
        state.discovered.push(v)
        state.edgeOutcome = 'discover'
        push({ phase: 'Traverse', phaseIndex: 1, title: `Discover ${name(v)}`, action: `Set its parent to ${name(u)}, assign distance ${state.distances[v]}, and enqueue it.`, reason: 'The first discovery in BFS is a minimum-hop path.', visualExplanation: 'The target turns teal, the parent edge becomes a teal BFS-tree edge, and the queue visibly grows.', dataStructureLabel: 'BFS state', dataStructureState: entries(), calculation: `dist[${v}] = dist[${u}] + 1 = ${state.distances[v]}`, takeaway: `${name(v)} is first reached in layer ${state.distances[v]}.`, pseudocodeLines: [7] })
      } else {
        state.edgeOutcome = 'skip'
        push({ phase: 'Traverse', phaseIndex: 1, title: `Skip discovered ${name(v)}`, action: `Do not enqueue ${name(v)} again.`, reason: `Its distance is already ${state.distances[v]}, so another route cannot be its first or shorter BFS discovery.`, visualExplanation: 'The inspected edge turns muted red briefly; the queue and parent tree do not change.', dataStructureLabel: 'BFS state', dataStructureState: entries(), takeaway: 'Visited state prevents repeated work.', pseudocodeLines: [7] })
      }
    }
    state.processed.push(u)
  }

  state.activeNode = undefined
  state.activeEdge = undefined
  state.edgeOutcome = undefined
  state.complete = true
  const unreachable = state.distances.map((distance, id) => distance < 0 ? id : -1).filter(id => id >= 0)
  push({ phase: 'Complete', phaseIndex: 2, title: 'BFS complete', action: 'Return the distance and parent arrays after the queue becomes empty.', reason: 'Every reachable node has now been discovered and expanded.', visualExplanation: 'BFS-tree edges remain teal, finite hop labels are shown, and unreachable nodes receive an infinity label.', dataStructureLabel: 'Final BFS state', dataStructureState: [
    { key: 'queue', value: '[]' },
    { key: 'reachable', value: `${state.discovered.length}/${data.nodes.length}` },
    { key: 'unreachable', value: unreachable.map(name).join(', ') || 'none' },
  ], takeaway: 'Finite labels give minimum hops; infinity means no directed path from this source.', pseudocodeLines: [8] })

  // Guided mode retains every real queue mutation and discovery, but omits repetitive
  // edge-inspection/skip frames. Full mode exposes every operation.
  const guided = full.filter(step => step.phase !== 'Traverse' || step.title.startsWith('Dequeue') || step.title.startsWith('Discover'))
  return { guided, full, phaseStarts: [0, 2, full.length - 1] }
}
