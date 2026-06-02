// graph.h
//
// Core Graph data structure for the TraceNet C++ engine.
//
// Supports two representations used by different algorithms:
//   - Adjacency list (adj, radj): used by BFS, Kosaraju SCC, Dijkstra, greedy, B&B
//   - Adjacency matrix (dist_mat): built lazily by floyd_warshall.cpp
//
// Two graph types are loaded through this struct:
//   - HGT species graph (hgt_graph.txt): weighted directed, 16 nodes, 144 edges
//   - ARG dependency DAG (arg_dag.txt):  unweighted directed, 10 nodes, 8 edges
//     Loaded with dag=true: edges have no weight or label fields in the file.
//
// Edge weights in hgt_graph.txt are raw probabilities w ∈ (0,1].
// The -log(w) distance conversion happens inside dijkstra.cpp and floyd_warshall.cpp,
// NOT here.
//
// File format for hgt_graph.txt:
//   line 1:    n_nodes
//   line 2:    n_edges
//   lines 3..n+2: node names (zero-indexed)
//   remaining: src_idx tgt_idx weight label1,label2,...
//
// File format for arg_dag.txt (dag=true):
//   Same header. Edge lines have only: src_idx tgt_idx  (no weight, no labels)
//
// Interface to implement in graph.cpp:
//   - Graph::load(path, dag=false) — parse file, build adj + radj
//   - Graph::build_matrix()        — populate dist_mat from adj (for Floyd-Warshall)
//   - Graph::index_of(name)        — return node index by name, -1 if not found
//   - Graph::reachable(src, tgt)   — BFS check: can src reach tgt?
//   - Graph::remove_edge(u, v)     — remove directed edge u→v from adj
//   - Graph::restore_edge(u, v, w, labels) — re-insert u→v (used by B&B backtrack)
