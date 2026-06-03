CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
TARGET = tracenet
TEST_TARGET = tracenet_tests

CORE_SRCS = \
	src/graph.cpp \
	src/utils.cpp \
	src/bfs.cpp \
	src/dfs.cpp \
	src/scc_kosaraju.cpp \
	src/topo_sort.cpp \
	src/dijkstra.cpp \
	src/floyd_warshall.cpp \
	src/boyer_moore.cpp \
	src/greedy_contain.cpp \
	src/bnb_contain.cpp

SRCS = src/main.cpp $(CORE_SRCS)

.PHONY: all clean run test

all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

run: $(TARGET)
	./$(TARGET) data/hgt_graph.txt

test: $(TEST_TARGET)
	./$(TEST_TARGET)

$(TEST_TARGET): tests/test_cpp.cpp $(CORE_SRCS)
	$(CXX) $(CXXFLAGS) tests/test_cpp.cpp $(CORE_SRCS) -o $(TEST_TARGET)

clean:
	rm -f $(TARGET) $(TEST_TARGET)
