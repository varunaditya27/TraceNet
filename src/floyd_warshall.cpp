#include "floyd_warshall.h"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>

std::vector<std::vector<double>> floydWarshall(const Graph& g) {
    const double inf = std::numeric_limits<double>::infinity();
    std::vector<std::vector<double>> dist(g.V, std::vector<double>(g.V, inf));
    for (int i = 0; i < g.V; ++i) {
        dist[i][i] = 0.0;
        for (const Edge& edge : g.adj[i]) {
            dist[i][edge.to] = std::min(dist[i][edge.to], -std::log(edge.weight));
        }
    }

    for (int k = 0; k < g.V; ++k) {
        for (int i = 0; i < g.V; ++i) {
            if (dist[i][k] == inf) {
                continue;
            }
            for (int j = 0; j < g.V; ++j) {
                if (dist[k][j] != inf && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    std::cout << "\nFloyd-Warshall all-pairs -log(probability) distance matrix:\n";
    std::cout << std::setw(8) << "";
    for (int j = 0; j < g.V; ++j) {
        std::cout << std::setw(8) << j;
    }
    std::cout << '\n';
    for (int i = 0; i < g.V; ++i) {
        std::cout << std::setw(8) << i;
        for (int j = 0; j < g.V; ++j) {
            if (dist[i][j] == inf) {
                std::cout << std::setw(8) << "INF";
            } else {
                std::cout << std::setw(8) << std::fixed << std::setprecision(2) << dist[i][j];
            }
        }
        std::cout << '\n';
    }
    return dist;
}
