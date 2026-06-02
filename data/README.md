# data

This directory holds all data files for TraceNet. See `docs/dataset_reference.md` for the complete authoritative reference on every file, column, and filter decision.

## Directory layout

```
data/
├── card_r/                    # CARD-R Prevalence archive contents — gitignored (~309 MB)
│   ├── card_prevalence.txt.gz # Primary source: 20,041 rows × 11 columns, 413 pathogens
│   └── card-genomes.txt.gz    # Per-genome ARG data (not used for graph construction)
├── card_fasta/                # CARD Reference Sequences archive contents — gitignored
│   ├── nucleotide_fasta_protein_homolog_model.fasta  # 6,052 sequences for Boyer-Moore
│   ├── aro_index.tsv          # ARO accession → gene family mapping
│   └── aro_categories_index.tsv
├── hgt_graph.txt              # Generated: 16-node HGT graph for C++ engine
├── arg_dag.txt                # Hand-authored: 10-node ARG dependency DAG
├── arg_sequences.fasta        # Filtered: target ARG sequences for Boyer-Moore demo
└── hospital_subgraph.txt      # Generated: ~10-node subgraph for branch-and-bound
```

## Key facts

- `card_r/` and `card_fasta/` are **gitignored**. Download with:
  ```bash
  wget https://card.mcmaster.ca/latest/variants -O card_variants.tar.bz2 && tar -xjf card_variants.tar.bz2 -C card_r/
  wget https://card.mcmaster.ca/latest/data    -O card_data.tar.bz2    && tar -xjf card_data.tar.bz2    -C card_fasta/
  ```
- `hgt_graph.txt`, `arg_dag.txt`, `arg_sequences.fasta`, and `hospital_subgraph.txt` are committed.
- The correct filter for `card_prevalence.txt.gz` is `NCBI Plasmid > 1` (percentage column, 0–100 scale) combined with `Model Type == "protein homolog model"`. Do **not** use `NCBI WGS` — it includes chromosomal intrinsic genes that are never horizontally transferred.
- There is no `raw/` or `processed/` subdirectory. The layout above is the actual structure.
