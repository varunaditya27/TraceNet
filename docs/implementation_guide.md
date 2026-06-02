# TraceNet Implementation Guide

This document describes every file that must be implemented to complete the project.
All Python preprocessing scripts are **already implemented and working** (run them in order to regenerate data files).
All C++ source files are **stubs** — their `.h` and `.cpp` files contain only comments; the implementation must still be written.
The frontend is the remaining work after this guide.

---

## Current State of the Codebase

### Python preprocessing — DONE (fully implemented)

All five scripts in `preprocessing/` are complete and have been run. Their outputs are committed:

| Script | Status | Output |
|---|---|---|
| `preprocessing/build_graph.py` | ✅ Implemented and run | `data/hgt_graph.txt`, `data/hospital_subgraph.txt` |
| `preprocessing/build_arg_dag.py` | ✅ Implemented and run | `data/arg_dag.txt` |
| `preprocessing/download_fasta.py` | ✅ Implemented and run | `data/arg_sequences.fasta` |
| `preprocessing/validate_graph.py` | ✅ Implemented and run | stdout validation report |
| `preprocessing/convert_to_json.py` | ✅ Implemented and run | `frontend/data/hgt_graph.json` |

To regenerate any output file from scratch, run the scripts in the order listed above. All inputs are in `data/card_r/` and `data/card_fasta/` (gitignored — must be present locally).

### C++ source files — NOT YET IMPLEMENTED (stubs only)

Every file in `src/` contains comments describing the interface and implementation notes. No executable code exists yet. This is the primary remaining work before the frontend.

### Files to create / still missing

- The `Makefile` stub is present but has no build rules — the rules are described in comments.
- Tests in `tests/` are stubs.
- `results/` and `viz/` directories will be created automatically when algorithms write their outputs.

---

## Key Data Facts (from Running the Pipeline)

These are confirmed values, not estimates. Any implementation must produce results consistent with them.

**HGT species graph (`data/hgt_graph.txt`):**
- 16 nodes, 144 directed edges (72 bidirectional pairs)
- **Two connected components** — this is the most important structural property to understand:
  - Component A (12 nodes): all Gram-negative species — K. pneumoniae, E. cloacae, P. aeruginosa, A. baumannii, E. coli, S. enterica, K. oxytoca, C. freundii, P. mirabilis, S. marcescens, A. pittii, P. putida
  - Component B (4 nodes): E. faecium, S. aureus, E. faecalis, C. jejuni
  - Cross-Gram Jaccard × τ(0.5) values all fall below MIN_WEIGHT=0.05, so no edges cross the boundary between components. This is biologically correct: ARG overlap across Gram boundaries is insufficient at the chosen thresholds.
  - Each component is internally a complete directed graph — every node in Component A connects to every other node in Component A, and similarly for Component B.

**ARG dependency DAG (`data/arg_dag.txt`):**
- 10 nodes, 8 directed edges. No cycles. vanA is an isolated node with no edges.
- Expected topological order: tetM → sul1 → blaTEM → blaSHV → aac6Ib → blaCTXM → blaOXA48 → blaNDM1 → mcr1 (vanA appears anywhere as it has no predecessors or successors)

**ARG sequences (`data/arg_sequences.fasta`):**
- 6 sequences: blaNDM1 (813 bp), blaOXA48 (798 bp), tetM (1920 bp), blaCTXM (876 bp), mcr1 (1626 bp), blaTEM (861 bp)
- Boyer-Moore demo: use first 30 bp of blaNDM1 as pattern, doubled blaNDM1 sequence as text. Expected: 2 matches, BM comparisons ≈ 951 vs naive ≈ 2119 (2.23× speedup)

**Hospital subgraph (`data/hospital_subgraph.txt`):**
- 10 nodes, 42 edges
- Node mapping (hospital index → main graph index → species):
  - 0 → 0: K. pneumoniae (ESKAPE)
  - 1 → 1: E. cloacae (ESKAPE)
  - 2 → 2: P. aeruginosa (ESKAPE)
  - 3 → 3: E. faecium (ESKAPE, Gram-positive)
  - 4 → 4: S. aureus (ESKAPE, Gram-positive)
  - 5 → 5: A. baumannii (ESKAPE)
  - 6 → 6: E. coli (bridge)
  - 7 → 7: S. enterica (bridge)
  - 8 → 14: E. faecalis (environmental, Gram-positive)
  - 9 → 15: C. jejuni (environmental)
