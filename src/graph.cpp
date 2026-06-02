// graph.cpp
//
// Implementation of Graph methods declared in graph.h.
//
// Key responsibilities:
//   - Parse hgt_graph.txt and arg_dag.txt into the Graph struct
//   - Build adjacency list (adj) and reverse adjacency list (radj) from file
//   - Build O(V²) distance matrix (dist_mat) for Floyd-Warshall on demand
//   - Provide remove_edge / restore_edge for non-destructive B&B backtracking
//
// Implementation notes:
//   - Use std::getline + std::istringstream for line-by-line parsing
//   - Edge labels are comma-split strings stored in std::vector<std::string>
//   - dist_mat entries are -log(weight); INF for missing edges; 0 on diagonal
//   - remove_edge and restore_edge modify adj in place; radj stays unchanged
//     (Kosaraju reads radj only once before containment modifies adj)
