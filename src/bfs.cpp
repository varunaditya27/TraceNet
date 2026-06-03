#include "bfs.h"

#include <iostream>
#include <queue>

std::vector<int> bfs(const Graph& g, int source) {
    std::vector<int> order;
    if (source < 0 || source >= g.V) {
        std::cerr << "BFS error: source index " << source << " is invalid.\n";
        return order;
    }

    std::vector<bool> visited(g.V, false);
    std::queue<int> pending;
    visited[source] = true;
    pending.push(source);

    while (!pending.empty()) {
        int u = pending.front();
        pending.pop();
        order.push_back(u);
        for (const Edge& edge : g.adj[u]) {
            if (!visited[edge.to]) {
                visited[edge.to] = true;
                pending.push(edge.to);
            }
        }
    }

    std::cout << "\nBFS reachable order from " << g.names[source] << ":\n";
    for (int node : order) {
        std::cout << "  [" << node << "] " << g.names[node] << '\n';
    }
    return order;
}
