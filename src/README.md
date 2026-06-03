# src

C++ implementation of the TraceNet graph engine. One `.h`/`.cpp` pair per algorithm. All files compile to a single `tracenet` binary.

## File list

| File | Purpose |
|---|---|
| `main.cpp` | CLI entry point and algorithm demo runner |
| `graph.h` / `graph.cpp` | Weighted directed graph, validation, and graph/DAG file parsing |
| `bfs.h` / `bfs.cpp` | BFS reachability order |
| `dfs.h` / `dfs.cpp` | DFS traversal order |
| `scc_kosaraju.h` / `scc_kosaraju.cpp` | Strongly connected components — Kosaraju two-pass DFS |
| `topo_sort.h` / `topo_sort.cpp` | Topological sort (Kahn's algorithm) on ARG dependency DAG |
| `boyer_moore.h` / `boyer_moore.cpp` | Boyer-Moore string matching on ARG FASTA sequences |
| `dijkstra.h` / `dijkstra.cpp` | Single-source shortest path — converts edge weight `w` to `-log(w)` internally |
| `floyd_warshall.h` / `floyd_warshall.cpp` | All-pairs shortest paths using an internal distance matrix |
| `greedy_contain.h` / `greedy_contain.cpp` | Top-k high-risk edge ranking |
| `bnb_contain.h` / `bnb_contain.cpp` | Exact k-edge containment for small graphs |

## Build

```bash
make
make test
./tracenet data/hgt_graph.txt
```

## Design notes

- Algorithms use the graph adjacency list. Floyd-Warshall builds its distance matrix internally.
- Edge weights stored in `hgt_graph.txt` are raw probabilities `w ∈ (0, 1]`. The `-log(w)` transformation to distances happens inside `dijkstra.cpp` and `floyd_warshall.cpp`, not at load time.
- SCC uses **Kosaraju** (two-pass DFS on G and Gᵀ). Tarjan is not used.
- Topological sort uses **Kahn's algorithm** (BFS in-degree). Operates on `data/arg_dag.txt`, never on the species HGT graph.
- Branch-and-bound tries combinations of exactly `k` removed edges and should only be used on small graphs.
