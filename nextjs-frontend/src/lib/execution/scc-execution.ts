import type { GraphData } from '../graph-data'
import type { AlgorithmVisualState, ExecutionProgram, ExecutionStep, GraphDirection } from './types'

interface SCCEvent {
  kind: 'root' | 'enter' | 'inspect' | 'discover' | 'backtrack' | 'finish' | 'transpose' | 'pop' | 'assign' | 'component'
  direction: GraphDirection
  activeNode?: number
  activeEdge?: [number, number]
  visited: number[]
  recursionStack: number[]
  finishStack: number[]
  currentComponent: number[]
  discoveredComponents: number[][]
}

const programCache = new WeakMap<GraphData, ExecutionProgram>()

function snapshot(
  kind: SCCEvent['kind'],
  direction: GraphDirection,
  activeNode: number | undefined,
  activeEdge: [number, number] | undefined,
  visited: Set<number>,
  recursionStack: number[],
  finishStack: number[],
  currentComponent: number[],
  discoveredComponents: number[][],
): SCCEvent {
  return {
    kind,
    direction,
    activeNode,
    activeEdge,
    visited: [...visited],
    recursionStack: [...recursionStack],
    finishStack: [...finishStack],
    currentComponent: [...currentComponent],
    discoveredComponents: discoveredComponents.map(component => [...component]),
  }
}

export function generateSCCEvents(data: GraphData): SCCEvent[] {
  const adjacency = Array.from({ length: data.nodes.length }, () => [] as number[])
  const transpose = Array.from({ length: data.nodes.length }, () => [] as number[])
  data.edges.forEach(edge => {
    adjacency[edge.src].push(edge.tgt)
    transpose[edge.tgt].push(edge.src)
  })
  adjacency.forEach(neighbors => neighbors.sort((a, b) => a - b))
  transpose.forEach(neighbors => neighbors.sort((a, b) => a - b))

  const events: SCCEvent[] = []
  const visited = new Set<number>()
  const recursionStack: number[] = []
  const finishStack: number[] = []
  const components: number[][] = []

  const dfs1 = (node: number) => {
    visited.add(node)
    recursionStack.push(node)
    events.push(snapshot('enter', 'original', node, undefined, visited, recursionStack, finishStack, [], components))
    for (const neighbor of adjacency[node]) {
      events.push(snapshot('inspect', 'original', node, [node, neighbor], visited, recursionStack, finishStack, [], components))
      if (!visited.has(neighbor)) {
        events.push(snapshot('discover', 'original', neighbor, [node, neighbor], visited, recursionStack, finishStack, [], components))
        dfs1(neighbor)
      }
    }
    recursionStack.pop()
    events.push(snapshot('backtrack', 'original', node, undefined, visited, recursionStack, finishStack, [], components))
    finishStack.push(node)
    events.push(snapshot('finish', 'original', node, undefined, visited, recursionStack, finishStack, [], components))
  }

  data.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      events.push(snapshot('root', 'original', node.id, undefined, visited, recursionStack, finishStack, [], components))
      dfs1(node.id)
    }
  })

  events.push(snapshot('transpose', 'transposed', undefined, undefined, visited, [], finishStack, [], components))
  visited.clear()

  const dfs2 = (node: number, component: number[]) => {
    visited.add(node)
    recursionStack.push(node)
    component.push(node)
    events.push(snapshot('assign', 'transposed', node, undefined, visited, recursionStack, finishStack, component, components))
    for (const neighbor of transpose[node]) {
      events.push(snapshot('inspect', 'transposed', node, [node, neighbor], visited, recursionStack, finishStack, component, components))
      if (!visited.has(neighbor)) dfs2(neighbor, component)
    }
    recursionStack.pop()
    events.push(snapshot('backtrack', 'transposed', node, undefined, visited, recursionStack, finishStack, component, components))
  }

  while (finishStack.length) {
    const node = finishStack.pop()!
    events.push(snapshot('pop', 'transposed', node, undefined, visited, recursionStack, finishStack, [], components))
    if (visited.has(node)) continue
    const component: number[] = []
    dfs2(node, component)
    components.push(component)
    events.push(snapshot('component', 'transposed', node, undefined, visited, recursionStack, finishStack, component, components))
  }

  return events
}

