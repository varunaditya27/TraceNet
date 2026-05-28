# src

C++ implementation of the core graph algorithms: BFS/DFS, SCC (Kosaraju/Tarjan), Dijkstra, Floyd-Warshall, greedy containment, and branch-and-bound for small subproblems.

Structure suggestion:
- `main.cpp` : program entry that loads the adjacency file and dispatches algorithms based on CLI options.
- `graph.h` / `graph.cpp` : lightweight graph data structure and I/O utilities.
- `algorithms/` : implementations of each algorithm (one file per algorithm).

Keep code modular and well-documented for demonstration in presentations.
