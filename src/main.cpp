// main.cpp
//
// CLI entry point for the TraceNet C++ algorithm engine.
//
// Usage:
//   ./tracenet data/hgt_graph.txt [command]
//
// Commands:
//   bfs       — BFS reachability from K. pneumoniae (node 0)
//   scc       — Kosaraju strongly connected components
//   topo      — Kahn's topological sort on ARG DAG (data/arg_dag.txt)
//   bm        — Boyer-Moore pattern search on data/arg_sequences.fasta
//   dijkstra  — Dijkstra shortest paths from K. pneumoniae
//   floyd     — Floyd-Warshall all-pairs vulnerability matrix
//   greedy    — Greedy edge-removal containment (full graph)
//   bnb       — Branch-and-bound containment (hospital subgraph)
//   all       — Run all algorithms in sequence
//
// Implementation notes:
//   - Parse argv[1] as the graph file path; argv[2] as the command (default: "all")
//   - Load the HGT graph via Graph::load(argv[1])
//   - Load the ARG DAG via Graph::load("data/arg_dag.txt", /*dag=*/true) for "topo"
//   - Load hospital subgraph via Graph::load("data/hospital_subgraph.txt") for "bnb"
//   - Dispatch to the appropriate algorithm function and print results to stdout
//   - Write output files to results/ and DOT files to viz/ via utils.h helpers
//   - Print timing for each algorithm using the Timer utility