function visual(event: SCCEvent, revealAllComponents = false): AlgorithmVisualState {
  return {
    graphDirection: event.direction,
    activeNode: event.activeNode,
    activeEdge: event.activeEdge,
    visitedNodes: event.visited,
    recursionStack: event.recursionStack,
    finishStack: event.finishStack,
    currentComponent: event.currentComponent,
    discoveredComponents: event.discoveredComponents,
    revealAllComponents,
  }
}

function eventStep(data: GraphData, event: SCCEvent, index: number): ExecutionStep {
  const nodeName = event.activeNode === undefined ? 'none' : data.nodes[event.activeNode].short
  const edgeName = event.activeEdge
    ? `${data.nodes[event.activeEdge[0]].short} → ${data.nodes[event.activeEdge[1]].short}`
    : 'none'
  const descriptions: Record<SCCEvent['kind'], [string, string, string, number[]]> = {
    root: ['Select an unvisited DFS root', `Choose ${nodeName} because it has not been visited.`, 'Every disconnected DFS tree needs its own root.', [1, 2]],
    enter: ['Enter a DFS call', `Mark ${nodeName} visited and push it onto the recursion stack.`, 'The recursion stack records the active directed path.', [2, 3]],
    inspect: ['Inspect an outgoing edge', `Test ${edgeName}.`, 'DFS must examine every outgoing edge once.', [4, 5]],
    discover: ['Discover a new node', `The edge reaches an unvisited node, so recurse into ${nodeName}.`, 'Following an unvisited neighbor extends the DFS tree.', [5, 6]],
    backtrack: ['Backtrack from a node', `All outgoing edges of ${nodeName} are complete; remove it from the recursion stack.`, 'DFS returns only after every descendant is handled.', [7]],
    finish: ['Push onto finishing stack', `Push ${nodeName} after its DFS subtree finishes.`, 'Postorder finish times determine the second-pass root order.', [8]],
    transpose: ['Construct the transposed graph', 'Reverse every directed edge to form Gᵀ.', 'SCC membership is preserved, while movement between components reverses.', [9]],
    pop: ['Pop the next finish-order node', `Pop ${nodeName} from the finishing stack.`, 'The maximum remaining finish time is the next safe second-pass root candidate.', [10, 11]],
    assign: ['Assign a node to the current SCC', `Visit ${nodeName} in Gᵀ and add it to the current component.`, 'The second DFS cannot escape the SCC selected by finish order.', [12, 13]],
    component: ['Complete one SCC', `Finish the current component containing ${event.currentComponent.length} nodes.`, 'Every member is mutually reachable in the original graph.', [14]],
  }
  const [title, action, reason, pseudocodeLines] = descriptions[event.kind]
  return {
    id: `scc-event-${index}`,
    algorithmId: 'scc',
    phase: event.direction === 'original' ? 'First DFS on G' : 'Second DFS on Gᵀ',
    title,
    action,
    reason,
    visualExplanation: `Active node: ${nodeName}. Active edge: ${edgeName}. ${event.direction === 'original' ? 'Arrowheads show G.' : 'Arrowheads show Gᵀ.'}`,
    dataStructureLabel: 'Kosaraju state',
    dataStructureState: [
      { key: 'visited', value: event.visited.map(id => data.nodes[id].short).join(', ') || '∅' },
      { key: 'recursion stack', value: event.recursionStack.map(id => data.nodes[id].short).join(' → ') || '∅' },
      { key: 'finish stack', value: event.finishStack.map(id => data.nodes[id].short).join(' | ') || '∅' },
      { key: 'current component', value: event.currentComponent.map(id => data.nodes[id].short).join(', ') || '∅' },
    ],
    calculation: event.kind === 'finish' ? `finish.push(${nodeName})` : undefined,
    takeaway: event.kind === 'component'
      ? 'Every node collected by this second-pass DFS belongs to one mutually reachable region.'
      : 'Kosaraju separates ordering work from component-discovery work.',
    pseudocodeLines,
    visualState: visual(event),
    operationIndex: index,
  }
}

