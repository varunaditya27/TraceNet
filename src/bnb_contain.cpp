// bnb_contain.cpp
//
// Implementation of branch-and-bound containment declared in bnb_contain.h.
//
// Implementation notes:
//   - Run greedy_contain on the hospital subgraph first to get the initial upper bound.
//   - Build edge list sorted by weight descending (same order as greedy).
//   - Recursive branch function: branch(idx, removed_so_far, g_mut):
//       Base case A: BFS shows sources can't reach targets → record if better than best.
//       Base case B: idx == n_edges → all edges considered, sources still connected → no solution.
//       Pruning: if removed_so_far.size() + 1 >= best_cost → return (can't improve).
//       Branch A: remove edge all_edges[idx] via Graph::remove_edge; recurse(idx+1, ...);
//                 restore via Graph::restore_edge.
//       Branch B: recurse(idx+1, ...) without removing.
//   - Use a mutable copy of the hospital subgraph's adjacency list for backtracking.
//     Restore edges exactly (same weight and labels) after Branch A returns.
//   - Expected optimal: 4 edges — the 4 direct forward edges from {8,9} to {3,4}.
//   - print_bnb_comparison: output a table comparing greedy vs B&B edge sets and costs.
//   - Write results to results/bnb_containment.txt.
