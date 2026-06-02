// scc_kosaraju.cpp
//
// Implementation of Kosaraju's SCC algorithm declared in scc_kosaraju.h.
//
// Implementation notes:
//   - Pass 1: iterative DFS on g.adj using an explicit stack<pair<int,int>>
//     to simulate the call stack. Push nodes to finish_order[] when all
//     neighbours are exhausted.
//   - Pass 2: iterate finish_order in reverse; for each unvisited node,
//     run iterative DFS on g.radj to label the SCC.
//   - g.radj is already built by Graph::load — no need to rebuild here.
//   - Expected result: 2 SCCs (one per connected component — Component A: 12
//     Gram-negative nodes; Component B: 4 Gram-positive + C. jejuni nodes).
//     Each component is internally a complete directed graph, so each forms
//     exactly one SCC.
//   - Write results to results/scc_clusters.txt
//   - Emit viz/scc_condensed.dot showing the condensation graph
