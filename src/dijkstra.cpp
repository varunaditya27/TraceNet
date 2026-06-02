// dijkstra.cpp
//
// Implementation of Dijkstra's algorithm declared in dijkstra.h.
//
// Implementation notes:
//   - Convert edge weight w to distance: d = -log(w) using std::log().
//     Use std::numeric_limits<double>::infinity() for INF.
//   - Priority queue: std::priority_queue<pair<double,int>, vector<...>, greater<...>>
//     (min-heap: smallest distance first).
//   - Lazy deletion: skip (d, u) if d > dist[u] (already settled with shorter path).
//   - Highest-probability path = smallest -log(w) distance = most likely spread route.
//   - Run from K. pneumoniae (node 0) as default source.
//   - Expected: highest-probability pair is E. faecium → E. faecalis (w=0.714,
//     distance = -log(0.714) ≈ 0.337). Most vulnerable node: K. pneumoniae
//     (shortest average incoming distance across all sources).
//   - Write results to results/dijkstra_path.txt and viz/dijkstra_path.dot
