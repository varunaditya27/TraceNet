#include "dijkstra.h"

#include <algorithm>
#include <cmath>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <queue>
#include <utility>

std::vector<double> dijkstra(const Graph& g, int source, std::vector<int>& parent) {
    const double inf = std::numeric_limits<double>::infinity();
    std::vector<double> dist(g.V, inf);
    parent.assign(g.V, -1);
    if (source < 0 || source >= g.V) {
        std::cerr << "Dijkstra error: source index " << source << " is invalid.\n";
        return dist;
    }

    using State = std::pair<double, int>;
    std::priority_queue<State, std::vector<State>, std::greater<State>> pending;
    dist[source] = 0.0;
    pending.push({0.0, source});

    while (!pending.empty()) {
        const auto [currentDist, u] = pending.top();
        pending.pop();
        if (currentDist > dist[u]) {
            continue;
        }
        for (const Edge& edge : g.adj[u]) {
            const double candidate = currentDist - std::log(edge.weight);
            if (candidate < dist[edge.to]) {
                dist[edge.to] = candidate;
                parent[edge.to] = u;
                pending.push({candidate, edge.to});
            }
        }
    }

    std::cout << "\nDijkstra shortest -log(probability) distances from "
              << g.names[source] << ":\n";
    for (int node = 0; node < g.V; ++node) {
        std::cout << "  " << g.names[node] << ": ";
        if (dist[node] == inf) {
            std::cout << "INF\n";
        } else {
            std::cout << std::fixed << std::setprecision(3) << dist[node] << '\n';
        }
    }
    return dist;
}

void printDijkstraPath(const Graph& g, int source, int target, const std::vector<int>& parent) {
    if (source < 0 || source >= g.V || target < 0 || target >= g.V ||
        static_cast<int>(parent.size()) != g.V) {
        std::cerr << "Path error: invalid source, target, or parent vector.\n";
        return;
    }

    std::vector<int> path;
    for (int at = target; at != -1; at = parent[at]) {
        path.push_back(at);
        if (at == source) {
            break;
        }
    }
    if (path.back() != source) {
        std::cout << "No path from " << g.names[source] << " to " << g.names[target] << ".\n";
        return;
    }

    std::reverse(path.begin(), path.end());
    std::cout << "Path: ";
    for (std::size_t i = 0; i < path.size(); ++i) {
        if (i > 0) {
            std::cout << " -> ";
        }
        std::cout << g.names[path[i]];
    }
    std::cout << '\n';
}
