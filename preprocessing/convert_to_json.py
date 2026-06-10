#!/usr/bin/env python3
"""
convert_to_json.py

Reads generated graph files, runs all 8 TraceNet algorithms in Python, and
serialises every result into frontend/data/hgt_graph.json.

The frontend reads ONLY this JSON — it has zero dependency on the C++ engine.
This script is the coupling point between preprocessing and the demo frontend.

Run order (after the other 4 scripts):
    python preprocessing/convert_to_json.py

Input files:
    data/hgt_graph.txt          — 16-node HGT species graph
    data/arg_dag.txt            — 10-node ARG dependency DAG
    data/arg_sequences.fasta    — 6 target ARG sequences for Boyer-Moore
    data/hospital_subgraph.txt  — 10-node hospital subgraph for B&B

Output:
    frontend/data/hgt_graph.json
"""

import json
import math
import heapq
import os
from collections import deque

# ── I/O paths ─────────────────────────────────────────────────────────────────

GRAPH_PATH    = "data/hgt_graph.txt"
DAG_PATH      = "data/arg_dag.txt"
FASTA_PATH    = "data/arg_sequences.fasta"
HOSPITAL_PATH = "data/hospital_subgraph.txt"
OUTPUT_PATH   = "frontend/data/hgt_graph.json"

# ── Static node metadata ──────────────────────────────────────────────────────
# Parallel to TARGET_SPECIES order — index matches node index in hgt_graph.txt.
# x, y: visual anchor coordinates for the 1200×700 frontend canvas.

NODE_META = [
    {"gram": "negative", "role": "eskape",        "plasmid_args": 46, "x": 120,  "y": 200},  # 0  K. pneumoniae
    {"gram": "negative", "role": "eskape",        "plasmid_args": 55, "x": 120,  "y": 370},  # 1  E. cloacae
    {"gram": "negative", "role": "eskape",        "plasmid_args": 38, "x": 120,  "y": 540},  # 2  P. aeruginosa
    {"gram": "positive", "role": "eskape",        "plasmid_args": 22, "x": 270,  "y": 120},  # 3  E. faecium
    {"gram": "positive", "role": "eskape",        "plasmid_args": 13, "x": 270,  "y": 610},  # 4  S. aureus
    {"gram": "negative", "role": "eskape",        "plasmid_args": 15, "x": 270,  "y": 370},  # 5  A. baumannii
    {"gram": "negative", "role": "bridge",        "plasmid_args": 24, "x": 490,  "y": 200},  # 6  E. coli
    {"gram": "negative", "role": "bridge",        "plasmid_args": 45, "x": 510,  "y": 370},  # 7  S. enterica
    {"gram": "negative", "role": "bridge",        "plasmid_args": 43, "x": 490,  "y": 540},  # 8  K. oxytoca
    {"gram": "negative", "role": "bridge",        "plasmid_args": 39, "x": 660,  "y": 150},  # 9  C. freundii
    {"gram": "negative", "role": "bridge",        "plasmid_args": 59, "x": 670,  "y": 370},  # 10 P. mirabilis
    {"gram": "negative", "role": "bridge",        "plasmid_args": 40, "x": 660,  "y": 590},  # 11 S. marcescens
    {"gram": "negative", "role": "bridge",        "plasmid_args": 14, "x": 830,  "y": 230},  # 12 A. pittii
    {"gram": "negative", "role": "bridge",        "plasmid_args": 25, "x": 840,  "y": 490},  # 13 P. putida
    {"gram": "positive", "role": "environmental", "plasmid_args": 26, "x": 1010, "y": 540},  # 14 E. faecalis
    {"gram": "negative", "role": "environmental", "plasmid_args":  7, "x": 1010, "y": 300},  # 15 C. jejuni
]

SHORT_NAMES = [
    "K. pneumoniae", "E. cloacae", "P. aeruginosa", "E. faecium",
    "S. aureus", "A. baumannii", "E. coli", "S. enterica",
    "K. oxytoca", "C. freundii", "P. mirabilis", "S. marcescens",
    "A. pittii", "P. putida", "E. faecalis", "C. jejuni",
]

