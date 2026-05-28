// scc.h
//
// Strongly Connected Components (SCC) algorithms.
// Implementations: Kosaraju or Tarjan algorithm.
// Used for:
// - identifying resistance "bubbles" (tightly coupled bacterial communities)
// - finding cyclic spread patterns
// - clustering organisms that share resistance in closed loops
//
// Interface to add later:
// - find_sccs(graph) -> vector of vector of nodes (each inner vector is an SCC)
// - scc_count(graph) -> int
// - tarjan_scc(graph) or kosaraju_scc(graph) -> vector of components
