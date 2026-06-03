#ifndef TRACENET_FLOYD_WARSHALL_H
#define TRACENET_FLOYD_WARSHALL_H

#include "graph.h"

#include <vector>

std::vector<std::vector<double>> floydWarshall(const Graph& g);

#endif