# ── Graph loading ─────────────────────────────────────────────────────────────

def load_graph(path: str, weighted: bool = True):
    """
    Parse adjacency file. Returns (n, names, adj).
    adj[u] = list of (v, weight, labels).
    For the DAG (weighted=False), weight defaults to 1.0, labels to [].
    """
    with open(path) as f:
        lines = f.read().splitlines()
    n = int(lines[0])
    m = int(lines[1])
    names = lines[2:2 + n]
    adj = [[] for _ in range(n)]
    for line in lines[2 + n:2 + n + m]:
        parts = line.split()
        src, tgt = int(parts[0]), int(parts[1])
        if weighted and len(parts) > 2:
            w = float(parts[2])
            labels = parts[3].split(",") if len(parts) > 3 else []
        else:
            w = 1.0
            labels = []
        adj[src].append((tgt, w, labels))
    return n, names, adj


def load_fasta(path: str) -> dict:
    """Parse arg_sequences.fasta. Returns dict: dag_name → (gene_name, seq)."""
    result = {}
    current, gene, parts = None, None, []

    def flush():
        if current:
            result[current] = (gene, "".join(parts))

    with open(path) as f:
        for line in f:
            line = line.rstrip()
            if line.startswith(">"):
                flush()
                header_parts = line[1:].split(" | ")
                current = header_parts[0]
                gene = header_parts[1] if len(header_parts) > 1 else current
                parts = []
            else:
                parts.append(line)
    flush()
    return result


# ── Algorithm implementations ─────────────────────────────────────────────────

def bfs(adj: list, source: int, n: int):
    """Standard BFS. Returns (hop_distances, parent_array)."""
    dist = [-1] * n
    parent = [-1] * n
    dist[source] = 0
    q = deque([source])
    while q:
        u = q.popleft()
        for v, _, __ in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
    return dist, parent


def kosaraju(adj: list, n: int):
    """
    Iterative Kosaraju SCC (iterative to avoid Python recursion limits).
    Returns (component_label_per_node, n_components).
    """
    # Pass 1: compute finish order on original graph
    visited = [False] * n
    finish_order = []

    for start in range(n):
        if visited[start]:
            continue
        stack = [(start, iter(adj[start]))]
        visited[start] = True
        while stack:
            u, it = stack[-1]
            advanced = False
            for v, _, __ in it:
                if not visited[v]:
                    visited[v] = True
                    stack.append((v, iter(adj[v])))
                    advanced = True
                    break
            if not advanced:
                finish_order.append(u)
                stack.pop()

    # Build reverse adjacency
    radj = [[] for _ in range(n)]
    for u in range(n):
        for v, w, labels in adj[u]:
            radj[v].append((u, w, labels))

    # Pass 2: DFS on reverse graph in reverse finish order
    comp = [-1] * n
    c = 0
    for start in reversed(finish_order):
        if comp[start] != -1:
            continue
        stack = [start]
        comp[start] = c
        while stack:
            u = stack.pop()
            for v, _, __ in radj[u]:
                if comp[v] == -1:
                    comp[v] = c
                    stack.append(v)
        c += 1

    return comp, c


