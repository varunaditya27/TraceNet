#include "graph.h"

#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <utility>

bool Graph::loadFromFile(const std::string& filename) {
    std::ifstream input(filename);
    if (!input) {
        std::cerr << "Error: could not open graph file '" << filename << "'.\n";
        return false;
    }

    int nodeCount = 0;
    int edgeCount = 0;
    if (!(input >> nodeCount >> edgeCount) || nodeCount < 0 || edgeCount < 0) {
        std::cerr << "Error: invalid graph header in '" << filename << "'.\n";
        return false;
    }
    input.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

    std::vector<std::string> loadedNames;
    loadedNames.reserve(nodeCount);
    for (int i = 0; i < nodeCount; ++i) {
        std::string name;
        if (!std::getline(input, name) || name.empty()) {
            std::cerr << "Error: missing or empty node name at index " << i << ".\n";
            return false;
        }
        loadedNames.push_back(name);
    }

    Graph loaded;
    loaded.V = nodeCount;
    loaded.names = std::move(loadedNames);
    loaded.adj.assign(nodeCount, {});

    std::string line;
    int lineNumber = nodeCount + 3;
    bool valid = true;
    for (int i = 0; i < edgeCount; ++i, ++lineNumber) {
        if (!std::getline(input, line)) {
            std::cerr << "Error: expected " << edgeCount << " edges but found " << i << ".\n";
            return false;
        }
        if (line.empty()) {
            --i;
            continue;
        }

        std::istringstream row(line);
        int u = -1;
        int v = -1;
        if (!(row >> u >> v)) {
            std::cerr << "Warning: skipping malformed edge on line " << lineNumber << ".\n";
            valid = false;
            continue;
        }

        // The species graph uses weighted edges; the ARG dependency DAG uses u v.
        double weight = 1.0;
        bool hasWeight = false;
        std::string label;
        if (row >> weight) {
            hasWeight = true;
            std::getline(row >> std::ws, label);
        } else if (!row.eof()) {
            std::cerr << "Warning: skipping malformed edge on line " << lineNumber << ".\n";
            valid = false;
            continue;
        }
        if (hasWeight && label.empty()) {
            std::cerr << "Warning: skipping weighted edge without a label on line "
                      << lineNumber << ".\n";
            valid = false;
            continue;
        }

        if (!loaded.addEdge(u, v, weight, label)) {
            std::cerr << "Warning: skipping invalid edge on line " << lineNumber << ".\n";
            valid = false;
        }
    }

    if (!valid) {
        return false;
    }

    while (std::getline(input, line)) {
        if (line.find_first_not_of(" \t\r") != std::string::npos) {
            std::cerr << "Error: graph file contains more edges than declared.\n";
            return false;
        }
    }

    *this = std::move(loaded);
    return true;
}

bool Graph::addEdge(int u, int v, double weight, const std::string& label) {
    if (u < 0 || u >= V || v < 0 || v >= V) {
        std::cerr << "Error: edge index out of range (" << u << " -> " << v << ").\n";
        return false;
    }
    if (!std::isfinite(weight) || weight <= 0.0 || weight > 1.0) {
        std::cerr << "Error: edge weight must be a probability in (0, 1] ("
                  << u << " -> " << v << ").\n";
        return false;
    }
    adj[u].push_back({v, weight, label});
    ++E;
    return true;
}

void Graph::printGraph() const {
    std::cout << "\nGraph: " << V << " nodes, " << E << " edges\n";
    for (int u = 0; u < V; ++u) {
        std::cout << "[" << u << "] " << names[u] << ":\n";
        for (const Edge& edge : adj[u]) {
            std::cout << "  -> [" << edge.to << "] " << names[edge.to]
                      << "  weight=" << std::fixed << std::setprecision(3) << edge.weight;
            if (!edge.label.empty()) {
                std::cout << "  label=" << edge.label;
            }
            std::cout << '\n';
        }
    }
}
