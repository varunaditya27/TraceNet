# src/algorithms

Individual header files for each DAA algorithm.

- `bfs_dfs.h` — Graph traversal and reachability
- `scc.h` — Strongly connected components (Kosaraju / Tarjan)
- `topological_sort.h` — Gene dependency ordering
- `boyer_moore.h` — Pattern matching in ARG sequences
- `floyd_warshall.h` — All-pairs shortest paths
- `dijkstra.h` — Single-source shortest paths
- `greedy_containment.h` — Approximate containment heuristic
- `branch_and_bound.h` — Exact optimization on small subgraphs

Each file should be included in `main.cpp` and called as needed based on CLI arguments.