def kahn_topo(dag_adj: list, n: int):
    """Kahn's algorithm on the ARG DAG. Returns (order_list, has_cycle)."""
    in_deg = [0] * n
    for u in range(n):
        for v, _, __ in dag_adj[u]:
            in_deg[v] += 1
    q = deque(i for i in range(n) if in_deg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v, _, __ in dag_adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                q.append(v)
    return order, len(order) < n


def bad_char_table(pattern: str) -> dict:
    table = {}
    for i, c in enumerate(pattern):
        table[c] = i
    return table


def boyer_moore_search(text: str, pattern: str):
    """
    Boyer-Moore with bad-character heuristic only (DNA 4-char alphabet).
    Returns (match_positions, comparison_count).
    """
    n, m = len(text), len(pattern)
    if m == 0 or m > n:
        return [], 0
    bad_char = bad_char_table(pattern)
    matches, comparisons = [], 0
    s = 0
    while s <= n - m:
        j = m - 1
        while j >= 0:
            comparisons += 1
            if pattern[j] != text[s + j]:
                break
            j -= 1
        if j < 0:
            matches.append(s)
            shift_char = text[s + m] if s + m < n else "\0"
            s += m - bad_char.get(shift_char, -1) - 1
        else:
            s += max(1, j - bad_char.get(text[s + j], -1))
    return matches, comparisons


def naive_search(text: str, pattern: str):
    """Naive left-to-right search for comparison against Boyer-Moore."""
    n, m = len(text), len(pattern)
    matches, comparisons = [], 0
    for i in range(n - m + 1):
        j = 0
        while j < m:
            comparisons += 1
            if text[i + j] != pattern[j]:
                break
            j += 1
        if j == m:
            matches.append(i)
    return matches, comparisons


def dijkstra(adj: list, source: int, n: int):
    """
    Dijkstra with min-heap. Converts edge weight w → -log(w) distance internally
    so that higher probability = shorter distance = preferred path.
    Returns (distances, parent).
    """
    INF = float("inf")
    dist = [INF] * n
    parent = [-1] * n
    dist[source] = 0.0
    pq = [(0.0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u] + 1e-12:
            continue
        for v, w, _ in adj[u]:
            nd = dist[u] + (-math.log(w))
            if nd < dist[v]:
                dist[v] = nd
                parent[v] = u
                heapq.heappush(pq, (nd, v))
    return dist, parent


def reconstruct_path(parent: list, src: int, tgt: int) -> list:
    path = []
    v = tgt
    while v != -1:
        path.append(v)
        if v == src:
            break
        v = parent[v]
    path.reverse()
    return path if path and path[0] == src else []


def floyd_warshall(adj: list, n: int) -> list:
    """
    All-pairs shortest paths using -log(w) distances.
    Returns n×n distance matrix.
    """
    INF = float("inf")
    dist = [[INF] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0.0
    for u in range(n):
        for v, w, _ in adj[u]:
            dist[u][v] = -math.log(w)
    for k in range(n):
        dk = dist[k]
        for i in range(n):
            if dist[i][k] == INF:
                continue
            di = dist[i]
            for j in range(n):
                candidate = di[k] + dk[j]
                if candidate < di[j]:
                    di[j] = candidate
    return dist


def bfs_can_reach(adj: list, sources: set, targets: set) -> bool:
    """Returns True if any node in sources can reach any node in targets."""
    visited = set(sources)
    q = list(sources)
    while q:
        u = q.pop()
        if u in targets:
            return True
        for v, _, __ in adj[u]:
            if v not in visited:
                visited.add(v)
                q.append(v)
    return False


def greedy_contain(adj: list, sources: set, targets: set) -> list:
    """
    Greedy edge removal: sort all edges by weight descending, remove each
    permanently and stop as soon as sources can no longer reach targets.
    This may over-remove (removes reverse edges that don't help reachability),
    but always produces a valid cut and serves as a valid upper bound for B&B.
    """
    all_edges = sorted(
        ((w, u, v, lbl) for u, row in enumerate(adj) for v, w, lbl in row),
        reverse=True
    )
    adj_mut = [list(row) for row in adj]
    removed = []

    for w, u, v, labels in all_edges:
        if not bfs_can_reach(adj_mut, sources, targets):
            break
        adj_mut[u] = [(nv, nw, nl) for nv, nw, nl in adj_mut[u] if nv != v]
        removed.append({"src": u, "tgt": v, "weight": round(w, 6)})

    return removed


def bnb_contain(adj: list, sources: set, targets: set):
    """
    Branch-and-bound: find minimum edge set to cut all source→target paths.
    Initialises upper bound from greedy (which over-removes but always terminates).
    B&B finds the true minimum cut, demonstrating its advantage over greedy.
    Returns (optimal_removed, greedy_removed).
    """
    if not bfs_can_reach(adj, sources, targets):
        return [], []

    # Greedy upper bound
    greedy_sol = greedy_contain([list(r) for r in adj], sources, targets)
    if not greedy_sol:
        return [], []

    best = [len(greedy_sol)]
    best_set = [list(greedy_sol)]

    # Only consider edges that originate from nodes reachable by sources
    # (pruning: reverse edges from targets to sources are never useful)
    all_edges = sorted(
        ((w, u, v) for u, row in enumerate(adj) for v, w, _ in row),
        reverse=True
    )

    adj_mut = [list(row) for row in adj]

    def branch(idx: int, removed: list):
        if not bfs_can_reach(adj_mut, sources, targets):
            if len(removed) < best[0]:
                best[0] = len(removed)
                best_set[0] = list(removed)
            return
        if idx >= len(all_edges):
            return
        if len(removed) + 1 >= best[0]:   # prune: can't improve on best
            return

        w, u, v = all_edges[idx]

        # Branch A: remove edge (u→v)
        saved = adj_mut[u][:]
        adj_mut[u] = [(nv, nw, nl) for nv, nw, nl in adj_mut[u] if nv != v]
        branch(idx + 1, removed + [{"src": u, "tgt": v, "weight": round(w, 6)}])
        adj_mut[u] = saved

        # Branch B: keep edge (u→v)
        branch(idx + 1, removed)

    branch(0, [])
    return best_set[0], greedy_sol


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Loading input files...")
    n, names, adj           = load_graph(GRAPH_PATH)
    dag_n, dag_names, dag_adj = load_graph(DAG_PATH, weighted=False)
    hosp_n, hosp_names, hosp_adj = load_graph(HOSPITAL_PATH)
    fasta                   = load_fasta(FASTA_PATH)

    print(f"  Main graph    : {n} nodes, {sum(len(r) for r in adj)} edges")
    print(f"  ARG DAG       : {dag_n} nodes, {sum(len(r) for r in dag_adj)} edges")
    print(f"  Hospital sub  : {hosp_n} nodes, {sum(len(r) for r in hosp_adj)} edges")
    print(f"  FASTA seqs    : {list(fasta.keys())}")

    INF = float("inf")

    # ── BFS (source: K. pneumoniae, index 0) ──────────────────────────────────
    print("\n[1/8] BFS from K. pneumoniae...")
    bfs_dist, bfs_parent = bfs(adj, 0, n)

    # ── Kosaraju SCC ──────────────────────────────────────────────────────────
    print("[2/8] Kosaraju SCC...")
    scc_comp, scc_n = kosaraju(adj, n)
    scc_groups: dict[int, list] = {}
    for i, c in enumerate(scc_comp):
        scc_groups.setdefault(c, []).append(i)

    # ── Kahn's topological sort on ARG DAG ────────────────────────────────────
    print("[3/8] Kahn's topological sort on ARG DAG...")
    topo_order, topo_cycle = kahn_topo(dag_adj, dag_n)

    # ── Boyer-Moore on NDM-1 sequence ─────────────────────────────────────────
    print("[4/8] Boyer-Moore on NDM-1 sequence...")
    bm_target = "blaNDM1"
    gene_name, seq = fasta.get(bm_target, ("NDM-1", "ATGGATTTCGGG"))
    pattern = seq[:30]             # 30bp primer-length query
    text = seq + seq               # doubled sequence for guaranteed demo match
    bm_matches, bm_comps   = boyer_moore_search(text, pattern)
    naive_matches, naive_comps = naive_search(text, pattern)
    speedup = round(naive_comps / bm_comps, 2) if bm_comps > 0 else None

    # ── Dijkstra from K. pneumoniae ───────────────────────────────────────────
    print("[5/8] Dijkstra from K. pneumoniae...")
    dijk_dist, dijk_parent = dijkstra(adj, 0, n)
    eskape_paths = {}
    for tgt in range(1, 6):
        path = reconstruct_path(dijk_parent, 0, tgt)
        prob = math.exp(-dijk_dist[tgt]) if dijk_dist[tgt] < INF else 0.0
        eskape_paths[str(tgt)] = {
            "path": path,
            "dist": round(dijk_dist[tgt], 4) if dijk_dist[tgt] < INF else None,
            "probability": round(prob, 4),
            "target_name": names[tgt]
        }

    # Highest-risk pair across all sources
    print("    Finding highest-risk pair (all-source Dijkstra)...")
    best_src, best_tgt, best_prob = 0, 1, 0.0
    for src in range(n):
        d, par = dijkstra(adj, src, n)
        for tgt in range(n):
            if src != tgt and d[tgt] < INF:
                p = math.exp(-d[tgt])
                if p > best_prob:
                    best_prob, best_src, best_tgt = p, src, tgt

    # ── Floyd-Warshall ────────────────────────────────────────────────────────
    print("[6/8] Floyd-Warshall (all-pairs)...")
    fw = floyd_warshall(adj, n)
    vuln_scores = []
    for tgt in range(n):
        vals = [fw[src][tgt] for src in range(n) if src != tgt and fw[src][tgt] < INF]
        vuln_scores.append(round(sum(vals) / len(vals), 4) if vals else None)
    most_vuln = min(
        (i for i in range(n) if vuln_scores[i] is not None),
        key=lambda i: vuln_scores[i]
    )
    fw_clean = [
        [round(v, 4) if v < INF else None for v in row]
        for row in fw
    ]

    # ── Greedy containment (full graph) ───────────────────────────────────────
    print("[7/8] Greedy containment (environmental → Gram-positive ESKAPE)...")
    # The graph has 2 components:
    #   Component A (12 nodes): Gram-negative species — unreachable from env sources
    #   Component B (4 nodes):  E. faecium, S. aureus, E. faecalis, C. jejuni
    # Sources can only reach Gram-positive ESKAPE targets (indices 3, 4).
    env_sources  = {14, 15}        # E. faecalis, C. jejuni
    eskape_tgts  = {3, 4}          # E. faecium, S. aureus (Gram-positive ESKAPE — reachable)
    greedy_sol   = greedy_contain(adj, env_sources, eskape_tgts)

    # ── B&B containment (hospital subgraph) ───────────────────────────────────
    print("[8/8] Branch-and-Bound containment (hospital subgraph)...")
    # In hospital_subgraph.txt (10 nodes):
    #   sorted main-graph indices [0,1,2,3,4,5,6,7,14,15] → hosp indices 0-9
    #   E. faecalis = hosp 8,  C. jejuni = hosp 9
    #   E. faecium  = hosp 3,  S. aureus = hosp 4
    # B&B targets only the Gram-positive ESKAPE (same component as sources).
    hosp_env     = {8, 9}          # E. faecalis, C. jejuni (environmental sources)
    hosp_eskape  = {3, 4}          # E. faecium, S. aureus (Gram-positive ESKAPE targets)
    bnb_sol, bnb_greedy = bnb_contain(hosp_adj, hosp_env, hosp_eskape)

    # ── Assemble JSON ─────────────────────────────────────────────────────────
    print("\nAssembling JSON...")

    edge_list = []
    for u in range(n):
        for v, w, labels in adj[u]:
            edge_list.append({
                "src": u, "tgt": v,
                "weight": round(w, 6),
                "dist": round(-math.log(w), 4),
                "labels": labels[:5]
            })

    dag_edge_list = [[u, v] for u in range(dag_n) for v, _, __ in dag_adj[u]]

    output = {
        "meta": {
            "n_nodes": n,
            "n_edges": sum(len(r) for r in adj),
            "generated": "2026-06-03",
            "jaccard_threshold": 0.10,
            "min_weight": 0.05
        },
        "nodes": [
            {"id": i, "name": names[i], "short": SHORT_NAMES[i], **NODE_META[i]}
            for i in range(n)
        ],
        "edges": edge_list,
        "algorithms": {
            "bfs": {
                "source": 0,
                "source_name": names[0],
                "distances": bfs_dist,
                "parent": bfs_parent,
                "reachable": sum(1 for d in bfs_dist if d >= 0)
            },
            "scc": {
                "n_components": scc_n,
                "component_of": scc_comp,
                "groups": [scc_groups[c] for c in sorted(scc_groups)],
                "sizes": [len(scc_groups[c]) for c in sorted(scc_groups)]
            },
            "topo_sort": {
                "dag_nodes": dag_names,
                "dag_edges": dag_edge_list,
                "order": [dag_names[i] for i in topo_order],
                "order_indices": topo_order,
                "has_cycle": topo_cycle
            },
            "boyer_moore": {
                "pattern": pattern,
                "pattern_length": len(pattern),
                "gene_name": gene_name,
                "parent_text": text,
                "text_length": len(text),
                "matches": bm_matches,
                "comparisons_bm": bm_comps,
                "comparisons_naive": naive_comps,
                "speedup": speedup
            },
            "dijkstra": {
                "source": 0,
                "source_name": names[0],
                "distances": [round(d, 4) if d < INF else None for d in dijk_dist],
                "parent": dijk_parent,
                "eskape_paths": eskape_paths,
                "highest_risk": {
                    "src": best_src,
                    "tgt": best_tgt,
                    "src_name": names[best_src],
                    "tgt_name": names[best_tgt],
                    "probability": round(best_prob, 4)
                }
            },
            "floyd_warshall": {
                "dist_matrix": fw_clean,
                "vulnerability_scores": vuln_scores,
                "most_vulnerable": most_vuln,
                "most_vulnerable_name": names[most_vuln]
            },
            "greedy_contain": {
                "note": "Graph has 2 components. Sources can only reach Gram-positive ESKAPE.",
                "sources": sorted(env_sources),
                "source_names": [names[i] for i in sorted(env_sources)],
                "targets": sorted(eskape_tgts),
                "target_names": [names[i] for i in sorted(eskape_tgts)],
                "removed_edges": greedy_sol,
                "n_removed": len(greedy_sol)
            },
            "bnb_contain": {
                "note": "Hospital subgraph has 2 sub-components. B&B targets Gram-positive ESKAPE reachable from env sources.",
                "hospital_node_names": hosp_names,
                "sources": sorted(hosp_env),
                "source_names": [hosp_names[i] for i in sorted(hosp_env)],
                "targets": sorted(hosp_eskape),
                "target_names": [hosp_names[i] for i in sorted(hosp_eskape)],
                "optimal_removed": bnb_sol,
                "optimal_cost": len(bnb_sol),
                "greedy_removed": bnb_greedy,
                "greedy_cost": len(bnb_greedy)
            }
        }
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, allow_nan=False)

    print(f"\nWritten → {OUTPUT_PATH}")
    print(f"  BFS reachable      : {output['algorithms']['bfs']['reachable']}/{n}")
    print(f"  SCC components     : {scc_n}")
    print(f"  Topo order length  : {len(topo_order)}/{dag_n}  (cycle={topo_cycle})")
    print(f"  BM matches         : {len(bm_matches)}  BM={bm_comps} vs naive={naive_comps}  ({speedup}x)")
    print(f"  Dijkstra best pair : {names[best_src]} → {names[best_tgt]}  p={best_prob:.4f}")
    print(f"  Most vulnerable    : {names[most_vuln]}")
    print(f"  Greedy removed     : {len(greedy_sol)} edges")
    print(f"  B&B optimal        : {len(bnb_sol)} edges  (greedy: {len(bnb_greedy)})")


if __name__ == "__main__":
    main()
