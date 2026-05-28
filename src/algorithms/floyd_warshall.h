// floyd_warshall.h
//
// Floyd-Warshall all-pairs shortest path algorithm.
// Used for:
// - computing all-pairs spread distance in the resistance network
// - generating vulnerability matrices
// - identifying high-risk pairs of organisms
// - suitable for dense, small-to-medium graphs
//
// Interface to add later:
// - floyd_warshall(graph) -> matrix of shortest distances
// - get_distance(matrix, u, v) -> int or float
// - detect_negative_cycles(matrix) -> bool
