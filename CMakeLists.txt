# CMakeLists.txt — TraceNet C++ engine (CMake alternative to Makefile)
#
# Use the Makefile for day-to-day builds. This file exists for IDE integration
# (VS Code, CLion) and as an alternative build path.
#
# Implementation: populate the cmake_minimum_required, project, standard,
# sources, and add_executable calls below.
#
# cmake_minimum_required(VERSION 3.16)
# project(TraceNet CXX)
# set(CMAKE_CXX_STANDARD 17)
# set(CMAKE_CXX_STANDARD_REQUIRED ON)
#
# set(SOURCES
#     src/main.cpp
#     src/graph.cpp
#     src/utils.cpp
#     src/bfs.cpp
#     src/scc_kosaraju.cpp
#     src/topo_sort.cpp
#     src/boyer_moore.cpp
#     src/dijkstra.cpp
#     src/floyd_warshall.cpp
#     src/greedy_contain.cpp
#     src/bnb_contain.cpp
# )
#
# add_executable(tracenet ${SOURCES})
# target_compile_options(tracenet PRIVATE -Wall -O2)
