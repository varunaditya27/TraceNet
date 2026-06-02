// utils.h
//
// Utility functions shared across all algorithm modules.
//
// Interface to implement in utils.cpp:
//   - format_path(node_names, path_indices) → comma-separated name string
//   - write_result(filename, content)       → write string to results/ directory
//   - write_csv(filename, matrix, headers)  → write 2D vector as CSV
//   - write_dot(filename, graph, highlight) → emit Graphviz DOT for visualisation
//   - Timer class: start() / elapsed_ms()  → wall-clock benchmark for each algorithm
//
// Output directories:
//   results/  — algorithm output text files and CSV (gitignored)
//   viz/      — Graphviz DOT files (committed)
