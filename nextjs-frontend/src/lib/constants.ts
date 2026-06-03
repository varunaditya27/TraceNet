import type { AlgorithmId } from './graph-data'

export const COLORS = {
  surface0: '#0d1117',
  surface1: '#161b22',
  surface2: '#21262d',
  surface3: '#30363d',
  amberDim: '#92610a',
  amberMid: '#d4a017',
  amberBright: '#f0b429',
  amberGlow: 'rgba(212,160,23,0.12)',
  text1: '#e6edf3',
  text2: '#8b949e',
  text3: '#484f58',
  riskHigh: '#f85149',
  riskLow: '#3fb950',
  nodeBridge: '#8b949e',
  sccViolet: '#a78bfa',
  bfsTeal: '#22d3ee',
  pathGold: '#f0b429',
} as const

export const ROLE_COLORS: Record<string, string> = {
  eskape: '#f85149',
  bridge: '#8b949e',
  environmental: '#3fb950',
}

export const TIMINGS = {
  nodeState: 500,
  nodeFade: 300,
  edgeRemove: 800,
  bfsHop: 400,
  sccHalo: 600,
  graphSwitch: 400,
  dnaScan: 80,
  matrixRow: 80,
  bnbBranch: 300,
} as const

export const VIEWBOX = { width: 1140, height: 670 } as const

export const ALGO_IDS: AlgorithmId[] = [
  'bfs', 'scc', 'topo_sort', 'boyer_moore',
  'dijkstra', 'floyd_warshall', 'greedy_contain', 'bnb_contain',
]

export const ALGORITHM_UNITS: Record<AlgorithmId, string> = {
  bfs: 'UNIT II',
  scc: 'UNIT II',
  topo_sort: 'UNIT II',
  boyer_moore: 'UNIT III',
  dijkstra: 'UNIT IV',
  floyd_warshall: 'UNIT IV',
  greedy_contain: 'UNIT IV',
  bnb_contain: 'UNIT V',
}

export const ALGORITHM_META: Record<AlgorithmId, {
  name: string
  unit: string
  timeComplexity: string
  spaceComplexity: string
  description: string
  icon: string
}> = {
  bfs: {
    name: 'BFS Reachability',
    unit: 'UNIT II',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V)',
    icon: '⊕',
    description: 'Breadth-first search traces how far antibiotic resistance can spread from a source species, revealing the full reachable outbreak zone by hop distance.',
  },
  scc: {
    name: 'Kosaraju SCC',
    unit: 'UNIT II',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V+E)',
    icon: '◎',
    description: 'Strongly connected components identify resistance bubbles — groups of species that can mutually exchange genes — using two passes of depth-first search on the original and transposed graph.',
  },
  topo_sort: {
    name: 'Topological Sort',
    unit: 'UNIT II',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V)',
    icon: '→',
    description: "Kahn's BFS-based algorithm orders the ARG dependency DAG, revealing the sequence in which resistance genes are clinically acquired during an infection.",
  },
  boyer_moore: {
    name: 'Boyer-Moore Search',
    unit: 'UNIT III',
    timeComplexity: 'O(n/m) avg',
    spaceComplexity: 'O(σ)',
    icon: '⌕',
    description: 'Boyer-Moore pattern matching locates the NDM-1 resistance gene sequence within the CARD reference FASTA, using the bad-character heuristic on a 4-symbol DNA alphabet for sub-linear average performance.',
  },
  dijkstra: {
    name: "Dijkstra's Algorithm",
    unit: 'UNIT IV',
    timeComplexity: 'O((V+E) log V)',
    spaceComplexity: 'O(V)',
    icon: '◈',
    description: 'By converting Jaccard edge probabilities to log-distances, Dijkstra finds the highest-probability transmission path from a source species to every reachable ESKAPE pathogen.',
  },
  floyd_warshall: {
    name: 'Floyd-Warshall',
    unit: 'UNIT IV',
    timeComplexity: 'O(V³)',
    spaceComplexity: 'O(V²)',
    icon: '⊞',
    description: 'All-pairs shortest paths produce a complete vulnerability matrix — every species pair receives a risk score — revealing the most epidemiologically connected nodes regardless of source choice.',
  },
  greedy_contain: {
    name: 'Greedy Containment',
    unit: 'UNIT IV',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V+E)',
    icon: '✂',
    description: 'A greedy approximation iteratively removes the highest-weight transmission edges to disconnect environmental reservoirs from ESKAPE clinical targets, trading optimality for polynomial runtime.',
  },
  bnb_contain: {
    name: 'Branch & Bound',
    unit: 'UNIT V',
    timeComplexity: 'O(2^E) worst',
    spaceComplexity: 'O(E)',
    icon: '⎇',
    description: 'Branch-and-bound finds the provably minimum edge set to sever on the hospital subgraph, verifying global optimality through exhaustive pruned search — justifying the greedy approximation comparison.',
  },
}
