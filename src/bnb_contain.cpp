#include "bnb_contain.h"

#include <algorithm>
#include <cstddef>
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

namespace {
int reachableCount(const Graph& g, int source, const std::set<std::pair<int, int>>& removed) {
    std::vector<bool> visited(g.V, false);
    std::queue<int> pending;
    visited[source] = true;
    pending.push(source);
    int count = 0;

    while (!pending.empty()) {
        int u = pending.front();
        pending.pop();
        ++count;
        for (const Edge& edge : g.adj[u]) {
            if (removed.count({u, edge.to}) == 0 && !visited[edge.to]) {
                visited[edge.to] = true;
                pending.push(edge.to);
            }
        }
    }
    return count;
}
}

std::set<std::pair<int, int>> branchAndBoundContainment(const Graph& g, int source, int k) {
    std::set<std::pair<int, int>> best;
    if (source < 0 || source >= g.V) {
        std::cerr << "Branch-and-bound error: source index " << source << " is invalid.\n";
        return best;
    }
    if (k < 0) {
        k = 0;
    }

    std::vector<std::pair<int, int>> candidates;
    std::set<std::pair<int, int>> uniqueEdges;
    for (int u = 0; u < g.V; ++u) {
        for (const Edge& edge : g.adj[u]) {
            uniqueEdges.insert({u, edge.to});
        }
    }
    candidates.assign(uniqueEdges.begin(), uniqueEdges.end());
    std::stable_sort(candidates.begin(), candidates.end(), [source](const auto& a, const auto& b) {
        return (a.first == source) > (b.first == source);
    });
    if (k > static_cast<int>(candidates.size())) {
        k = static_cast<int>(candidates.size());
    }

    int bestReachable = g.V + 1;
    std::set<std::pair<int, int>> current;
    std::function<void(std::size_t)> search = [&](std::size_t index) {
        if (bestReachable == 1) {
            return;
        }
        if (static_cast<int>(current.size()) == k) {
            int count = reachableCount(g, source, current);
            if (count < bestReachable) {
                bestReachable = count;
                best = current;
            }
            return;
        }
        const int needed = k - static_cast<int>(current.size());
        if (index >= candidates.size() ||
            static_cast<int>(candidates.size() - index) < needed) {
            return;
        }

        // Removing every remaining candidate gives a lower bound on reachability
        // for this branch. If even that cannot improve the incumbent, prune.
        std::set<std::pair<int, int>> optimisticRemoved = current;
        optimisticRemoved.insert(candidates.begin() + static_cast<std::ptrdiff_t>(index),
                                 candidates.end());
        if (reachableCount(g, source, optimisticRemoved) >= bestReachable) {
            return;
        }

        current.insert(candidates[index]);
        search(index + 1);
        current.erase(candidates[index]);
        search(index + 1);
    };
    search(0);

    std::cout << "\nBranch-and-bound containment from " << g.names[source]
              << " using " << k << " removed edges:\n";
    for (const auto& [u, v] : best) {
        std::cout << "  " << g.names[u] << " -> " << g.names[v] << '\n';
    }
    std::cout << "  Final reachable node count: " << bestReachable << '\n';
    return best;
}
