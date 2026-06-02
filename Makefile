# Makefile — TraceNet C++ engine
#
# Primary build system. Compiles all source files into a single binary.
#
# Usage:
#   make          — build ./tracenet (default target)
#   make clean    — remove build artefacts
#   make run      — build and run with default graph file
#
# Compiler: g++ with C++17 standard
# All source files live in src/; one .cpp per algorithm module.
#
# Implementation note: populate CXX, CXXFLAGS, SRCS, TARGET, and the
# default / clean / run targets below.

CXX      = g++
CXXFLAGS = -std=c++17 -Wall -O2

TARGET = tracenet

SRCS = \
    src/main.cpp         \
    src/graph.cpp        \
    src/utils.cpp        \
    src/bfs.cpp          \
    src/scc_kosaraju.cpp \
    src/topo_sort.cpp    \
    src/boyer_moore.cpp  \
    src/dijkstra.cpp     \
    src/floyd_warshall.cpp \
    src/greedy_contain.cpp \
    src/bnb_contain.cpp

# Build targets to implement:
#   $(TARGET): $(SRCS)
#       $(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)
#
#   clean:
#       rm -f $(TARGET)
#
#   run: $(TARGET)
#       ./$(TARGET) data/hgt_graph.txt all
