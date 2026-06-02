// bfs.cpp
//
// Implementation of BFS declared in bfs.h.
//
// Implementation notes:
//   - Use std::queue<int> for the frontier
//   - Initialise dist[] to -1; set dist[source] = 0 before entering the loop
//   - Record parent[] to allow BFS tree reconstruction for visualisation
//   - Count reachable nodes (dist[i] >= 0) after BFS completes
//   - Write results to results/bfs_reachability.txt via write_result()
//   - Emit viz/bfs_tree.dot highlighting the BFS tree edges
//
// Graph has 2 components: BFS from K. pneumoniae (node 0) reaches 12/16 nodes.
// The Gram-positive component (E. faecium, S. aureus, E. faecalis, C. jejuni)
// is unreachable from node 0 — this is expected and should be reported clearly.
