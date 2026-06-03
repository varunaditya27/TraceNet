#include "dfs.h"

#include <iostream>

namespace {
void dfsVisit(const Graph& g, int u, std::vector<bool>& visited, std::vector<int>& order) {
    visited[u] = true;
    order.push_back(u);
    for (const Edge& edge : g.adj[u]) {
        if (!visited[edge.to]) {
            dfsVisit(g, edge.to, visited, order);
        }
    }
}
}

std::vector<int> dfs(const Graph& g, int source) {
    std::vector<int> order;
    if (source < 0 || source >= g.V) {
        std::cerr << "DFS error: source index " << source << " is invalid.\n";
        return order;
    }

    std::vector<bool> visited(g.V, false);
    dfsVisit(g, source, visited, order);

    std::cout << "\nDFS traversal order from " << g.names[source] << ":\n";
    for (int node : order) {
        std::cout << "  [" << node << "] " << g.names[node] << '\n';
    }
    return order;
}
