import type { AlgorithmId, GraphData } from './graph-data'
import { generateSCCProgram } from './execution/scc-execution.ts'
import { generateBoyerMooreProgram } from './execution/boyer-moore-execution.ts'
import { generateFloydWarshallProgram } from './execution/floyd-warshall-execution.ts'
import { computeSubgraphGreedy } from './execution/bnb-subgraph-greedy'
import type { AlgorithmVisualState, ExecutionStep } from './execution/types'

export type LessonTab = 'overview' | 'execution' | 'data-structures' | 'pseudocode' | 'result'

export interface DataStructureExplanation {
  name: string
  purpose: string
  representation: string
}

export interface DataStructureState {
  label: string
  entries: { key: string; value: string }[]
}

export interface PseudocodeLine {
  line: number
  code: string
}

export interface AlgorithmStep {
  title: string
  action: string
  reason: string
  visualExplanation: string
  dataStructureState: DataStructureState
  pseudocodeLines: number[]
  calculation?: string
  takeaway: string
  visualState?: AlgorithmVisualState
  operationIndex?: number
  phaseIndex?: number
  glossaryTerms?: string[]
}

export interface AlgorithmLesson {
  id: AlgorithmId
  title: string
  question: string
  traceNetRole: string
  intuition: string
  inputDescription: string
  dataStructures: DataStructureExplanation[]
  steps: AlgorithmStep[]
  pseudocode: PseudocodeLine[]
  timeComplexity: string
  spaceComplexity: string
  limitations: string[]
  resultInterpretation: string
}

const state = (label: string, entries: [string, string][]): DataStructureState => ({
  label,
  entries: entries.map(([key, value]) => ({ key, value })),
})

export function executionStepToLessonStep(step: ExecutionStep): AlgorithmStep {
  return {
    title: step.title,
    action: step.action,
    reason: step.reason,
    visualExplanation: step.visualExplanation,
    dataStructureState: {
      label: step.dataStructureLabel,
      entries: step.dataStructureState,
    },
    pseudocodeLines: step.pseudocodeLines,
    calculation: step.calculation,
    takeaway: step.takeaway,
    visualState: step.visualState,
    operationIndex: step.operationIndex,
    phaseIndex: step.phaseIndex,
  }
}

function expandedSteps(
  algorithmId: AlgorithmId,
  phases: Array<{
    title: string
    action: string
    reason: string
    visual: string
    state: [string, string][]
    calculation?: string
    takeaway: string
    lines: number[]
    renderPhase: number
  }>,
): AlgorithmStep[] {
  return phases.map(phase => ({
    title: phase.title,
    action: phase.action,
    reason: phase.reason,
    visualExplanation: phase.visual,
    dataStructureState: state(`${algorithmId} state`, phase.state),
    calculation: phase.calculation,
    takeaway: phase.takeaway,
    pseudocodeLines: phase.lines,
    phaseIndex: phase.renderPhase,
  }))
}

