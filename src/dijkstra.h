// dijkstra.h
//
// Dijkstra's shortest-path algorithm on the HGT species graph.
//
// Purpose: find the highest-probability transmission path between species pairs.
// Edge weights w ∈ (0,1] are probabilities; Dijkstra minimises -log(w) distance
// so that higher probability = shorter distance = preferred path.
//
// The -log(w) transformation happens INSIDE this file's implementation,
// not in preprocessing. The graph file stores raw probabilities.
//
// Result struct to implement:
//   DijkstraResult {
//     vector<double> dist   — -log(w) distances from source; INF if unreachable
//     vector<int> parent    — shortest-path tree parent; -1 for unreachable
//     vector<int> settled   — nodes in order they were settled (for animation)
//   }
//
// Interface to implement in dijkstra.cpp:
//   DijkstraResult dijkstra(const Graph& g, int source)
//   vector<int> reconstruct_path(const DijkstraResult& r, int src, int tgt)
//
// Algorithm: min-heap priority_queue<pair<double,int>>.
// Time: O((V + E) log V).  Space: O(V).
// Syllabus: Unit IV.
