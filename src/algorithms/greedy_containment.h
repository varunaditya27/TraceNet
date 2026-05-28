// greedy_containment.h
//
// Greedy approximation heuristic for edge removal (containment strategy).
// Used for:
// - ranking edges by importance or centrality
// - approximate intervention selection (which transmissions to block first)
// - low-cost blocking heuristics for resistance containment
// - comparison baseline against exact branch-and-bound
//
// Interface to add later:
// - greedy_edge_removal(graph, num_edges_to_remove) -> vector of edges to remove
// - edge_centrality_score(graph, edge) -> float
// - rank_edges_by_importance(graph) -> vector of edges (sorted by impact)
