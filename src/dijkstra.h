#ifndef TRACENET_DIJKSTRA_H
#define TRACENET_DIJKSTRA_H

#include "graph.h"

#include <vector>

std::vector<double> dijkstra(const Graph& g, int source, std::vector<int>& parent);
void printDijkstraPath(const Graph& g, int source, int target, const std::vector<int>& parent);

#endif
