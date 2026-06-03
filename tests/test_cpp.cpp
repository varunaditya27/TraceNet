#include "../src/bfs.h"
#include "../src/bnb_contain.h"
#include "../src/boyer_moore.h"
#include "../src/dfs.h"
#include "../src/dijkstra.h"
#include "../src/floyd_warshall.h"
#include "../src/graph.h"
#include "../src/greedy_contain.h"
#include "../src/scc_kosaraju.h"
#include "../src/topo_sort.h"

#include <cassert>
#include <cmath>
#include <iostream>
#include <set>
#include <vector>

namespace {
bool closeEnough(double a, double b) {
    return std::abs(a - b) < 1e-9;
}

Graph makePathGraph() {
    Graph g;
    g.V = 4;
    g.names = {"A", "B", "C", "D"};
    g.adj.assign(g.V, {});
    assert(g.addEdge(0, 1, 0.5, "gene1"));
    assert(g.addEdge(1, 2, 0.5, "gene2"));
    assert(g.addEdge(0, 2, 0.2, "gene3"));
    return g;
}
}

int main() {
    Graph dag;
    assert(dag.loadFromFile("data/arg_dag.txt"));
    assert(dag.V == 10 && dag.E == 8);
    const std::vector<int> topo = topologicalSort(dag);
    assert(topo.size() == static_cast<std::size_t>(dag.V));
    std::vector<int> position(dag.V);
    for (std::size_t i = 0; i < topo.size(); ++i) {
        position[topo[i]] = static_cast<int>(i);
    }
    for (int u = 0; u < dag.V; ++u) {
        for (const Edge& edge : dag.adj[u]) {
            assert(position[u] < position[edge.to]);
        }
    }

    Graph g = makePathGraph();
    assert(!g.addEdge(-1, 0, 0.5, "bad"));
    assert(!g.addEdge(0, 3, 0.0, "bad"));
    assert(!g.addEdge(0, 3, 1.1, "bad"));

    assert((bfs(g, 0) == std::vector<int>{0, 1, 2}));
    assert((dfs(g, 0) == std::vector<int>{0, 1, 2}));
    assert(kosarajuSCC(g).size() == 4);

    std::vector<int> parent;
    const std::vector<double> dist = dijkstra(g, 0, parent);
    assert(parent[2] == 1);
    assert(closeEnough(dist[2], -std::log(0.25)));

    const std::vector<std::vector<double>> allPairs = floydWarshall(g);
    assert(closeEnough(allPairs[0][2], dist[2]));

    assert((boyerMooreSearch("AAAAA", "AAA") == std::vector<int>{0, 1, 2}));
    const auto greedy = greedyContainment(g, 1);
    assert(greedy.size() == 1);
    assert(closeEnough(std::get<2>(greedy.front()), 0.5));

    Graph containment;
    containment.V = 4;
    containment.names = {"source", "left", "right", "target"};
    containment.adj.assign(containment.V, {});
    assert(containment.addEdge(0, 1, 0.9, "a"));
    assert(containment.addEdge(0, 2, 0.8, "b"));
    assert(containment.addEdge(1, 3, 0.7, "c"));
    assert(containment.addEdge(2, 3, 0.6, "d"));
    const std::set<std::pair<int, int>> removed =
        branchAndBoundContainment(containment, 0, 2);
    assert(removed.size() == 2);
    assert(removed.count({0, 1}) == 1);
    assert(removed.count({0, 2}) == 1);

    std::cout << "\nAll C++ regression tests passed.\n";
    return 0;
}
