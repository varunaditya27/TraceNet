#include "scc_kosaraju.h"

#include <algorithm>
#include <iostream>

namespace {
void fillOrder(const Graph& g, int u, std::vector<bool>& visited, std::vector<int>& order) {
    visited[u] = true;
    for (const Edge& edge : g.adj[u]) {
        if (!visited[edge.to]) {
            fillOrder(g, edge.to, visited, order);
        }
    }
    order.push_back(u);
}

void collectComponent(const std::vector<std::vector<int>>& reverseAdj, int u,
                      std::vector<bool>& visited, std::vector<int>& component) {
    visited[u] = true;
    component.push_back(u);
    for (int v : reverseAdj[u]) {
        if (!visited[v]) {
            collectComponent(reverseAdj, v, visited, component);
        }
    }
}
}

std::vector<std::vector<int>> kosarajuSCC(const Graph& g) {
    std::vector<int> order;
    std::vector<bool> visited(g.V, false);
    for (int u = 0; u < g.V; ++u) {
        if (!visited[u]) {
            fillOrder(g, u, visited, order);
        }
    }

    std::vector<std::vector<int>> reverseAdj(g.V);
    for (int u = 0; u < g.V; ++u) {
        for (const Edge& edge : g.adj[u]) {
            reverseAdj[edge.to].push_back(u);
        }
    }

    std::fill(visited.begin(), visited.end(), false);
    std::vector<std::vector<int>> components;
    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        if (!visited[*it]) {
            components.emplace_back();
            collectComponent(reverseAdj, *it, visited, components.back());
        }
    }

    std::cout << "\nStrongly connected components (" << components.size() << "):\n";
    for (std::size_t i = 0; i < components.size(); ++i) {
        std::cout << "  SCC " << i + 1 << ": ";
        for (std::size_t j = 0; j < components[i].size(); ++j) {
            if (j > 0) {
                std::cout << ", ";
            }
            std::cout << g.names[components[i][j]];
        }
        std::cout << '\n';
    }
    return components;
}
