#include "greedy_contain.h"

#include <algorithm>
#include <iostream>

std::vector<std::tuple<int, int, double, std::string>> greedyContainment(const Graph& g, int k) {
    std::vector<std::tuple<int, int, double, std::string>> edges;
    for (int u = 0; u < g.V; ++u) {
        for (const Edge& edge : g.adj[u]) {
            edges.emplace_back(u, edge.to, edge.weight, edge.label);
        }
    }
    std::sort(edges.begin(), edges.end(), [](const auto& a, const auto& b) {
        return std::get<2>(a) > std::get<2>(b);
    });

    if (k < 0) {
        k = 0;
    }
    if (static_cast<std::size_t>(k) < edges.size()) {
        edges.resize(k);
    }

    std::cout << "\nGreedy containment: top " << edges.size() << " high-risk edges to remove:\n";
    for (const auto& [u, v, weight, label] : edges) {
        std::cout << "  " << g.names[u] << " -> " << g.names[v] << "  weight=" << weight;
        if (!label.empty()) {
            std::cout << "  label=" << label;
        }
        std::cout << '\n';
    }
    return edges;
}
