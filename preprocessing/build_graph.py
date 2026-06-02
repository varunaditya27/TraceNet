#!/usr/bin/env python3
"""
build_graph.py

Transforms CARD-R Prevalence data into a weighted directed HGT species graph
for the TraceNet C++ engine and frontend.

Input:  data/card_r/card_prevalence.txt.gz   (20,041 rows, 11 columns)
Output: data/hgt_graph.txt                   (16-node main species graph)
        data/hospital_subgraph.txt           (10-node ESKAPE + clinical bridge subgraph for B&B)

Run:    python preprocessing/build_graph.py
"""

import pandas as pd
import itertools
import os

# ── Constants ─────────────────────────────────────────────────────────────────

# Node index is position in this list — order is canonical across all files.
TARGET_SPECIES = [
    "Klebsiella pneumoniae",    # 0  ESKAPE
    "Enterobacter cloacae",     # 1  ESKAPE
    "Pseudomonas aeruginosa",   # 2  ESKAPE
    "Enterococcus faecium",     # 3  ESKAPE  (Gram-positive)
    "Staphylococcus aureus",    # 4  ESKAPE  (Gram-positive)
    "Acinetobacter baumannii",  # 5  ESKAPE
    "Escherichia coli",         # 6  bridge
    "Salmonella enterica",      # 7  bridge
    "Klebsiella oxytoca",       # 8  bridge
    "Citrobacter freundii",     # 9  bridge
    "Proteus mirabilis",        # 10 bridge
    "Serratia marcescens",      # 11 bridge
    "Acinetobacter pittii",     # 12 bridge
    "Pseudomonas putida",       # 13 bridge
    "Enterococcus faecalis",    # 14 environmental (Gram-positive)
    "Campylobacter jejuni",     # 15 environmental
]

GRAM_POSITIVE = {
    "Enterococcus faecium",
    "Enterococcus faecalis",
    "Staphylococcus aureus",
}

ESKAPE_INDICES = {0, 1, 2, 3, 4, 5}

JACCARD_THRESHOLD = 0.10
MIN_WEIGHT = 0.05
PLASMID_CUTOFF = 1.0      # NCBI Plasmid must exceed this (percentage, 0–100 scale)
MODEL_TYPE = "protein homolog model"
MAX_EDGE_LABELS = 5       # max shared ARG names written per edge line

PREVALENCE_PATH = "data/card_r/card_prevalence.txt.gz"
OUTPUT_GRAPH = "data/hgt_graph.txt"
OUTPUT_HOSPITAL = "data/hospital_subgraph.txt"

# Hospital subgraph: ESKAPE (0-5) + these bridge/environmental indices.
# Chosen to include the clinically relevant species most involved in hospital-acquired ARG spread,
# and both environmental reservoirs so B&B can model blocking their entry into the hospital.
HOSPITAL_EXTRA = {6, 7, 14, 15}   # E. coli, S. enterica, E. faecalis, C. jejuni
HOSPITAL_INDICES = ESKAPE_INDICES | HOSPITAL_EXTRA


# ── Helpers ───────────────────────────────────────────────────────────────────

def taxonomic_correction(sp1: str, sp2: str) -> float:
    """
    Return τ (taxonomic correction factor):
      1.0 — same genus
      0.75 — same Gram stain class
      0.5  — cross-Gram
    """
    if sp1.split()[0] == sp2.split()[0]:
        return 1.0
    gram1 = sp1 in GRAM_POSITIVE
    gram2 = sp2 in GRAM_POSITIVE
    return 0.75 if gram1 == gram2 else 0.5


def jaccard(a: set, b: set) -> float:
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def write_graph_file(path: str, node_names: list, edges: list) -> None:
    """
    Write adjacency file in hgt_graph.txt format:
      line 1:  n_nodes
      line 2:  n_edges
      lines 3..n+2: node names (zero-indexed)
      remaining: src_idx tgt_idx weight label1,label2,...
    """
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w") as f:
        f.write(f"{len(node_names)}\n")
        f.write(f"{len(edges)}\n")
        for name in node_names:
            f.write(f"{name}\n")
        for src, tgt, weight, labels in edges:
            label_str = ",".join(labels[:MAX_EDGE_LABELS])
            f.write(f"{src} {tgt} {weight:.6f} {label_str}\n")


# ── Main pipeline ─────────────────────────────────────────────────────────────

def main():
    print(f"Loading {PREVALENCE_PATH}...")
    df = pd.read_csv(PREVALENCE_PATH, sep="\t", compression="gzip")
    print(f"  Loaded {len(df):,} rows × {len(df.columns)} columns")

    # Step 1: Build per-species ARG sets using the verified EDA filter
    print("\nBuilding ARG sets per species (NCBI Plasmid > 1, protein homolog model)...")
    arg_sets: dict[str, set] = {}
    for sp in TARGET_SPECIES:
        sub = df[
            (df["Pathogen"] == sp) &
            (df["NCBI Plasmid"] > PLASMID_CUTOFF) &
            (df["Model Type"] == MODEL_TYPE)
        ]
        arg_sets[sp] = set(sub["Name"].unique())
        print(f"  {sp}: {len(arg_sets[sp])} ARGs")

    # Step 2: Compute pairwise Jaccard × τ and collect qualifying edges
    print("\nComputing Jaccard × τ for all species pairs...")
    idx = {sp: i for i, sp in enumerate(TARGET_SPECIES)}
    edges: list[tuple] = []

    for sp_a, sp_b in itertools.combinations(TARGET_SPECIES, 2):
        A, B = arg_sets[sp_a], arg_sets[sp_b]
        if not (A | B):
            continue
        J = jaccard(A, B)
        tau = taxonomic_correction(sp_a, sp_b)
        w = J * tau
        if J < JACCARD_THRESHOLD or w < MIN_WEIGHT:
            continue
        shared = sorted(A & B)          # shared ARG allele names for edge label
        i, j = idx[sp_a], idx[sp_b]
        edges.append((i, j, w, shared))  # bidirectional: both directions same weight
        edges.append((j, i, w, shared))

    print(f"  {len(edges)} directed edges ({len(edges) // 2} undirected pairs)")

    # Step 3: Write main HGT graph
    print(f"\nWriting {OUTPUT_GRAPH}...")
    write_graph_file(OUTPUT_GRAPH, TARGET_SPECIES, edges)
    print(f"  Done: {len(TARGET_SPECIES)} nodes, {len(edges)} edges")

    # Step 4: Build hospital subgraph (ESKAPE + bridge species for B&B)
    print(f"\nBuilding hospital subgraph ({len(HOSPITAL_INDICES)} nodes)...")
    hosp_nodes = sorted(HOSPITAL_INDICES)
    remap = {old: new for new, old in enumerate(hosp_nodes)}
    hosp_names = [TARGET_SPECIES[i] for i in hosp_nodes]
    hosp_edges = [
        (remap[s], remap[t], w, lbl)
        for s, t, w, lbl in edges
        if s in remap and t in remap
    ]
    print(f"  Writing {OUTPUT_HOSPITAL}...")
    write_graph_file(OUTPUT_HOSPITAL, hosp_names, hosp_edges)
    print(f"  Done: {len(hosp_nodes)} nodes, {len(hosp_edges)} edges")
    print("\nHospital subgraph node mapping:")
    for new_idx, old_idx in enumerate(hosp_nodes):
        role = "ESKAPE" if old_idx in ESKAPE_INDICES else "env/bridge"
        print(f"  {new_idx}: {TARGET_SPECIES[old_idx]} ({role})")


if __name__ == "__main__":
    main()
