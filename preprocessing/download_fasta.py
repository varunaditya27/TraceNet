#!/usr/bin/env python3
"""
download_fasta.py

Filters the CARD reference FASTA to extract one representative nucleotide
sequence per target ARG family. The output file is the text corpus for the
Boyer-Moore string search demonstration in the C++ engine and frontend.

The input FASTA uses this header format:
  >gb|ACCESSION|STRAND|COORDS|ARO:ID|GeneName [Organism]

We match on GeneName (the field after the last '|' and before ' [').
Only the first occurrence of each target gene name is kept.

Input:  data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta
Output: data/arg_sequences.fasta

Run:    python preprocessing/download_fasta.py
"""

import os
import re

FASTA_IN = "data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta"
FASTA_OUT = "data/arg_sequences.fasta"

# Maps exact GeneName string (from FASTA header) → short DAG-node identifier.
# The GeneName appears between the last '|' and ' [Organism]' in the header line.
TARGETS: dict[str, str] = {
    "NDM-1":    "blaNDM1",
    "CTX-M-15": "blaCTXM",
    "TEM-1":    "blaTEM",
    "MCR-1.1":  "mcr1",
    "OXA-48":   "blaOXA48",
    "tet(M)":   "tetM",
}

# Regex to capture GeneName between last pipe and ' ['
HEADER_RE = re.compile(r'\|([^|]+) \[')


def parse_fasta(path: str) -> dict[str, tuple[str, str]]:
    """
    Parse FASTA file. Returns dict: dag_name → (original_gene_name, sequence).
    Only keeps the first occurrence of each target gene.
    """
    found: dict[str, tuple[str, str]] = {}
    current_gene: str | None = None
    current_dag: str | None = None
    seq_parts: list[str] = []

    def flush():
        if current_dag and current_dag not in found:
            found[current_dag] = (current_gene, "".join(seq_parts))

    with open(path) as fh:
        for line in fh:
            line = line.rstrip()
            if line.startswith(">"):
                flush()
                m = HEADER_RE.search(line)
                gene = m.group(1) if m else None
                current_gene = gene
                current_dag = TARGETS.get(gene)
                seq_parts = []
            else:
                seq_parts.append(line)
    flush()

    return found


def main():
    print(f"Parsing {FASTA_IN}...")
    sequences = parse_fasta(FASTA_IN)

    missing = set(TARGETS.values()) - set(sequences.keys())
    if missing:
        print(f"  WARNING: sequences not found for: {missing}")

    os.makedirs(os.path.dirname(FASTA_OUT) or ".", exist_ok=True)
    with open(FASTA_OUT, "w") as out:
        for dag_name, (gene_name, seq) in sequences.items():
            # Header: >{dag_name} | {original_gene_name}
            out.write(f">{dag_name} | {gene_name}\n{seq}\n")
            print(f"  {dag_name} ({gene_name}): {len(seq)} bp")

    print(f"\nWritten {FASTA_OUT}: {len(sequences)} sequences")


if __name__ == "__main__":
    main()
