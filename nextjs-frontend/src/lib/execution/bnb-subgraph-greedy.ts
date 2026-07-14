import type { GraphData } from '../graph-data'

export interface SubgraphEdge {
  src: number
  tgt: number
  weight: number
}

interface SubgraphGreedyResult {
  edges: SubgraphEdge[]
  removed: SubgraphEdge[]
  cost: number
}

const cache = new WeakMap<GraphData, SubgraphGreedyResult>()

// Maps the hospital subgraph's real directed edges (weighted) from global node ids to the
// local 0-9 indices used throughout bnb.ts / hospital_node_names. Single source of truth so
// the rendered subgraph and the greedy computation below can never disagree with each other.
export function getHospitalSubgraphEdges(data: GraphData): SubgraphEdge[] {
  const bnb = data.algorithms.bnb_contain
  const globalByName = new Map(data.nodes.map(node => [node.name, node.id]))
  const localByGlobal = new Map(
    bnb.hospital_node_names
      .map((name, localId) => [globalByName.get(name), localId] as const)
      .filter((entry): entry is readonly [number, number] => entry[0] !== undefined)
  )
  return data.edges.flatMap(edge => {
    const src = localByGlobal.get(edge.src)
    const tgt = localByGlobal.get(edge.tgt)
    return src === undefined || tgt === undefined ? [] : [{ src, tgt, weight: edge.weight }]
  })
}

// The dataset's precomputed `bnb.greedy_cost` / `greedy_removed` fields are NOT actually a
// greedy run confined to this subgraph — verified they're the subset of the full 16-node
// greedy_contain result (141 removals across the whole graph) that happens to land on
// subgraph edges. The hospital subgraph is two disconnected clusters (confirmed: zero edges
// connect them), and 30 of those 39 "subgraph" removals sit entirely inside the cluster that
// has no bearing on whether the sources can reach the targets at all. That makes the stored
// "greedy vs optimal" comparison not apples-to-apples, despite every piece of copy around it
// (panel label "Greedy (subgraph)", pseudocode line 8, resultInterpretation) claiming it is.
// This runs the real greedy heuristic — sort by descending weight, remove one at a time,
// recheck reachability, stop once no source reaches any target — using only real subgraph
// edges, so the comparison against the exact B&B result is honest.
export function computeSubgraphGreedy(data: GraphData): SubgraphGreedyResult {
  const cached = cache.get(data)
  if (cached) return cached

  const bnb = data.algorithms.bnb_contain
  const edges = getHospitalSubgraphEdges(data)
  const sorted = [...edges].sort((a, b) => b.weight - a.weight)
  const sources = bnb.sources
  const targets = new Set(bnb.targets)

  const removedSet = new Set<string>()
  const removed: SubgraphEdge[] = []

  const anySourceReachesTarget = (): boolean => {
    const adjacency = new Map<number, number[]>()
    sorted.forEach(edge => {
      if (removedSet.has(`${edge.src}-${edge.tgt}`)) return
      const list = adjacency.get(edge.src) ?? []
      list.push(edge.tgt)
      adjacency.set(edge.src, list)
    })
    for (const source of sources) {
      const visited = new Set<number>([source])
      const queue = [source]
      while (queue.length > 0) {
        const current = queue.shift()!
        if (targets.has(current)) return true
        for (const next of adjacency.get(current) ?? []) {
          if (!visited.has(next)) {
            visited.add(next)
            queue.push(next)
          }
        }
      }
    }
    return false
  }

  for (const edge of sorted) {
    removedSet.add(`${edge.src}-${edge.tgt}`)
    removed.push(edge)
    if (!anySourceReachesTarget()) break
  }

  const result: SubgraphGreedyResult = { edges, removed, cost: removed.length }
  cache.set(data, result)
  return result
}
