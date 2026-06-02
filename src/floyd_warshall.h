// floyd_warshall.h
//
// Floyd-Warshall all-pairs shortest paths on the HGT species graph.
//
// Purpose: produce a 16×16 vulnerability matrix showing the -log(w) transmission
// distance between every species pair. The node with the lowest average incoming
// distance is the most "vulnerable" to receiving ARGs from the entire network.
//
// Uses adjacency MATRIX representation internally (not the adjacency list).
// Call Graph::build_matrix() before running Floyd-Warshall to populate g.dist_mat.
//
// Interface to implement in floyd_warshall.cpp:
//   void floyd_warshall(Graph& g)   — modifies g.dist_mat in place
//   vector<double> vulnerability_scores(const Graph& g)  — avg incoming distance per node
//   void export_fw_csv(const Graph& g, const string& path)  — write CSV matrix
//
// Algorithm: triple-nested loop over (k, i, j).
// Time: O(V³) = 16³ = 4,096 operations.  Space: O(V²) for the matrix.
// Syllabus: Unit IV.
