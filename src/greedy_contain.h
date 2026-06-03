#ifndef TRACENET_GREEDY_CONTAIN_H
#define TRACENET_GREEDY_CONTAIN_H

#include "graph.h"

#include <string>
#include <tuple>
#include <vector>

std::vector<std::tuple<int, int, double, std::string>> greedyContainment(const Graph& g, int k);

#endif