- Two sub-components in the hospital subgraph (same structure as the main graph):
  - Sub-component A: nodes 0,1,2,5,6,7 (Gram-negative)
  - Sub-component B: nodes 3,4,8,9 (Gram-positive + C. jejuni)

**Pre-computed algorithm results (from `convert_to_json.py` run):**
- BFS from K. pneumoniae: reaches 12/16 nodes (only Component A)
- SCC: 2 components (one SCC per connected component)
- Topological sort: 10/10 nodes ordered, no cycle
- Boyer-Moore: 2 matches, 951 BM comparisons, 2119 naive comparisons, 2.23× speedup
- Dijkstra highest-risk pair: E. faecium → E. faecalis, probability = 0.7143
- Floyd-Warshall most vulnerable: K. pneumoniae (lowest average incoming distance in Component A)
- Greedy containment (full graph): removes 141 of 144 edges before isolation — intentionally impractical, demonstrates why greedy fails on large dense graphs
- B&B containment (hospital subgraph): greedy removes 39 edges, B&B finds optimal 4 — 10× improvement demonstrating exact minimum cut

---

## Step 1 — Python Preprocessing (Complete — Reference Only)

This section describes what each script does. The code is already written; read the scripts themselves for implementation details.

### `preprocessing/build_graph.py`

Reads `data/card_r/card_prevalence.txt.gz`. For each of the 16 target species, filters to rows where `NCBI Plasmid > 1` AND `Model Type == "protein homolog model"`. Builds a set of ARG allele names per species (using `set(df["Name"].unique())`). Computes pairwise Jaccard similarity between every species pair. Applies a taxonomic correction τ: 1.0 for same genus, 0.75 for same Gram class, 0.5 for cross-Gram. Skips pairs where Jaccard < 0.10 or Jaccard × τ < 0.05. Writes `data/hgt_graph.txt` and a 10-node hospital subgraph to `data/hospital_subgraph.txt`.

The hospital subgraph contains the 6 ESKAPE species plus E. coli, S. enterica, E. faecalis, and C. jejuni. This selection puts both environmental source species (E. faecalis, C. jejuni) in the subgraph alongside their ESKAPE targets, making the B&B containment problem well-defined.

### `preprocessing/build_arg_dag.py`

Hard-codes the 10 ARG family nodes and 8 dependency edges. Edges encode clinical co-occurrence dependencies (presence of one ARG family enables or correlates with acquisition of the next). Writes `data/arg_dag.txt` in the DAG format (no weights, two fields per edge line).

### `preprocessing/download_fasta.py`

Reads `data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta`. Parses headers using regex to extract the gene name between the last pipe and the opening bracket of the organism field. Matches against 6 target gene names (NDM-1, CTX-M-15, TEM-1, MCR-1.1, OXA-48, tet(M)) and keeps the first occurrence of each. Writes `data/arg_sequences.fasta` with one sequence per target, using the DAG node name as the FASTA identifier.

### `preprocessing/validate_graph.py`

Loads and validates `data/hgt_graph.txt`. Checks node count in [14,18], edge count in [120,165], all weights in (0,1], no self-loops, bidirectionality of all edges, and internal connectivity of each component. Reports component structure. Does NOT fail on the expected 2-component structure. Run after `build_graph.py` to confirm outputs are correct.

### `preprocessing/convert_to_json.py`

The key coupling point between preprocessing and the frontend. Reimplements all 8 algorithms independently in Python (with no dependency on the C++ engine). Loads all four data files, runs every algorithm, and serialises results into `frontend/data/hgt_graph.json`. The frontend reads ONLY this file at runtime — it never calls any C++ code.

The JSON structure contains: node metadata (name, gram, role, plasmid_args, x/y position), edge list (src, tgt, weight, -log(w) distance, labels), and a nested `algorithms` object with results from each of the 8 algorithms. The x/y anchor coordinates define the fixed biological layout for the frontend canvas (1200 × 700 logical units): ESKAPE nodes on the left, bridge nodes in the centre, environmental reservoirs on the right.

---

## Step 2 — C++ Engine (To Be Implemented)

The following files are stubs. Each file's header comment fully describes what to implement. This section adds context beyond what is in the file comments.

### Build system

**`Makefile`** — The source list (`SRCS`) is already correct. Add three targets: the default build target that compiles all sources with `g++ -std=c++17 -Wall -O2`, a `clean` target, and a `run` target.

**`CMakeLists.txt`** — All source paths are listed in comments. Uncomment and populate the cmake directives. This file is used only for IDE integration; the Makefile is the primary build system.

### Graph data structure (`src/graph.h`, `src/graph.cpp`)

