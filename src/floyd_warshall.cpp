// floyd_warshall.cpp
//
// Implementation of Floyd-Warshall declared in floyd_warshall.h.
//
// Implementation notes:
//   - Call g.build_matrix() first; g.dist_mat[i][j] = -log(w) for direct edges,
//     0 for diagonal, INF for absent edges.
//   - Triple loop: for k in 0..n: for i in 0..n: for j in 0..n:
//       if dist[i][k] + dist[k][j] < dist[i][j]: relax
//   - Skip relaxation when dist[i][k] == INF to avoid inf + inf arithmetic issues.
//   - vulnerability_scores: for each node tgt, compute mean of dist[src][tgt]
//     over all src != tgt where dist[src][tgt] < INF.
//     A lower score = more reachable from many sources = more vulnerable.
//   - The two components (Gram-negative and Gram-positive) will show INF distances
//     between them — this is expected and should be reported clearly.
//   - export_fw_csv: write results/vulnerability_matrix.csv with node names as
//     row/column headers and rounded distances (3 decimal places, "INF" for infinity).