function findEvent(events: SCCEvent[], predicate: (event: SCCEvent) => boolean, fallback: number): SCCEvent {
  return events.find(predicate) ?? events[fallback]
}

export function generateSCCProgram(data: GraphData): ExecutionProgram {
  const cached = programCache.get(data)
  if (cached) return cached
  const events = generateSCCEvents(data)
  const firstRoot = findEvent(events, event => event.kind === 'root', 0)
  const firstEnter = findEvent(events, event => event.kind === 'enter', 1)
  const firstInspect = findEvent(events, event => event.kind === 'inspect', 2)
  const firstDiscover = findEvent(events, event => event.kind === 'discover', 3)
  const firstBacktrack = findEvent(events, event => event.kind === 'backtrack' && event.finishStack.length === 0, 4)
  const firstFinish = findEvent(events, event => event.kind === 'finish', 5)
  const finalFirstPass = [...events].reverse().find(event => event.direction === 'original' && event.kind === 'finish') ?? firstFinish
  const transpose = findEvent(events, event => event.kind === 'transpose', 6)
  const firstPop = findEvent(events, event => event.kind === 'pop', 7)
  const firstAssign = findEvent(events, event => event.kind === 'assign', 8)
  const firstComponent = findEvent(events, event => event.kind === 'component', 9)
  const secondComponent = [...events].reverse().find(event => event.kind === 'component') ?? firstComponent

  const guidedEvents = [
    firstRoot,
    firstRoot,
    firstRoot,
    firstEnter,
    firstInspect,
    firstDiscover,
    firstBacktrack,
    firstFinish,
    finalFirstPass,
    finalFirstPass,
    transpose,
    firstPop,
    firstAssign,
    firstComponent,
    secondComponent,
    secondComponent,
    secondComponent,
  ]
  const titles = [
    'Define mutual reachability',
    'Inspect the original directed graph',
    'Select the first unvisited DFS root',
    'Push the root onto the recursion stack',
    'Inspect an outgoing edge',
    'Discover an unvisited neighbor',
    'Backtrack after descendants finish',
    'Push a node onto the finishing stack',
    'Complete the finishing-order stack',
    'Construct the transposed graph',
    'Reverse every arrowhead',
    'Pop the highest-finish node',
    'Run DFS on the transposed graph',
    'Assign the first component',
    'Repeat for remaining stack entries',
    'Display all strongly connected regions',
    'Interpret resistance circulation',
  ]

  const guided = guidedEvents.map((event, index) => {
    const base = eventStep(data, event, index)
    return {
      ...base,
      id: `scc-guided-${index}`,
      phase: index < 9 ? 'Pass 1: finishing order' : index < 12 ? 'Transpose' : 'Pass 2: components',
      title: titles[index],
      action: index === 0
        ? 'Use directed paths to ask whether each pair of nodes can reach one another.'
        : index === 1
          ? 'Read every arrow in its original transfer direction before traversal begins.'
          : index === 10
            ? 'Move each arrowhead to the opposite endpoint; the edge geometry stays fixed.'
            : index === 15
              ? 'Reveal every component only after the second DFS has discovered it.'
              : index === 16
                ? 'Relate each completed SCC to a resistance-sharing region.'
                : base.action,
      reason: index === 0
        ? 'Nodes belong to the same SCC when every node can reach every other node through directed paths.'
        : base.reason,
      visualExplanation: index === 15 || index === 16
        ? 'Colored regions now appear around all components. No final component colors were shown during the first DFS.'
        : base.visualExplanation,
      takeaway: index === 16
        ? 'A resistance gene entering one SCC can circulate among its members, while crossing between SCCs requires a boundary path.'
        : base.takeaway,
      visualState: visual(event, index >= 15),
      phaseIndex: index < 9 ? 0 : index < 12 ? 1 : 2,
    }
  })

  const program = { guided, full: events.map((event, index) => eventStep(data, event, index)), phaseStarts: [0, 9, 12] }
  programCache.set(data, program)
  return program
}
