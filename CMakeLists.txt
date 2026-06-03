cmake_minimum_required(VERSION 3.16)
project(TraceNet LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(TRACENET_CORE_SOURCES
    src/graph.cpp
    src/utils.cpp
    src/bfs.cpp
    src/dfs.cpp
    src/scc_kosaraju.cpp
    src/topo_sort.cpp
    src/dijkstra.cpp
    src/floyd_warshall.cpp
    src/boyer_moore.cpp
    src/greedy_contain.cpp
    src/bnb_contain.cpp
)

add_executable(tracenet src/main.cpp ${TRACENET_CORE_SOURCES})
target_compile_options(tracenet PRIVATE -Wall -Wextra)

enable_testing()
add_executable(tracenet_tests tests/test_cpp.cpp ${TRACENET_CORE_SOURCES})
target_compile_options(tracenet_tests PRIVATE -Wall -Wextra)
add_test(NAME tracenet_cpp_tests COMMAND tracenet_tests)
set_tests_properties(tracenet_cpp_tests PROPERTIES WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})
