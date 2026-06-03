#ifndef TRACENET_BNB_CONTAIN_H
#define TRACENET_BNB_CONTAIN_H

#include "graph.h"

#include <set>
#include <utility>

std::set<std::pair<int, int>> branchAndBoundContainment(const Graph& g, int source, int k);

#endif
