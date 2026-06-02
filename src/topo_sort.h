// topo_sort.h
//
// Topological sort on the ARG dependency DAG using Kahn's algorithm.
//
// Purpose: determine the order in which resistance gene families are typically
// acquired, modelling the escalation pathway from basic mobile ARGs (tetM, sul1)
// toward pan-resistance (blaNDM1) and last-resort resistance (mcr1, vanA).
//
// Operates on the ARG DAG (data/arg_dag.txt), NOT on the HGT species graph.
// The DAG has 10 nodes and 8 directed edges; vanA is an isolated node.
//
// Result struct to implement:
//   TopoResult {
//     vector<int> order    — node indices in topological order
//     bool has_cycle       — true if |order| < n (cycle detected)
//   }
//
// Interface to implement in topo_sort.cpp:
//   TopoResult kahn_topo(const Graph& dag)
//
// Algorithm: Kahn's BFS-based algorithm using an in-degree array and queue.
// If output size < |V|, a cycle exists — assert/fail with a clear error message
// since the arg_dag.txt is hand-curated to be acyclic.
// Time: O(V + E).  Space: O(V).
// Syllabus: Unit II.
