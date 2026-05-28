// branch_and_bound.h
//
// Branch-and-bound algorithm for exact optimization on small subgraphs.
// Used for:
// - exact containment strategy on reduced graphs
// - controlled exhaustive search with pruning
// - comparing optimal containment vs greedy approximation
// - solving NP-hard subproblems to proven optimality
//
// Interface to add later:
// - branch_and_bound(graph, constraint) -> optimal solution
// - estimate_upper_bound(partial_solution) -> float or int
// - prune_branches(candidates, bound) -> filtered candidates