The Graph struct needs two adjacency representations because different algorithms use different access patterns. The adjacency list (`adj`) and its reverse (`radj`) are built during `Graph::load` and used by BFS, Kosaraju, Dijkstra, and containment. The distance matrix (`dist_mat`) is built lazily by `Graph::build_matrix()` and used only by Floyd-Warshall.

Edge storage: each edge stores the target node index, the raw probability weight, and a vector of up to 5 ARG label strings. Edges in `radj` are the same edges stored in reverse direction, built during load.

The `remove_edge` and `restore_edge` methods are used by B&B during backtracking. `remove_edge` modifies `adj` only (not `radj`), because Kosaraju reads `radj` before any containment runs. `restore_edge` must restore the edge with its exact original weight and labels.

The DAG format (`dag=true`) differs from the main format only in edge lines: DAG edges have two fields (src, tgt) while main edges have four fields (src, tgt, weight, labels). The same `Graph::load` function handles both with the `dag` flag.

### Utility functions (`src/utils.h`, `src/utils.cpp`)

The `write_result` and `write_csv` functions should create `results/` if it does not exist. The `write_dot` function should vary node shapes by role (ESKAPE = box, bridge = ellipse, environmental = diamond) and colour edges by weight range (dark red for weight > 0.5, orange for 0.2–0.5, grey for < 0.2). The `Timer` class uses `std::chrono::high_resolution_clock`.

### BFS (`src/bfs.h`, `src/bfs.cpp`)

Standard iterative BFS using `std::queue<int>`. Initialise `dist[]` to -1, set `dist[source] = 0`, and process neighbours. Record `parent[]` for tree reconstruction. The BFS from K. pneumoniae (node 0) will reach 12 nodes and leave 4 unreachable (Component B). Report both components clearly in the output.

### Kosaraju SCC (`src/scc_kosaraju.h`, `src/scc_kosaraju.cpp`)

Two-pass iterative DFS. Use an explicit `std::stack<pair<int, iterator>>` to simulate recursion — this avoids stack overflow on larger inputs and is a good practice even for small graphs. Pass 1 processes `g.adj` and records finish order. Pass 2 processes `g.radj` in reverse finish order. Since `g.radj` is pre-built by `Graph::load`, no reconstruction is needed here.

Expected result: exactly 2 SCCs. Component A (12 Gram-negative nodes) forms one SCC. Component B (4 Gram-positive + C. jejuni nodes) forms the second. This matches the connected component structure because all edges are bidirectional — every pair with an edge can reach each other.

### Topological Sort (`src/topo_sort.h`, `src/topo_sort.cpp`)

Kahn's BFS-based algorithm. Compute in-degrees from `dag.adj`. Initialise the queue with all zero-in-degree nodes. Process in queue order, decrementing in-degrees and pushing newly-zero nodes. If output size is less than `dag.n` after the loop, a cycle was introduced in `arg_dag.txt` — assert with a clear error message since the DAG is hand-curated to be acyclic.

vanA (index 9) has no incoming or outgoing edges, so it starts in the queue and appears somewhere in the output. Its exact position depends on queue ordering.

### Boyer-Moore (`src/boyer_moore.h`, `src/boyer_moore.cpp`)

Build the bad-character table as a map from character to its last occurrence index in the pattern. Characters absent from the pattern map to -1 (default shift). In the search loop, scan right-to-left within each window. On mismatch at position j in the pattern, compute shift as `max(1, j - bad_char[text[s+j]])`. Count all character comparisons, including the final mismatch. Run the naive left-to-right O(nm) search on the same inputs for comparison.

The demo inputs are defined in the script comments: read the blaNDM1 sequence from `data/arg_sequences.fasta`, take the first 30 characters as the pattern, and concatenate the sequence with itself to form the text (guaranteeing two matches). Report match positions, comparison counts, and speedup ratio.

### Dijkstra (`src/dijkstra.h`, `src/dijkstra.cpp`)

Use `std::priority_queue<pair<double,int>, vector<pair<double,int>>, greater<pair<double,int>>>` for a min-heap. Convert each edge weight `w` to distance `-log(w)` at the point of relaxation, not during graph loading. Implement lazy deletion: skip a heap entry `(d, u)` if `d > dist[u]`. Record the settle order in `settled[]` for step-by-step animation in the frontend.

The highest-probability pair in the full graph is E. faecium → E. faecalis with probability 0.7143 (distance ≈ 0.337). K. pneumoniae has the lowest average incoming distance across Component A (most vulnerable). Both components have INF distance between them.

