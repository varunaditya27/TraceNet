#include "topo_sort.h"

#include <iostream>
#include <queue>

std::vector<int> topologicalSort(const Graph& g) {
    std::vector<int> indegree(g.V, 0);
    for (const auto& edges : g.adj) {
        for (const Edge& edge : edges) {
            ++indegree[edge.to];
        }
    }

    std::queue<int> pending;
    for (int u = 0; u < g.V; ++u) {
        if (indegree[u] == 0) {
            pending.push(u);
        }
    }

    std::vector<int> order;
    while (!pending.empty()) {
        int u = pending.front();
        pending.pop();
        order.push_back(u);
        for (const Edge& edge : g.adj[u]) {
            if (--indegree[edge.to] == 0) {
                pending.push(edge.to);
            }
        }
    }

    std::cout << "\nTopological sort:\n";
    if (static_cast<int>(order.size()) != g.V) {
        std::cout << "  Warning: graph contains a cycle; topological sort is only valid for DAGs.\n";
    } else {
        for (std::size_t i = 0; i < order.size(); ++i) {
            if (i > 0) {
                std::cout << " -> ";
            }
            std::cout << g.names[order[i]];
        }
        std::cout << '\n';
    }
    return order;
}
