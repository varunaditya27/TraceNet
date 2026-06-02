# src

C++ implementation of the TraceNet graph engine. One `.h`/`.cpp` pair per algorithm. All files compile to a single `tracenet` binary.

## File list

| File | Purpose |
|---|---|
| `main.cpp` | CLI argument parsing and algorithm dispatch |
| `graph.h` / `graph.cpp` | Graph struct, adjacency list + matrix, I/O parsing of `hgt_graph.txt` |
| `bfs.h` / `bfs.cpp` | BFS reachability — hop distances from source |
| `scc_kosaraju.h` / `scc_kosaraju.cpp` | Strongly connected components — Kosaraju two-pass DFS |
| `topo_sort.h` / `topo_sort.cpp` | Topological sort (Kahn's algorithm) on ARG dependency DAG |
| `boyer_moore.h` / `boyer_moore.cpp` | Boyer-Moore string matching on ARG FASTA sequences |
| `dijkstra.h` / `dijkstra.cpp` | Single-source shortest path — converts edge weight `w` to `-log(w)` internally |
| `floyd_warshall.h` / `floyd_warshall.cpp` | All-pairs shortest paths — requires adjacency matrix, not list |
| `greedy_contain.h` / `greedy_contain.cpp` | Greedy approximate min-cut — sorts edges by weight descending |
| `bnb_contain.h` / `bnb_contain.cpp` | Branch-and-bound exact containment — runs only on `hospital_subgraph.txt` |

## Build

```bash
make
# or directly:
g++ -std=c++17 main.cpp graph.cpp bfs.cpp scc_kosaraju.cpp topo_sort.cpp \
    boyer_moore.cpp dijkstra.cpp floyd_warshall.cpp greedy_contain.cpp bnb_contain.cpp \
    -o tracenet
```

## Design notes

- `graph.h` must support both adjacency lists (BFS, DFS, Dijkstra, SCC, greedy) and adjacency matrix (Floyd-Warshall). Build the matrix from the list on demand.
- Edge weights stored in `hgt_graph.txt` are raw probabilities `w ∈ (0, 1]`. The `-log(w)` transformation to distances happens inside `dijkstra.cpp` and `floyd_warshall.cpp`, not at load time.
- SCC uses **Kosaraju** (two-pass DFS on G and Gᵀ). Tarjan is not used.
- Topological sort uses **Kahn's algorithm** (BFS in-degree). Operates on `data/arg_dag.txt`, never on the species HGT graph.
- B&B operates only on `data/hospital_subgraph.txt` (~10 nodes). Never run on the full 16-node graph.
