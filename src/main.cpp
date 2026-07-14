#include "bfs.h"
#include "bnb_contain.h"
#include "boyer_moore.h"
#include "dfs.h"
#include "dijkstra.h"
#include "floyd_warshall.h"
#include "graph.h"
#include "greedy_contain.h"
#include "scc_kosaraju.h"
#include "topo_sort.h"

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <graph-file>\n";
        return 1;
    }

    Graph graph;
    if (!graph.loadFromFile(argv[1])) {
        return 1;
    }
    if (graph.V == 0) {
        std::cerr << "Error: graph has no nodes.\n";
        return 1;
    }

    graph.printGraph();
    const std::vector<int> bfsOrder = bfs(graph, 0);
    dfs(graph, 0);
    kosarajuSCC(graph);

    Graph dag;
    if (dag.loadFromFile("data/arg_dag.txt")) {
        topologicalSort(dag);
    } else {
        std::cerr << "Warning: skipping topological sort because data/arg_dag.txt "
                     "could not be loaded.\n";
    }

    std::vector<int> parent;
    dijkstra(graph, 0, parent);
    if (bfsOrder.size() > 1) {
        printDijkstraPath(graph, 0, bfsOrder.back(), parent);
    }
    floydWarshall(graph);
    greedyContainment(graph, 3);
    branchAndBoundContainment(graph, 0, 2);

    std::string text = readFastaFile("data/arg_sequences.fasta");
    std::string pattern;
    if (text.empty()) {
        text = "ACGTACGTGACGTTACGTACGT";
        pattern = "ACGT";
        std::cout << "\nBoyer-Moore demo using sample DNA text.\n";
    } else {
        constexpr std::size_t patternStart = 137;
        constexpr std::size_t patternLength = 18;
        pattern = patternStart < text.size()
            ? text.substr(patternStart, std::min(patternLength, text.size() - patternStart))
            : text.substr(0, std::min(patternLength, text.size()));
        std::cout << "\nBoyer-Moore demo using data/arg_sequences.fasta.\n";
    }
    const std::vector<int> matches = boyerMooreSearch(text, pattern);
    std::cout << "  Pattern: " << pattern << "\n  Match positions:";
    for (int position : matches) {
        std::cout << ' ' << position;
    }
    if (matches.empty()) {
        std::cout << " none";
    }
    std::cout << '\n';

    return 0;
}
