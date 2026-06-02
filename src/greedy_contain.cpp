// greedy_contain.cpp
//
// Implementation of greedy containment declared in greedy_contain.h.
//
// Implementation notes:
//   - Collect all directed edges (weight, src, tgt) into a vector; sort descending
//     by weight using std::sort with a lambda comparator.
//   - For each edge in sorted order: remove it permanently via Graph::remove_edge(u,v);
//     run BFS to check if any source can still reach any target;
//     if disconnected → break and return removed edges.
//   - Use the Graph::reachable(src, tgt) helper for BFS checks (or implement
//     a local multi-source BFS that stops at the first target reached).
//   - Expected: removes approximately 141 of 144 edges on the full graph,
//     demonstrating why this greedy is impractical for real containment decisions.
//   - Write results to results/greedy_containment.txt listing each removed edge
//     with its weight and the cumulative removal count.
//   - Emit viz/containment.dot with removed edges marked in red.
