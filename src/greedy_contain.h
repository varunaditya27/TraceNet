// greedy_contain.h
//
// Greedy edge-removal containment on the full 16-node HGT species graph.
//
// Purpose: approximate the minimum edge set to prevent environmental reservoir
// species (E. faecalis, C. jejuni) from spreading ARGs to clinical ESKAPE targets.
// Only Gram-positive ESKAPE targets (E. faecium, S. aureus) are reachable from
// the environmental sources — the two-component structure means Gram-negative
// ESKAPE is unreachable from Gram-positive reservoirs by definition.
//
// Algorithm: sort ALL directed edges by weight descending; remove each edge
// permanently; stop as soon as sources can no longer reach targets via BFS.
// Because edges are removed regardless of whether they directly contribute to
// the cut, this greedy OVER-removes (removes many irrelevant high-weight edges
// within Component A before reaching the actual cut edges). This is intentional:
// the over-removal demonstrates why greedy is a poor approximation for large
// graphs, motivating the exact B&B approach on the smaller hospital subgraph.
//
// Sources: E. faecalis (index 14), C. jejuni (index 15)
// Targets: E. faecium (index 3), S. aureus (index 4)
//
// Interface to implement in greedy_contain.cpp:
//   GreedyResult greedy_contain(Graph& g, const vector<int>& sources, const vector<int>& targets)
//
// Time: O(E log E + k(V+E)) where k = edges removed.  Space: O(V + E).
// Syllabus: Unit IV.
