# src/algorithms

> **Note:** Algorithm implementations live directly in `src/` as individual `.h`/`.cpp` pairs, not in this subdirectory. This folder is retained for any shared algorithm utilities.

## Algorithm files (in `src/`)

| Header | Implementation | Algorithm | Syllabus |
|---|---|---|---|
| `bfs.h` | `bfs.cpp` | BFS reachability | Unit II |
| `scc_kosaraju.h` | `scc_kosaraju.cpp` | SCC — Kosaraju two-pass DFS | Unit II |
| `topo_sort.h` | `topo_sort.cpp` | Topological sort — Kahn's algorithm | Unit II |
| `boyer_moore.h` | `boyer_moore.cpp` | Boyer-Moore string matching | Unit III |
| `dijkstra.h` | `dijkstra.cpp` | Dijkstra shortest path | Unit IV |
| `floyd_warshall.h` | `floyd_warshall.cpp` | Floyd-Warshall all-pairs | Unit IV |
| `greedy_contain.h` | `greedy_contain.cpp` | Greedy approximate min-cut | Unit IV |
| `bnb_contain.h` | `bnb_contain.cpp` | Branch-and-bound exact containment | Unit V |

Each file is included via `main.cpp` and dispatched based on CLI arguments.
