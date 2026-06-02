// bnb_contain.h
//
// Branch-and-bound exact containment on the 10-node hospital subgraph.
//
// Purpose: find the minimum number of edges to remove to prevent environmental
// species (E. faecalis, C. jejuni — hospital subgraph nodes 8 and 9) from
// reaching Gram-positive ESKAPE targets (E. faecium, S. aureus — nodes 3 and 4).
// Contrast with greedy's approximate result (39 edges) to demonstrate optimality.
//
// Run ONLY on data/hospital_subgraph.txt (~10 nodes, 42 edges).
// NEVER run on the full 16-node graph — exponential worst case would be infeasible.
//
// Sources: hospital node 8 (E. faecalis), hospital node 9 (C. jejuni)
// Targets: hospital node 3 (E. faecium), hospital node 4 (S. aureus)
//
// Result struct to implement:
//   BnBResult {
//     vector<pair<int,int>> removed_edges  — optimal edge cut set
//     int optimal_cost                     — size of optimal cut (expected: 4)
//     int greedy_cost                      — size of greedy cut (expected: 39)
//   }
//
// Interface to implement in bnb_contain.cpp:
//   BnBResult bnb_contain(Graph& hosp, const vector<int>& sources, const vector<int>& targets)
//   void print_bnb_comparison(const BnBResult& r, const Graph& hosp)
//
// Algorithm: recursive branch-and-bound. Sort edges by weight descending.
// At each step, branch on removing or keeping the current edge.
// Pruning condition: if removed.size() + 1 >= best_cost, prune this branch.
// Initialise best_cost from the greedy solution on the hospital subgraph.
// Time: O(2^E) worst case, fast in practice with pruning (best = 4 is found early).
// Syllabus: Unit V.
