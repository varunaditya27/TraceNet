#!/usr/bin/env python3
"""
build_arg_dag.py

Emits the hand-curated ARG dependency DAG to data/arg_dag.txt.

Nodes represent resistance gene families. Edges encode clinical co-occurrence
dependencies — lower nodes (sources) are prerequisite resistance steps that
enable or correlate with the acquisition of higher nodes (targets).

The DAG is the input for topological sort (Kahn's algorithm) in the C++ engine.
Node names here use short informal identifiers; see docs/dataset_reference.md §9
for the full mapping to official CARD allele names.

Output format (read by Graph::load with dag=true in C++):
  line 1:  n_nodes
  line 2:  n_edges
  lines 3..n+2: node names
  remaining: src_idx tgt_idx   (no weights — DAG is unweighted)

Run:    python preprocessing/build_arg_dag.py
"""

import os

# ── ARG family nodes (10 total) ───────────────────────────────────────────────
# Order defines the zero-based index used in edge declarations below.

NODES = [
    "tetM",      # 0 — tetracycline resistance; early mobile ARG, enables co-selection
    "sul1",      # 1 — sulphonamide resistance; commonly co-located with blaTEM on plasmids
    "blaTEM",    # 2 — broad-spectrum TEM beta-lactamase; base for ESBL evolution
    "blaSHV",    # 3 — SHV beta-lactamase; point-mutation-derived ESBL from blaTEM background
    "aac6Ib",    # 4 — aminoglycoside acetyltransferase; commonly co-acquired with blaNDM
    "blaCTXM",   # 5 — CTX-M ESBL; critical resistance escalation, precedes carbapenemase
    "blaOXA48",  # 6 — OXA-48 carbapenemase; enabled after CTX-M selection pressure
    "blaNDM1",   # 7 — NDM-1 metallo-beta-lactamase; pan-resistance to all beta-lactams
    "mcr1",      # 8 — MCR-1 colistin resistance; last-resort antibiotic
    "vanA",      # 9 — vancomycin resistance (Gram-positive); isolated node in this DAG
]

# ── Edges: (src_idx, tgt_idx) ─────────────────────────────────────────────────
# Each edge (A → B) means: clinical acquisition of B typically follows or
# co-occurs with A in plasmid-mediated resistance progression.

EDGES = [
    (0, 2),  # tetM    → blaTEM   : tetracycline plasmids co-carry blaTEM
    (1, 2),  # sul1    → blaTEM   : sulphonamide plasmids co-carry blaTEM
    (2, 3),  # blaTEM  → blaSHV   : SHV arises under TEM selection pressure
    (3, 5),  # blaSHV  → blaCTXM  : CTX-M succeeds ESBL blaSHV as dominant ESBL
    (5, 6),  # blaCTXM → blaOXA48 : OXA-48 emergence follows CTX-M selection
    (6, 7),  # blaOXA48→ blaNDM1  : NDM co-occurs with OXA-48 on carbapenem-resistant plasmids
    (4, 7),  # aac6Ib  → blaNDM1  : aminoglycoside + carbapenem resistance co-acquired
    (5, 8),  # blaCTXM → mcr1     : colistin resistance selected after ESBL treatment failure
]

# Expected topological order (one valid answer):
# tetM → sul1 → blaTEM → blaSHV → aac6Ib → blaCTXM → blaOXA48 → blaNDM1 → mcr1 (vanA isolated)

OUTPUT = "data/arg_dag.txt"


def main():
    os.makedirs(os.path.dirname(OUTPUT) or ".", exist_ok=True)
    with open(OUTPUT, "w") as f:
        f.write(f"{len(NODES)}\n")
        f.write(f"{len(EDGES)}\n")
        for name in NODES:
            f.write(f"{name}\n")
        for src, tgt in EDGES:
            f.write(f"{src} {tgt}\n")

    print(f"Written {OUTPUT}")
    print(f"  {len(NODES)} nodes, {len(EDGES)} edges")
    print(f"\nNodes:")
    for i, name in enumerate(NODES):
        print(f"  {i}: {name}")
    print(f"\nEdges:")
    for src, tgt in EDGES:
        print(f"  {NODES[src]} → {NODES[tgt]}")
    print(f"\nExpected topo order: tetM → sul1 → blaTEM → blaSHV → aac6Ib → blaCTXM → blaOXA48 → blaNDM1 → mcr1  (vanA isolated)")


if __name__ == "__main__":
    main()
