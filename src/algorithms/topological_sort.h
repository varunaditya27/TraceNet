// topological_sort.h
//
// Topological sort for directed acyclic graphs (DAGs).
// Used for:
// - ordering gene dependencies
// - determining gene acquisition order based on resistance prerequisites
// - DAG-based reasoning on gene progression
//
// Interface to add later:
// - topological_sort(graph) -> vector of nodes in topological order
// - is_dag(graph) -> bool
// - sort_with_dfs(graph) -> vector of nodes
