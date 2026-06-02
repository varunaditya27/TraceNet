// scc_kosaraju.h
//
// Strongly Connected Components using Kosaraju's algorithm.
//
// Purpose: identify "resistance bubbles" — groups of bacterial species that
// can spread ARGs among themselves in closed loops. In a fully bidirectional
// graph, every component is one giant SCC.
//
// This implementation uses Kosaraju (not Tarjan) because it has two clear
// separate passes that are easier to explain step-by-step in a viva:
//   Pass 1: DFS on original graph, record finish order
//   Pass 2: DFS on reverse graph in reverse finish order
//
// Result struct to implement:
//   SCCResult {
//     vector<int> component   — SCC label per node (0-indexed)
//     vector<vector<int>> groups — nodes in each SCC, sorted by label
//     int n_components
//   }
//
// Interface to implement in scc_kosaraju.cpp:
//   SCCResult kosaraju(const Graph& g)
//
// Algorithm: two-pass iterative DFS (iterative to avoid stack overflow on
// large graphs; recursive DFS would overflow for n > ~10,000).
// Time: O(V + E).  Space: O(V + E) for reverse adjacency list.
// Syllabus: Unit II.
