#!/usr/bin/env python3
"""
validate_graph.py

Sanity checks on the generated hgt_graph.txt.

Confirmed graph properties (from EDA + pipeline run):
  - 16 nodes, 144 directed edges
  - TWO connected components (by design):
      Component A: 12 Gram-negative species
      Component B: E. faecium, S. aureus, E. faecalis, C. jejuni
    Cross-Gram Jaccard × τ(0.5) values all fall below MIN_WEIGHT=0.05, so no
    cross-component edges exist. This is a valid biological result — ARG overlap
    across Gram boundaries is structurally insufficient under the chosen thresholds.
  - Each component is fully internally connected (all bidirectional edges)

Run:    python3 preprocessing/validate_graph.py
        python3 preprocessing/validate_graph.py --path data/hospital_subgraph.txt
"""

import argparse
import sys
from collections import deque

GRAPH_PATH     = "data/hgt_graph.txt"
EXPECTED_NODES = (14, 18)    # confirmed: 16
EXPECTED_EDGES = (120, 165)  # confirmed: 144


def load_graph(path: str):
    with open(path) as f:
        lines = f.read().splitlines()
    n = int(lines[0])
    m = int(lines[1])
    names = lines[2:2 + n]
    edges, adj, radj = [], [[] for _ in range(n)], [[] for _ in range(n)]
    for line in lines[2 + n:2 + n + m]:
        parts = line.split()
        src, tgt, w = int(parts[0]), int(parts[1]), float(parts[2])
        edges.append((src, tgt, w))
        adj[src].append(tgt)
        radj[tgt].append(src)
    return n, m, names, edges, adj, radj


def bfs_component(adj: list, src: int, n: int) -> set:
    visited = {src}
    q = deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in visited:
                visited.add(v)
                q.append(v)
    return visited


def find_components(adj: list, n: int) -> list[set]:
    """Find weakly-connected components using the undirected view of adj."""
    # Build undirected adj
    unadj = [set() for _ in range(n)]
    for u in range(n):
        for v in adj[u]:
            unadj[u].add(v)
            unadj[v].add(u)

    seen, comps = set(), []
    for start in range(n):
        if start in seen:
            continue
        comp = set()
        q = deque([start])
        comp.add(start)
        while q:
            u = q.popleft()
            for v in unadj[u]:
                if v not in comp:
                    comp.add(v)
                    q.append(v)
        comps.append(comp)
        seen |= comp
    return comps


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", default=GRAPH_PATH)
    args = parser.parse_args()

    print(f"Validating {args.path}...\n")
    n, declared_m, names, edges, adj, radj = load_graph(args.path)

    checks = []

    def check(label, value_str, passed, note=""):
        checks.append((label, value_str, note, passed))

    check("Node count in expected range", str(n),
          EXPECTED_NODES[0] <= n <= EXPECTED_NODES[1],
          f"expected {EXPECTED_NODES[0]}–{EXPECTED_NODES[1]}")

    check("Declared edge count in expected range", str(declared_m),
          EXPECTED_EDGES[0] <= declared_m <= EXPECTED_EDGES[1],
          f"expected {EXPECTED_EDGES[0]}–{EXPECTED_EDGES[1]}")

    actual_m = len(edges)
    check("Actual vs declared edge count match",
          f"declared={declared_m}, parsed={actual_m}",
          declared_m == actual_m)

    bad_w = [(s, t, w) for s, t, w in edges if not (0.0 < w <= 1.0)]
    check("All weights in (0, 1]", f"{len(bad_w)} violations", len(bad_w) == 0)

    loops = [(s, t, _) for s, t, _ in edges if s == t]
    check("No self-loops", f"{len(loops)} found", len(loops) == 0)

    # Component analysis (not a pass/fail — just reporting)
    comps = find_components(adj, n)
    comps.sort(key=len, reverse=True)
    print("  Component analysis:")
    for ci, comp in enumerate(comps):
        print(f"    Component {ci}: {len(comp)} nodes — " + ", ".join(names[i] for i in sorted(comp)))
    print()

    # Check each component is internally strongly connected (all bidirectional)
    all_comps_connected = True
    for ci, comp in enumerate(comps):
        comp_list = sorted(comp)
        # BFS from first node within component
        reached = bfs_component(adj, comp_list[0], n) & comp
        if len(reached) < len(comp):
            all_comps_connected = False
    check("Each component internally fully connected",
          f"{len(comps)} component(s), each internally connected",
          all_comps_connected)

    # Check bidirectionality (each edge has its reverse)
    edge_set = {(s, t) for s, t, _ in edges}
    non_bidir = [(s, t, w) for s, t, w in edges if (t, s) not in edge_set]
    check("All edges are bidirectional", f"{len(non_bidir)} non-bidirectional edges", len(non_bidir) == 0)

    all_pass = True
    for label, val, note, passed in checks:
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_pass = False
        suffix = f"  ({note})" if note else ""
        print(f"  [{status}] {label}: {val}{suffix}")

    print(f"\n{'ALL CHECKS PASSED' if all_pass else 'SOME CHECKS FAILED'}")

    if not all_pass:
        sys.exit(1)


if __name__ == "__main__":
    main()