export function buildAlgorithmLessons(data: GraphData): Record<AlgorithmId, AlgorithmLesson> {
  const bfs = data.algorithms.bfs
  const reachable = bfs.distances.map((distance, id) => ({ distance, id })).filter(item => item.distance >= 0)
  const unreachable = bfs.distances.map((distance, id) => ({ distance, id })).filter(item => item.distance < 0)
  const scc = data.algorithms.scc
  const topo = data.algorithms.topo_sort
  const bm = data.algorithms.boyer_moore
  const dijkstra = data.algorithms.dijkstra
  const fw = data.algorithms.floyd_warshall
  const greedy = data.algorithms.greedy_contain
  const bnb = data.algorithms.bnb_contain
  // bnb.greedy_cost isn't actually confined to the hospital subgraph (see
  // bnb-subgraph-greedy.ts for why) — use a real subgraph-only greedy run instead.
  const bnbSubgraphGreedy = computeSubgraphGreedy(data)
  const reachableEskape = Object.values(dijkstra.eskape_paths).filter(path => path.dist !== null)
  const sccProgram = generateSCCProgram(data)
  const boyerMooreProgram = generateBoyerMooreProgram(bm)
  const floydWarshallProgram = generateFloydWarshallProgram(data)

  return {
    bfs: {
      id: 'bfs',
      title: 'BFS Reachability',
      question: `From ${bfs.source_name}, which species can resistance reach, and in how many transfers?`,
      traceNetRole: 'Maps the possible outbreak zone without treating stronger and weaker transfer links differently.',
      intuition: 'A queue expands the network in concentric hop layers. The first time a species is discovered is its minimum number of transfer events from the source.',
      inputDescription: `${data.meta.n_nodes} species and ${data.meta.n_edges} directed HGT links; source node ${bfs.source} (${bfs.source_name}).`,
      dataStructures: [
        { name: 'Queue', purpose: 'Holds the next discovered species to expand.', representation: 'FIFO list of node ids' },
        { name: 'Distance array', purpose: 'Stores minimum hop count; -1 means undiscovered.', representation: `[${bfs.distances.join(', ')}]` },
        { name: 'Parent array', purpose: 'Records the discovery edge for path reconstruction.', representation: 'One predecessor per species' },
      ],
      steps: expandedSteps('bfs', [
        { title: 'Define reachability', action: 'Ask which species have any directed path from the source.', reason: 'BFS answers possibility and minimum hop count.', visual: 'The complete graph is visible before traversal.', state: [['source', data.nodes[bfs.source].short]], takeaway: 'Reachability is about possible transfer routes, not probability.', lines: [1], renderPhase: 0 },
        { title: 'Initialize distances', action: 'Set every distance to -1.', reason: '-1 distinguishes undiscovered species.', visual: 'All non-source nodes are muted.', state: [['dist[*]', '-1']], takeaway: 'No species is assumed reachable before discovery.', lines: [1], renderPhase: 0 },
        { title: 'Set the source distance', action: `Set dist[${bfs.source}] = 0.`, reason: 'The source is zero transfers from itself.', visual: 'The source turns amber and grows.', state: [[`dist[${bfs.source}]`, '0']], calculation: 'distance(source, source) = 0', takeaway: 'The source forms BFS layer zero.', lines: [2], renderPhase: 0 },
        { title: 'Enqueue the source', action: `Push ${data.nodes[bfs.source].short} into the FIFO queue.`, reason: 'The queue controls layer-by-layer expansion.', visual: 'The source becomes the active frontier.', state: [['queue', `[${bfs.source}]`]], takeaway: 'FIFO order is what gives BFS minimum hop distances.', lines: [3], renderPhase: 0 },
        { title: 'Dequeue the frontier', action: `Remove ${data.nodes[bfs.source].short} from the queue.`, reason: 'Its outgoing edges are next to inspect.', visual: 'The source remains active while edges dim.', state: [['dequeued', String(bfs.source)], ['queue', '[]']], takeaway: 'A dequeued node is expanded exactly once.', lines: [4, 5], renderPhase: 1 },
        { title: 'Inspect an outgoing edge', action: `Inspect ${data.nodes[bfs.source].short} → ${data.nodes[1].short}.`, reason: 'Every outgoing edge can reveal a new reachable species.', visual: 'One directed edge becomes bright cyan.', state: [['neighbor', data.nodes[1].short], ['dist[neighbor]', String(bfs.distances[1])]], takeaway: 'Edges are considered in their directed transfer orientation.', lines: [6], renderPhase: 1 },
        { title: 'Discover a neighbor', action: `Mark ${data.nodes[1].short} discovered and assign parent ${data.nodes[bfs.source].short}.`, reason: 'Its first discovery is its shortest hop route.', visual: 'The neighbor and parent edge activate.', state: [['parent[1]', String(bfs.source)], ['dist[1]', String(bfs.distances[1])]], calculation: 'dist[1] = dist[source] + 1 = 1', takeaway: 'The first discovered route is a minimum-hop route.', lines: [7], renderPhase: 1 },
        { title: 'Enqueue discovered neighbors', action: `Add all ${reachable.length - 1} newly discovered species to the queue.`, reason: 'They form the next BFS layer.', visual: 'Every hop-one node appears cyan.', state: [['queue size', String(reachable.length - 1)]], takeaway: 'A whole layer is discovered before deeper exploration.', lines: [7], renderPhase: 1 },
        { title: 'Process the remaining queue', action: 'Dequeue each hop-one species and inspect its outgoing edges.', reason: 'BFS continues until no discovered node remains unexpanded.', visual: 'Reachable nodes remain highlighted as the frontier advances.', state: [['reachable', String(reachable.length)], ['maximum hop', String(Math.max(...reachable.map(item => item.distance)))]], takeaway: 'Dense direct connectivity makes every reachable species one hop away here.', lines: [4, 5, 6, 7], renderPhase: 1 },
        { title: 'Reject already discovered nodes', action: 'Skip neighbors whose distance is no longer -1.', reason: 'Re-enqueuing them would repeat work and cannot improve hop distance.', visual: 'Previously visited nodes retain their first parent.', state: [['duplicate discoveries', 'ignored']], takeaway: 'Visited state keeps BFS linear in V + E.', lines: [7], renderPhase: 1 },
        { title: 'Mark unreachable species', action: `Leave ${unreachable.length} species at distance -1.`, reason: 'No directed path from the source reached them.', visual: 'Unreachable nodes receive an infinity label.', state: [['unreachable', unreachable.map(item => data.nodes[item.id].short).join(', ')]], takeaway: 'Infinity is a topological separation under the current graph threshold.', lines: [8], renderPhase: 2 },
        { title: 'Publish and interpret BFS', action: 'Return distances and parent links.', reason: 'Together they explain both minimum hops and one route.', visual: 'Every finite distance is shown beside its node.', state: [['reachable', `${reachable.length}/${data.meta.n_nodes}`], ['queue', '[]']], takeaway: 'The final map shows possibility of spread, not likelihood.', lines: [8], renderPhase: 3 },
      ]),
      pseudocode: [
        { line: 1, code: 'dist[*] <- -1; parent[*] <- null' },
        { line: 2, code: 'dist[source] <- 0' },
        { line: 3, code: 'queue.enqueue(source)' },
        { line: 4, code: 'while queue is not empty:' },
        { line: 5, code: '  u <- queue.dequeue()' },
        { line: 6, code: '  for each outgoing neighbor v of u:' },
        { line: 7, code: '    if dist[v] = -1: dist[v] <- dist[u] + 1; parent[v] <- u; enqueue(v)' },
        { line: 8, code: 'return dist, parent' },
      ],
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
      limitations: ['Ignores edge strength and transfer probability.', 'Reachability depends on the graph threshold and direction.', 'A possible path is not evidence that transfer will occur.'],
      resultInterpretation: `${reachable.length} of ${data.meta.n_nodes} species are reachable from ${bfs.source_name}. The ${unreachable.length} unreachable species form a disconnected resistance-sharing region under this dataset.`,
    },
    scc: {
      id: 'scc',
      title: 'Kosaraju Strongly Connected Components',
      question: 'Which species belong to closed groups where resistance can circulate in both directions?',
      traceNetRole: 'Finds mutually reachable resistance-sharing communities and exposes topological barriers.',
      intuition: 'Nodes belong to the same SCC when every node can reach every other node through directed paths. The first DFS orders nodes by finish time; the second DFS discovers each component on the transposed graph.',
      inputDescription: `The full directed species graph with ${data.meta.n_nodes} nodes and ${data.meta.n_edges} edges.`,
      dataStructures: [
        { name: 'Visited set', purpose: 'Prevents repeated DFS work.', representation: 'Boolean value per node' },
        { name: 'Finish stack', purpose: 'Orders roots for the transpose pass.', representation: 'Nodes pushed after DFS descendants finish' },
        { name: 'Component labels', purpose: 'Assigns each species to one SCC.', representation: `[${scc.component_of.join(', ')}]` },
      ],
      steps: sccProgram.guided.map(executionStepToLessonStep),
      pseudocode: [
        { line: 1, code: 'for each unvisited vertex u: DFS1(u)' },
        { line: 2, code: 'DFS1 pushes u after all descendants finish' },
        { line: 3, code: 'GT <- transpose(G)' },
        { line: 4, code: 'clear visited' },
        { line: 5, code: 'while finish stack is not empty:' },
        { line: 6, code: '  if pop() is unvisited: DFS2 on GT and emit one component' },
        { line: 7, code: 'return component labels' },
      ],
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V + E)',
      limitations: ['Components describe topology, not transfer frequency.', 'SCC boundaries can change when low-weight edges are filtered.', 'Large SCCs do not imply all direct pairwise transfers exist.'],
      resultInterpretation: `TraceNet finds ${scc.n_components} SCCs of sizes ${scc.sizes.join(' and ')}. Resistance can circulate within either group, but no round trip crosses the boundary.`,
    },
    topo_sort: {
      id: 'topo_sort',
      title: 'Topological Sort',
      question: 'What valid order can describe acquisition of the ARG dependency network?',
      traceNetRole: 'Turns directional gene dependencies into an interpretable acquisition sequence.',
      intuition: 'Any gene with no unmet prerequisite can be emitted. Removing it may unlock the next genes.',
      inputDescription: `A separate ARG DAG with ${topo.dag_nodes.length} genes and ${topo.dag_edges.length} dependency edges.`,
      dataStructures: [
        { name: 'In-degree array', purpose: 'Counts unmet prerequisites for every ARG.', representation: 'One integer per gene' },
        { name: 'Zero-degree queue', purpose: 'Holds genes currently valid to emit.', representation: 'FIFO queue used by Kahn’s algorithm' },
        { name: 'Output order', purpose: 'Stores a valid dependency-respecting sequence.', representation: topo.order.join(' -> ') },
      ],
      steps: expandedSteps('topo_sort', [
        { title: 'Switch to the ARG dependency DAG', action: 'Load gene nodes and prerequisite edges.', reason: 'Topological sort applies to the acyclic ARG graph.', visual: 'Species fade out and gene nodes appear.', state: [['genes', String(topo.dag_nodes.length)], ['edges', String(topo.dag_edges.length)]], takeaway: 'TraceNet uses a different graph for gene acquisition order.', lines: [1], renderPhase: 0 },
        { title: 'Allocate the in-degree array', action: 'Create one incoming-edge counter per gene.', reason: 'The counter tracks unmet prerequisites.', visual: 'Each gene receives an in-degree badge.', state: [['in-degree entries', String(topo.dag_nodes.length)]], takeaway: 'In-degree zero means currently available.', lines: [1], renderPhase: 1 },
        { title: 'Count dependency edges', action: 'Increment the target counter for every edge.', reason: 'Every incoming dependency must be removed before emission.', visual: 'Badges update from the real DAG edges.', state: [['dependencies counted', String(topo.dag_edges.length)]], takeaway: 'The DAG structure becomes a compact integer array.', lines: [1], renderPhase: 1 },
        { title: 'Find initial zero-degree genes', action: `Identify ${topo.order.slice(0, 4).join(', ')} as initially available.`, reason: 'They have no unmet prerequisite.', visual: 'Zero badges turn cyan.', state: [['initial zeros', topo.order.slice(0, 4).join(', ')]], takeaway: 'Several valid starting choices can coexist.', lines: [2], renderPhase: 1 },
        { title: 'Initialize Kahn’s queue', action: 'Enqueue every zero-degree gene.', reason: 'The queue stores valid next outputs.', visual: 'Available genes receive a queue halo.', state: [['queue', topo.order.slice(0, 4).join(' | ')]], takeaway: 'Queue order selects one of many valid topological orders.', lines: [2], renderPhase: 1 },
        { title: 'Dequeue the first gene', action: `Remove ${topo.order[0]} from the queue.`, reason: 'It has no remaining prerequisite.', visual: 'The first gene turns amber.', state: [['dequeued', topo.order[0]], ['output size', '0']], takeaway: 'Only zero-degree nodes may be emitted.', lines: [3, 4], renderPhase: 2 },
        { title: 'Append to the output order', action: `Append ${topo.order[0]}.`, reason: 'It is now permanently placed before its dependents.', visual: 'Ordinal 1 appears inside the node.', state: [['output', topo.order[0]]], takeaway: 'Output position records a valid dependency-respecting acquisition point.', lines: [4], renderPhase: 2 },
        { title: 'Remove outgoing constraints', action: 'Decrement in-degrees of the emitted gene’s neighbors.', reason: 'Their prerequisite has now been satisfied.', visual: 'Outgoing edges and target badges update.', state: [['processed edges', 'outgoing from emitted node']], takeaway: 'Removing a node conceptually removes its outgoing constraints.', lines: [5], renderPhase: 2 },
        { title: 'Enqueue newly unlocked genes', action: 'Add any neighbor whose in-degree becomes zero.', reason: 'All its prerequisites now appear earlier in the output.', visual: 'New zero-degree genes brighten.', state: [['queue rule', 'enqueue when in-degree = 0']], takeaway: 'Dependencies unlock genes incrementally.', lines: [6], renderPhase: 2 },
        { title: 'Repeat the queue loop', action: `Emit the remaining order: ${topo.order.slice(1).join(' → ')}.`, reason: 'The same invariant holds at every iteration.', visual: 'Nodes illuminate and receive ordinals in computed order.', state: [['processed', `${topo.order.length}/${topo.dag_nodes.length}`]], takeaway: 'Every edge points from an earlier to a later output node.', lines: [3, 4, 5, 6], renderPhase: 2 },
        { title: 'Check for a cycle', action: 'Compare emitted node count with total node count.', reason: 'A cycle leaves some nodes with positive in-degree forever.', visual: 'All nodes are numbered, so no cycle remains.', state: [['emitted', String(topo.order.length)], ['has cycle', String(topo.has_cycle)]], calculation: `${topo.order.length} = ${topo.dag_nodes.length}`, takeaway: 'A complete output certifies acyclicity.', lines: [7], renderPhase: 3 },
        { title: 'Interpret acquisition order', action: 'Read the order as one dependency-consistent clinical sequence.', reason: 'Dependencies constrain ordering without claiming chemical necessity.', visual: 'The full order is displayed below the DAG.', state: [['order', topo.order.join(' → ')]], takeaway: 'The order is valid, but other valid orders may exist.', lines: [8], renderPhase: 3 },
      ]),
      pseudocode: [
        { line: 1, code: 'indegree <- count incoming edges for every gene' },
        { line: 2, code: 'queue <- all genes with indegree 0' },
        { line: 3, code: 'while queue is not empty:' },
        { line: 4, code: '  u <- dequeue(); append u to order' },
        { line: 5, code: '  for each u -> v: indegree[v]--' },
        { line: 6, code: '  if indegree[v] = 0: enqueue(v)' },
        { line: 7, code: 'if |order| < |V|: report cycle' },
        { line: 8, code: 'return order' },
      ],
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
      limitations: ['The returned order is one of potentially many valid orders.', 'Dependency edges represent the model, not a universal biological law.', 'A cycle means the data must be revised or represented differently.'],
      resultInterpretation: `The ${topo.dag_nodes.length}-gene DAG is acyclic. One valid acquisition order begins ${topo.order.slice(0, 4).join(', ')} and ends with ${topo.order.at(-1)}.`,
    },
    boyer_moore: {
      id: 'boyer_moore',
      title: 'Boyer-Moore Sequence Search',
      question: `Where does the ${bm.gene_name} pattern occur in the reference sequence?`,
      traceNetRole: 'Connects graph-level risk to direct sequence evidence for a clinically important resistance gene.',
      intuition: 'Compare the pattern from right to left. A mismatch can justify skipping alignments that a naive scan would test one by one.',
      inputDescription: `${bm.pattern_length} bp ${bm.gene_name} pattern searched in ${bm.text_length} bp of reference text.`,
      dataStructures: [
        { name: 'Bad-character table', purpose: 'Stores the rightmost pattern occurrence for each DNA symbol.', representation: 'Map over A, C, G, T' },
        { name: 'Alignment offset', purpose: 'Marks the current pattern start in the text.', representation: 'Integer text index' },
        { name: 'Match list', purpose: 'Collects full pattern matches.', representation: `[${bm.matches.join(', ')}]` },
      ],
      steps: boyerMooreProgram.guided.map(executionStepToLessonStep),
      pseudocode: [
        { line: 1, code: 'last <- rightmost index of each symbol in pattern' },
        { line: 2, code: 'shift <- 0' },
        { line: 3, code: 'while shift <= text.length - pattern.length:' },
        { line: 4, code: '  j <- pattern.length - 1' },
        { line: 5, code: '  while j >= 0 and pattern[j] = text[shift+j]: j--' },
        { line: 6, code: '  if j >= 0: shift += max(1, j - last[text[shift+j]])' },
        { line: 7, code: '  else: emit shift as a match' },
        { line: 8, code: 'return matches' },
      ],
      timeComplexity: 'O(nm) worst; sublinear average',
      spaceComplexity: 'O(sigma)',
      limitations: ['Exact matching misses mutations, indels, and sequencing errors.', 'Measured speedup depends on pattern and text composition.', 'A sequence match supports presence, not expression or phenotypic resistance.'],
      resultInterpretation: `${bm.gene_name} has ${bm.matches.length} exact matches at offsets ${bm.matches.join(' and ')}. Boyer-Moore used ${bm.comparisons_bm} comparisons versus ${bm.comparisons_naive} for the naive baseline.`,
    },
    dijkstra: {
      id: 'dijkstra',
      title: 'Dijkstra Most-Probable Paths',
      question: `Which highest-probability routes lead from ${dijkstra.source_name} to ESKAPE pathogens?`,
      traceNetRole: 'Ranks source-to-target transmission routes while respecting edge strength.',
      intuition: 'Transform probability w into non-negative cost -log(w). Minimizing summed cost then maximizes the product of path probabilities.',
      inputDescription: `Weighted HGT graph from ${dijkstra.source_name}; each retained Jaccard weight becomes a non-negative log-distance.`,
      dataStructures: [
        { name: 'Min-priority queue', purpose: 'Extracts the unsettled species with smallest known distance.', representation: '(distance, node) heap entries' },
        { name: 'Distance array', purpose: 'Stores best log-cost from the source.', representation: 'Finite number or infinity per species' },
        { name: 'Parent array', purpose: 'Reconstructs each best path.', representation: 'Predecessor node id' },
      ],
      steps: expandedSteps('dijkstra', [
        { title: 'Transform transfer weights', action: 'Convert every probability weight w to cost -log(w).', reason: 'Products of probabilities become sums of non-negative costs.', visual: 'Edge labels show transformed costs.', state: [['cost rule', '-log(w)']], calculation: '-log(0 < w ≤ 1) ≥ 0', takeaway: 'Minimum log-cost corresponds to maximum path probability.', lines: [1], renderPhase: 0 },
        { title: 'Initialize all distances', action: 'Set every tentative distance to infinity.', reason: 'No route has been discovered yet.', visual: 'All non-source nodes are muted.', state: [['dist[*]', '∞']], takeaway: 'Infinity is replaced only by an explicit route.', lines: [2], renderPhase: 0 },
        { title: 'Seed the source', action: `Set ${data.nodes[dijkstra.source].short} to distance 0.`, reason: 'The empty route has zero cost.', visual: 'The source turns amber.', state: [['source', data.nodes[dijkstra.source].short], ['distance', '0']], takeaway: 'Dijkstra expands outward from one source.', lines: [2], renderPhase: 0 },
        { title: 'Initialize the min-heap', action: 'Push the source with priority zero.', reason: 'The heap must expose the smallest tentative distance.', visual: 'A source label appears beside the active node.', state: [['heap', `[(0, ${data.nodes[dijkstra.source].short})]`]], takeaway: 'Heap priority controls settlement order.', lines: [3], renderPhase: 0 },
        { title: 'Inspect an outgoing weighted edge', action: `Consider ${data.nodes[dijkstra.source].short} → ${data.nodes[8].short}, one of ${data.edges.filter(edge => edge.src === dijkstra.source).length} direct edges from the source.`, reason: 'Relaxation tests whether this edge improves its target — every direct edge gets the same treatment.', visual: 'The inspected edge brightens; the source’s other direct edges are also visible, dimmed.', state: [['edge probability', Math.exp(-(dijkstra.distances[8] ?? 0)).toFixed(3)]], takeaway: 'Each directed edge proposes one candidate distance.', lines: [6], renderPhase: 1 },
        { title: 'Calculate a candidate distance', action: 'Add settled distance and transformed edge cost.', reason: 'Path costs add under the log transformation.', visual: 'Candidate distance appears by the target.', state: [['candidate', (dijkstra.distances[8] ?? 0).toFixed(3)]], calculation: `0 + ${(dijkstra.distances[8] ?? 0).toFixed(3)} = ${(dijkstra.distances[8] ?? 0).toFixed(3)}`, takeaway: 'Relaxation is a concrete arithmetic comparison.', lines: [6, 7], renderPhase: 1 },
        { title: 'Accept an improving relaxation', action: `Update ${data.nodes[8].short} and set its parent to the source.`, reason: 'The candidate is smaller than infinity.', visual: 'The target and parent edge activate.', state: [['dist[8]', (dijkstra.distances[8] ?? 0).toFixed(3)], ['parent[8]', dijkstra.parent[8] !== null ? `${dijkstra.parent[8]} · ${data.nodes[dijkstra.parent[8]].short}` : '—']], takeaway: 'Parents preserve the route that produced each best distance.', lines: [7], renderPhase: 1 },
        { title: 'Extract the closest unsettled node', action: 'Remove the minimum-distance heap entry.', reason: 'Non-negative costs make this distance final — every direct edge from the source was already relaxed, and this was the smallest result.', visual: 'The closest node becomes saturated.', state: [['closest non-source', `${data.nodes[8].short}: ${(dijkstra.distances[8] ?? 0).toFixed(3)}`]], takeaway: 'A settled node never needs a shorter distance later.', lines: [4, 5], renderPhase: 1 },
        { title: 'Reject non-improving candidates', action: 'Keep an existing distance when a candidate is not smaller.', reason: `${data.nodes[1].short} already has dist=${(dijkstra.distances[1] ?? 0).toFixed(3)} from its own direct edge off the source, so only strict improvements belong in the heap.`, visual: 'The rejected candidate edge is shown in danger red, then fades back to muted styling.', state: [['update condition', 'candidate < dist[v]']], takeaway: 'Not every inspected edge changes the shortest-path tree.', lines: [7], renderPhase: 1 },
        { title: 'Settle all reachable species', action: 'Repeat extract-min and relaxation until the heap is empty.', reason: 'Every reachable node eventually receives a final distance.', visual: 'Finite-distance nodes color by settlement distance.', state: [['finite', String(dijkstra.distances.filter(value => value !== null).length)], ['unreachable', String(dijkstra.distances.filter(value => value === null).length)]], takeaway: 'Disconnected species remain infinite.', lines: [4, 5, 6, 7], renderPhase: 1 },
        { title: 'Reconstruct ESKAPE paths', action: 'Follow parent pointers backward from each reachable target.', reason: 'Distances give cost; parents give an explanatory route.', visual: 'Gold arrows reveal target paths.', state: reachableEskape.map(path => [path.target_name, `p=${path.probability.toFixed(3)}`] as [string, string]), takeaway: 'A shortest-path result should be interpretable as a sequence of transfers.', lines: [8], renderPhase: 2 },
        { title: 'Convert cost back to risk', action: 'Compute exp(-distance) and interpret the strongest links.', reason: 'Probability is more intuitive than log-distance.', visual: 'The highest-risk edge is emphasized.', state: [['strongest', `${dijkstra.highest_risk.src_name} → ${dijkstra.highest_risk.tgt_name}`], ['probability', dijkstra.highest_risk.probability.toFixed(3)]], calculation: 'probability = exp(-distance)', takeaway: 'The result is the most probable modeled route, not a guaranteed biological event.', lines: [9], renderPhase: 3 },
      ]),
      pseudocode: [
        { line: 1, code: 'cost(u, v) <- -log(weight(u, v)) for every edge' },
        { line: 2, code: 'dist[source] <- 0; dist[others] <- infinity' },
        { line: 3, code: 'push (0, source) into min-heap' },
        { line: 4, code: 'while heap is not empty:' },
        { line: 5, code: '  (du, u) <- extract-min' },
        { line: 6, code: '  for each edge u -> v with cost -log(weight):' },
        { line: 7, code: '    if du + cost < dist[v]: update dist[v], parent[v], heap' },
        { line: 8, code: 'reconstruct target paths through parent pointers' },
        { line: 9, code: 'probability <- exp(-distance)' },
      ],
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V + E)',
      limitations: ['Assumes independent edge probabilities when multiplying along a path.', 'Requires non-negative transformed edge costs.', 'Returns one best route, not the full uncertainty distribution.'],
      resultInterpretation: `${reachableEskape.length} ESKAPE targets are reachable from ${dijkstra.source_name}. The strongest edge in the full graph is ${dijkstra.highest_risk.src_name} to ${dijkstra.highest_risk.tgt_name} at probability ${dijkstra.highest_risk.probability.toFixed(3)}.`,
    },
    floyd_warshall: {
      id: 'floyd_warshall',
      title: 'Floyd-Warshall All-Pairs Vulnerability',
      question: 'How close is every species to every other species in the weighted transfer network?',
      traceNetRole: 'Creates a complete source-independent vulnerability map for comparing every possible pair.',
      intuition: 'Dynamic programming asks whether allowing node k as an intermediate improves each route i to j.',
      inputDescription: `${data.meta.n_nodes} x ${data.meta.n_nodes} log-distance matrix derived from the weighted species graph.`,
      dataStructures: [
        { name: 'Distance matrix', purpose: 'Stores the best known cost for every ordered pair.', representation: `${data.meta.n_nodes} x ${data.meta.n_nodes} cells` },
        { name: 'Intermediate index k', purpose: 'Defines which vertices may appear inside current paths.', representation: `0 through ${data.meta.n_nodes - 1}` },
        { name: 'Vulnerability scores', purpose: 'Summarizes each node’s aggregate graph distance.', representation: fw.vulnerability_scores.map(value => value.toFixed(2)).join(', ') },
      ],
      steps: floydWarshallProgram.guided.map(executionStepToLessonStep),
      pseudocode: [
        { line: 1, code: 'dist[i][i] <- 0 for every i' },
        { line: 2, code: 'dist[u][v] <- edge cost; all other cells <- infinity' },
        { line: 3, code: 'for k in vertices:' },
        { line: 4, code: '  for i in vertices:' },
        { line: 5, code: '    for j in vertices:' },
        { line: 6, code: '      dist[i][j] <- min(dist[i][j], dist[i][k] + dist[k][j])' },
        { line: 7, code: 'score[i] <- aggregate finite values in row i' },
        { line: 8, code: 'return dist, argmin(score)' },
      ],
      timeComplexity: 'O(V^3)',
      spaceComplexity: 'O(V^2)',
      limitations: ['Cubic runtime limits use on very large graphs.', 'Aggregate vulnerability depends on the chosen score definition.', 'Disconnected pairs remain infinite and require explicit handling.'],
      resultInterpretation: `${fw.most_vulnerable_name} has the lowest aggregate distance score (${fw.vulnerability_scores[fw.most_vulnerable]}), making it the most centrally exposed species in this all-pairs model.`,
    },
    greedy_contain: {
      id: 'greedy_contain',
      title: 'Greedy Containment',
      question: 'Which transfer links does the heuristic remove to disconnect environmental sources from reachable ESKAPE targets?',
      traceNetRole: 'Produces a fast intervention candidate when exact combinatorial optimization is too expensive.',
      intuition: 'Try high-weight links first and keep removing until no source-to-target path remains.',
      inputDescription: `${greedy.sources.length} sources, ${greedy.targets.length} reachable targets, and ${data.meta.n_edges} candidate directed edges.`,
      dataStructures: [
        { name: 'Sorted edge list', purpose: 'Prioritizes stronger transfer links.', representation: 'Edges in descending Jaccard weight' },
        { name: 'Removed set', purpose: 'Tracks disabled pathways.', representation: `${greedy.n_removed} directed edges in the computed result` },
        { name: 'Reachability check', purpose: 'Tests whether containment has been achieved.', representation: 'BFS/DFS from each source after removals' },
      ],
      steps: expandedSteps('greedy_contain', [
        { title: 'Define the containment objective', action: 'Disconnect environmental sources from reachable ESKAPE targets.', reason: 'Only reachable protected targets require cuts.', visual: 'Sources turn green and targets red.', state: [['sources', greedy.source_names.join(', ')], ['targets', greedy.target_names.join(', ')]], takeaway: 'Containment is a source-to-target connectivity objective.', lines: [1], renderPhase: 0 },
        { title: 'Collect candidate directed edges', action: `Gather all ${data.meta.n_edges} graph edges.`, reason: 'Any directed transfer link could be removed.', visual: 'All edges remain visible.', state: [['candidates', String(data.meta.n_edges)]], takeaway: 'Reciprocal directions are separate candidates.', lines: [], renderPhase: 0 },
        { title: 'Sort by descending weight', action: 'Rank strongest transfer links first.', reason: 'The heuristic prioritizes locally high-risk edges.', visual: 'Thicker edges brighten.', state: [['sort key', 'weight descending']], takeaway: 'Greedy priority is simple and fast, but not globally informed.', lines: [2], renderPhase: 1 },
        { title: 'Select the heaviest edge', action: `Choose ${data.nodes[greedy.removed_edges[0].src].short} → ${data.nodes[greedy.removed_edges[0].tgt].short}.`, reason: 'It is first in the sorted list.', visual: 'The candidate turns amber.', state: [['weight', String(greedy.removed_edges[0].weight)]], takeaway: 'The first choice is locally strongest.', lines: [4], renderPhase: 1 },
        { title: 'Remove the selected edge', action: 'Add the directed edge to the removed set.', reason: 'The algorithm tests containment after each removal.', visual: 'A red cross appears and the edge becomes dashed.', state: [['removed count', '1']], takeaway: 'Removal changes the graph before connectivity is rechecked.', lines: [5], renderPhase: 2 },
        { title: 'Run a reachability check', action: 'Search from every source in the modified graph.', reason: 'The algorithm must know whether a protected target remains reachable.', visual: 'A traversal ripple expands from sources.', state: [['check', 'BFS/DFS from sources']], takeaway: 'A cut matters only through its effect on connectivity.', lines: [5], renderPhase: 2 },
        { title: 'Continue when a target remains reachable', action: 'Select the next ranked edge.', reason: 'Containment is not yet achieved.', visual: 'Another edge receives a cross.', state: [['remaining candidates', String(data.meta.n_edges - 1)]], takeaway: 'Greedy commits to earlier choices instead of reconsidering them.', lines: [4, 5], renderPhase: 2 },
        { title: 'Accumulate removals', action: 'Repeat edge removal and reachability checks.', reason: 'Each iteration removes one more route opportunity.', visual: 'The first removals animate; the counter tracks the full result.', state: [['computed removals', String(greedy.n_removed)]], takeaway: 'Repeated global checks dominate runtime after sorting.', lines: [4, 5], renderPhase: 2 },
        { title: 'Detect successful containment', action: 'Observe that no source can reach any protected target.', reason: 'This is the loop’s stopping condition.', visual: 'Traversal ripples stop before target nodes.', state: [['reachable protected targets', '0']], takeaway: 'The objective is satisfied once all source-target paths are broken.', lines: [6], renderPhase: 3 },
        { title: 'Stop the greedy loop', action: 'Do not remove lower-ranked edges after containment.', reason: 'Additional removals are unnecessary for this heuristic result.', visual: 'Remaining edges settle into the background.', state: [['stop', 'no target reachable']], takeaway: 'The stopping rule prevents needless extra cuts after success.', lines: [6], renderPhase: 3 },
        { title: 'Report the intervention set', action: `Return ${greedy.n_removed} directed removals.`, reason: 'This set is the computed feasible solution.', visual: 'Removed edges remain faded while sources and targets stay labeled.', state: [['removed', String(greedy.n_removed)], ['remaining', String(data.meta.n_edges - greedy.n_removed)]], takeaway: 'Feasible does not mean minimum.', lines: [7], renderPhase: 3 },
        { title: 'State the approximation limit', action: 'Compare with an exact method on a smaller subgraph.', reason: 'Weight-first choices can miss a compact structural cut.', visual: 'The result badge is labeled approximate.', state: [['optimality certificate', 'none']], takeaway: 'Greedy trades solution quality for predictable polynomial work.', lines: [7], renderPhase: 3 },
      ]),
      pseudocode: [
        { line: 1, code: 'identify source set S and reachable target set T' },
        { line: 2, code: 'edges <- sort all edges by descending weight' },
        { line: 3, code: 'removed <- empty set' },
        { line: 4, code: 'for edge e in edges:' },
        { line: 5, code: '  remove e; add e to removed; recompute reachability from S' },
        { line: 6, code: '  if no target in T is reachable: break' },
        { line: 7, code: 'return removed' },
      ],
      timeComplexity: 'O(E log E + k(V + E))',
      spaceComplexity: 'O(V + E)',
      limitations: ['The result is an approximation and may remove far more edges than necessary.', 'Ranking by weight ignores global cut structure.', 'Directed reciprocal links are separate interventions in this model.'],
      resultInterpretation: `The computed heuristic removes ${greedy.n_removed} directed edges to isolate ${greedy.source_names.join(' and ')} from the reachable targets ${greedy.target_names.join(' and ')}. This is containment, not a minimality certificate.`,
    },
    bnb_contain: {
      id: 'bnb_contain',
      title: 'Branch and Bound Exact Containment',
      question: 'What is the provably minimum cut on the hospital subgraph, and how does it compare with greedy?',
      traceNetRole: 'Provides an exact benchmark and optimality certificate on a tractable subgraph.',
      intuition: 'Branch on whether each candidate edge is removed. Prune a branch as soon as it cannot beat the best complete solution found.',
      inputDescription: `${bnb.hospital_node_names.length}-node hospital subgraph with ${bnb.sources.length} sources and ${bnb.targets.length} reachable targets.`,
      dataStructures: [
        { name: 'Search tree', purpose: 'Represents include/exclude decisions for candidate cuts.', representation: 'Binary decision tree' },
        { name: 'Incumbent solution', purpose: 'Stores the smallest valid cut found so far.', representation: `${bnb.optimal_cost} edges in the final result` },
        { name: 'Lower bound', purpose: 'Proves a partial branch cannot improve the incumbent.', representation: 'Current cut cost plus required future cost' },
      ],
      steps: expandedSteps('bnb_contain', [
        { title: 'Restrict to the hospital subgraph', action: `Load ${bnb.hospital_node_names.length} hospital-context nodes.`, reason: 'Exact subset search is exponential.', visual: 'The full graph changes to the hospital subgraph.', state: [['nodes', String(bnb.hospital_node_names.length)]], takeaway: 'Exactness is practical only on a controlled problem size.', lines: [1], renderPhase: 0 },
        { title: 'Define sources and targets', action: 'Mark the same containment objective used for comparison.', reason: 'Both algorithms need identical inputs.', visual: 'Sources and protected targets receive distinct colors.', state: [['sources', bnb.source_names.join(', ')], ['targets', bnb.target_names.join(', ')]], takeaway: 'Fair comparison starts with the same graph and objective.', lines: [1], renderPhase: 0 },
        { title: 'Initialize an incumbent cut', action: `Use a feasible solution as the current best bound.`, reason: 'Any branch with equal or greater cost can then be pruned.', visual: 'The search tree root appears.', state: [['incumbent', String(bnbSubgraphGreedy.cost)]], takeaway: 'A good incumbent makes pruning stronger.', lines: [1], renderPhase: 1 },
        { title: 'Choose the next undecided edge', action: 'Select a candidate edge for a binary decision.', reason: 'Every subset can be represented by remove/retain branches.', visual: 'The next tree level appears.', state: [['decision', 'remove edge or retain edge']], takeaway: 'Branching systematically covers the solution space.', lines: [2, 5], renderPhase: 1 },
        { title: 'Explore the remove branch', action: 'Add the edge to the partial cut.', reason: 'This branch represents every solution containing that removal.', visual: 'The left branch extends.', state: [['branch', 'edge included']], takeaway: 'A partial decision set defines many possible complete cuts.', lines: [6], renderPhase: 1 },
        { title: 'Explore the keep branch', action: 'Leave the edge available and continue.', reason: 'This covers solutions that preserve the edge.', visual: 'The right branch extends.', state: [['branch', 'edge excluded']], takeaway: 'Both choices are explored unless a bound proves one useless.', lines: [6], renderPhase: 1 },
        { title: 'Evaluate a lower bound', action: 'Estimate the best possible completion of the partial branch.', reason: 'The bound decides whether improvement remains possible.', visual: 'A bound estimate appears beside the branch under evaluation.', state: [['prune rule', 'lower bound ≥ incumbent']], takeaway: 'Bounds accelerate exhaustive search without changing correctness.', lines: [3], renderPhase: 1 },
        { title: 'Prune a dominated branch', action: 'Stop exploring a branch that cannot beat the incumbent.', reason: 'No descendant can produce a smaller valid cut.', visual: 'The branch turns red and dashed.', state: [['status', 'pruned']], takeaway: 'Safe pruning is the source of practical speedup.', lines: [3], renderPhase: 1 },
        { title: 'Test a complete cut', action: 'Run reachability after all required decisions are made.', reason: 'Only source-target disconnection makes a branch feasible.', visual: "The second candidate edge's fork appears in the search tree, already resolved.", state: [['feasibility test', 'all targets disconnected']], takeaway: 'A low-cost branch is irrelevant if it fails containment.', lines: [4], renderPhase: 1 },
        { title: 'Improve the incumbent', action: `Store a feasible ${bnb.optimal_cost}-edge cut.`, reason: 'It beats the previous best solution.', visual: 'The optimal edges are cut in red with scissor marks, one at a time.', state: [['new incumbent', String(bnb.optimal_cost)]], takeaway: 'Every improved incumbent enables additional pruning.', lines: [4], renderPhase: 2 },
        { title: 'Exhaust all competitive branches', action: 'Continue until every unvisited branch is safely pruned or evaluated.', reason: 'Only then is the incumbent provably optimal.', visual: 'A search-complete summary confirms every candidate edge was explored or safely pruned.', state: [['optimality', 'certified']], takeaway: 'No unexplored branch can contain a better solution.', lines: [7], renderPhase: 2 },
        { title: 'Compare exact and greedy costs', action: `Compare B&B ${bnb.optimal_cost} with a greedy run confined to this same subgraph (${bnbSubgraphGreedy.cost}).`, reason: 'The same subgraph and objective make the quality gap meaningful.', visual: 'A side-by-side result panel appears.', state: [['B&B', String(bnb.optimal_cost)], ['greedy (subgraph)', String(bnbSubgraphGreedy.cost)], ['saved', String(bnbSubgraphGreedy.cost - bnb.optimal_cost)]], calculation: `${bnbSubgraphGreedy.cost} - ${bnb.optimal_cost} = ${bnbSubgraphGreedy.cost - bnb.optimal_cost}`, takeaway: 'Branch and bound supplies the minimality certificate that greedy lacks.', lines: [8], renderPhase: 3 },
      ]),
      pseudocode: [
        { line: 1, code: 'best <- a feasible incumbent cut' },
        { line: 2, code: 'search(index, removed):' },
        { line: 3, code: '  if lowerBound(removed) >= |best|: prune' },
        { line: 4, code: '  if removed disconnects all sources and targets: best <- removed; return' },
        { line: 5, code: '  choose next candidate edge e' },
        { line: 6, code: '  search(next, removed union {e}); search(next, removed)' },
        { line: 7, code: 'after exhaustive safe pruning, best is optimal' },
        { line: 8, code: 'compare best with greedy on the identical subgraph' },
      ],
      timeComplexity: 'O(2^E) worst case',
      spaceComplexity: 'O(E)',
      limitations: ['Worst-case runtime is exponential.', 'The exact certificate applies only to the selected hospital subgraph.', 'Bound quality determines practical runtime.', 'The greedy comparison is a separate run confined to this subgraph, not the same 141-edge result shown for the full-graph Greedy Containment module.'],
      resultInterpretation: `Branch and bound proves that ${bnb.optimal_cost} directed removals are sufficient and minimal on the hospital subgraph. A greedy run confined to this same subgraph removes ${bnbSubgraphGreedy.cost}, a gap of ${bnbSubgraphGreedy.cost - bnb.optimal_cost} edges.`,
    },
  }
}
