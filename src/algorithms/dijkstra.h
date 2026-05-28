// dijkstra.h
//
// Dijkstra's shortest path algorithm.
// Used for:
// - finding the most likely (lowest-cost) spread path from source to target
// - single-source shortest path analysis
// - identifying critical transmission routes to clinical pathogens
// - risk tracing in the resistance network
//
// Interface to add later:
// - dijkstra(graph, source) -> vector of distances from source
// - dijkstra_path(graph, source, target) -> vector of nodes (the path)
// - reconstruct_path(distances, source, target) -> vector of nodes
