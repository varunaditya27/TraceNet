export type NodeRole = 'eskape' | 'bridge' | 'environmental'
export type GramType = 'positive' | 'negative'
export type AlgorithmId = 'bfs' | 'scc' | 'topo_sort' | 'boyer_moore' | 'dijkstra' | 'floyd_warshall' | 'greedy_contain' | 'bnb_contain'

export interface GraphNode {
  id: number
  name: string
  short: string
  gram: GramType
  role: NodeRole
  plasmid_args: number
  x: number
  y: number
}

export interface GraphEdge {
  src: number
  tgt: number
  weight: number
  dist: number
  labels: string[]
}

export interface BFSResult {
  source: number
  source_name: string
  distances: number[]
  parent: (number | null)[]
  reachable: number
}

export interface SCCResult {
  n_components: number
  component_of: number[]
  groups: number[][]
  sizes: number[]
}

export interface TopoResult {
  dag_nodes: string[]
  dag_edges: [number, number][]
  order: string[]
  order_indices: number[]
  has_cycle: boolean
}

export interface BMResult {
  pattern: string
  pattern_source_offset?: number
  pattern_length: number
  gene_name: string
  parent_text: string
  text_length: number
  matches: number[]
  comparisons_bm: number
  comparisons_naive: number
  speedup: number
}

export interface DijkstraResult {
  source: number
  source_name: string
  distances: (number | null)[]
  parent: (number | null)[]
  eskape_paths: Record<string, {
    path: number[]
    dist: number | null
    probability: number
    target_name: string
  }>
  highest_risk: {
    src: number
    tgt: number
    src_name: string
    tgt_name: string
    probability: number
  }
}

export interface FWResult {
  dist_matrix: (number | null)[][]
  vulnerability_scores: number[]
  most_vulnerable: number
  most_vulnerable_name: string
}

export interface GreedyResult {
  note: string
  sources: number[]
  source_names: string[]
  targets: number[]
  target_names: string[]
  removed_edges: { src: number; tgt: number; weight: number }[]
  n_removed: number
}

export interface BNBResult {
  note: string
  hospital_node_names: string[]
  sources: number[]
  source_names: string[]
  targets: number[]
  target_names: string[]
  optimal_removed: { src: number; tgt: number; weight: number }[]
  optimal_cost: number
  greedy_removed: { src: number; tgt: number; weight: number }[]
  greedy_cost: number
}

export interface AlgorithmResults {
  bfs: BFSResult
  scc: SCCResult
  topo_sort: TopoResult
  boyer_moore: BMResult
  dijkstra: DijkstraResult
  floyd_warshall: FWResult
  greedy_contain: GreedyResult
  bnb_contain: BNBResult
}

export interface GraphData {
  meta: {
    n_nodes: number
    n_edges: number
    generated: string
    jaccard_threshold: number
    min_weight: number
  }
  nodes: GraphNode[]
  edges: GraphEdge[]
  algorithms: AlgorithmResults
}

export async function loadGraphData(): Promise<GraphData> {
  const res = await fetch('/data/hgt_graph.json?schema=2', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load graph data')
  const data = await res.json() as GraphData
  if (!data.algorithms.boyer_moore.parent_text) {
    throw new Error('Graph data is missing the Boyer-Moore parent DNA sequence')
  }
  return data
}
