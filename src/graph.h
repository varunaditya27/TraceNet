#ifndef TRACENET_GRAPH_H
#define TRACENET_GRAPH_H

#include <string>
#include <vector>

struct Edge {
    int to;
    double weight;
    std::string label;
};

class Graph {
public:
    int V = 0;
    int E = 0;
    std::vector<std::string> names;
    std::vector<std::vector<Edge>> adj;

    bool loadFromFile(const std::string& filename);
    bool addEdge(int u, int v, double weight, const std::string& label);
    void printGraph() const;
};

#endif
