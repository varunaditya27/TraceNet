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

# ── ARG family nodes (16 total) ───────────────────────────────────────────────
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
    "vanA",      # 9 — vancomycin resistance; starts a separate Gram-positive branch
    "qnrS1",     # 10 — plasmid-mediated quinolone resistance
    "ermB",      # 11 — macrolide-lincosamide resistance
    "fosA3",     # 12 — fosfomycin resistance frequently co-carried with ESBL genes
    "catA1",     # 13 — chloramphenicol resistance cassette
    "dfrA12",    # 14 — trimethoprim resistance integron cassette
    "arr3",      # 15 — rifampicin resistance integron cassette
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
    (1, 14), # sul1    → dfrA12   : class-1 integrons commonly carry both cassettes
    (10, 14),# qnrS1   → dfrA12   : quinolone and trimethoprim resistance co-selection
    (9, 11), # vanA    → ermB     : Gram-positive multidrug resistance branch
    (2, 12), # blaTEM  → fosA3    : ESBL plasmids frequently co-carry fosA3
    (4, 12), # aac6Ib  → fosA3    : aminoglycoside/fosfomycin co-resistance branch
    (14, 5), # dfrA12  → blaCTXM  : integron background converges on ESBL acquisition
    (12, 6), # fosA3   → blaOXA48 : fosfomycin resistance precedes this carbapenem branch
    (13, 15),# catA1   → arr3     : multidrug integron cassette branch
    (12, 15),# fosA3   → arr3     : two branches converge at rifampicin resistance
    (8, 7),  # mcr1    → blaNDM1  : last-resort resistance branches converge at NDM-1
]

# The exact deterministic order is produced by Kahn's FIFO queue using node-index
# order for initial ties. The graph deliberately contains parallel branches and
# convergence points so the visualization is not merely a chain.

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
    print("\nUse the C++/frontend Kahn implementation to compute the deterministic FIFO order.")


if __name__ == "__main__":
    main()
