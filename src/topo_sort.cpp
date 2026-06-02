// topo_sort.cpp
//
// Implementation of Kahn's topological sort declared in topo_sort.h.
//
// Implementation notes:
//   - Compute in-degree array by iterating over all edges in dag.adj
//   - Initialise queue with all nodes where in_degree == 0
//     (expected: tetM=0, sul1=1, aac6Ib=4, vanA=9 — nodes with no prerequisites)
//   - Process queue: pop node, append to order[], decrement in-degree of neighbours,
//     push neighbours with in-degree 0
//   - After loop: if order.size() < dag.n, a cycle was introduced — print error
//   - Expected topological order (one valid answer):
//     tetM → sul1 → blaTEM → blaSHV → aac6Ib → blaCTXM → blaOXA48 → blaNDM1 → mcr1
//     vanA appears somewhere (isolated node, may appear at any position)
//   - Write results to results/topo_order.txt with one name per line