### Floyd-Warshall (`src/floyd_warshall.h`, `src/floyd_warshall.cpp`)

Call `g.build_matrix()` first to initialise `g.dist_mat` from the adjacency list. The matrix uses `-log(w)` distances, 0 on the diagonal, and INF for missing edges. The triple loop updates `dist[i][j]` whenever `dist[i][k] + dist[k][j] < dist[i][j]`. Skip iterations where `dist[i][k] == INF` to avoid undefined behaviour from infinity arithmetic.

The vulnerability score for a node is the mean of all finite incoming distances (across all source nodes in the same component). Nodes in different components have INF distance — exclude these from the mean. Export the matrix to CSV with node names as headers.

### Greedy Containment (`src/greedy_contain.h`, `src/greedy_contain.cpp`)

Collect all directed edges, sort descending by weight. Remove each edge permanently from `g.adj` via `Graph::remove_edge`. After each removal, run multi-source BFS from the source nodes (E. faecalis and C. jejuni, indices 14 and 15) and check whether any target (E. faecium and S. aureus, indices 3 and 4) is reached. Stop when no path exists. Return the list of removed edges.

The algorithm will remove approximately 141 of 144 edges because it processes all high-weight edges within the Gram-negative component first (those edges are irrelevant to the source-target reachability problem). This deliberate over-removal demonstrates why the greedy weight-order heuristic is inappropriate for large dense graphs, motivating the exact B&B approach.

### Branch-and-Bound Containment (`src/bnb_contain.h`, `src/bnb_contain.cpp`)

Load the hospital subgraph (`data/hospital_subgraph.txt`). Run greedy containment on it first to establish the upper bound (expected: 39 edges). Then run branch-and-bound with the pruning condition `removed.size() + 1 >= best_cost`. Sources are hospital nodes 8 (E. faecalis) and 9 (C. jejuni). Targets are hospital nodes 3 (E. faecium) and 4 (S. aureus).

Use `Graph::remove_edge` before Branch A's recursion and `Graph::restore_edge` after it returns. The optimal solution is 4 edges — the 4 direct forward edges from source nodes to target nodes. B&B finds this quickly because once any 4-edge solution is recorded, all branches requiring ≥ 4 removals are pruned immediately.

Report a side-by-side comparison of the greedy solution (39 edges) and the optimal solution (4 edges).

### `src/main.cpp`

Parse `argv[1]` as the main graph path and `argv[2]` as the command string. Load the main graph unconditionally. Load the ARG DAG when the command is `topo` or `all`. Load the hospital subgraph when the command is `bnb` or `all`. Dispatch to the corresponding function, time it with the Timer utility, and print summary output. For the `all` command, run all algorithms in this order: BFS, SCC, topo, BM, Dijkstra, Floyd, greedy, B&B.

---

## Step 3 — Frontend (Remaining Work)

The frontend reads `frontend/data/hgt_graph.json` (already generated). All algorithm results, node positions, edge data, and metadata are pre-baked into that file. No C++ dependency at runtime.

See `docs/superpowers/specs/2026-06-02-tracenet-frontend-design.md` for the complete design specification: colour tokens, typography, sticky-graph scrollytelling layout, 8 chapter specifications, and D3.js integration details.

The frontend consists of:
- `frontend/index.html` — single HTML page, sticky graph above scrollable narrative
- `frontend/style.css` — Scientific Paper aesthetic, CSS custom properties for all design tokens
- `frontend/main.js` — Intersection Observer API for scroll triggers, chapter progression logic
- `frontend/graph.js` — D3.js force simulation with fixed biological anchor positions from the JSON
- `frontend/chapters/ch1_bfs.js` through `ch8_bnb.js` — one file per algorithm chapter, each animating the graph and populating the result panel

---

## Run Sequence

To fully regenerate all outputs from raw data:

1. Ensure `data/card_r/card_prevalence.txt.gz` and `data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta` are present
2. `pip install -r requirements.txt`
3. `python3 preprocessing/build_graph.py`
4. `python3 preprocessing/build_arg_dag.py`
5. `python3 preprocessing/download_fasta.py`
6. `python3 preprocessing/validate_graph.py`
7. `python3 preprocessing/convert_to_json.py`
8. `make` (once C++ is implemented)
9. `./tracenet data/hgt_graph.txt all`
10. `bash viz/render_all.sh` (once Graphviz DOT files are generated)

Expected outputs after step 7: `data/hgt_graph.txt`, `data/arg_dag.txt`, `data/arg_sequences.fasta`, `data/hospital_subgraph.txt`, `frontend/data/hgt_graph.json`
