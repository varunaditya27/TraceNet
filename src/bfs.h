// bfs.h
//
// Breadth-first search on the HGT species graph.
//
// Purpose: compute hop-distance reachability from a source species node,
// revealing how many transmission steps separate it from all other species.
//
// Result struct to implement:
//   BFSResult {
//     vector<int> dist      — hop distance from source; -1 if unreachable
//     vector<int> parent    — BFS tree parent; -1 for source and unreachable
//     int reachable_count   — number of nodes with dist >= 0
//   }
//
// Interface to implement in bfs.cpp:
//   BFSResult bfs(const Graph& g, int source)
//
// Algorithm: standard iterative BFS using std::queue<int>.
// Time: O(V + E).  Space: O(V).
// Syllabus: Unit II.
