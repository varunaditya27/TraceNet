# preprocessing

Python scripts that transform downloaded CARD-R data into the adjacency format consumed by the C++ graph engine. See `docs/dataset_reference.md` for the authoritative reference on column names, filter values, and data semantics.

## Scripts

| Script | Purpose | Input | Output |
|---|---|---|---|
| `build_graph.py` | Main pipeline — builds HGT species graph | `data/card_r/card_prevalence.txt.gz` | `data/hgt_graph.txt` |
| `build_arg_dag.py` | Emits ARG dependency DAG | hand-curated constants | `data/arg_dag.txt` |
| `download_fasta.py` | Filters CARD FASTA to target ARGs | `data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta` | `data/arg_sequences.fasta` |
| `validate_graph.py` | Sanity checks on generated graph | `data/hgt_graph.txt` | stdout report |

## Critical implementation notes for `build_graph.py`

**Correct filter (verified by EDA):**
```python
sub = df[
    (df["Pathogen"] == species_name) &
    (df["NCBI Plasmid"] > 1) &                        # >1% of genomes carry it on a plasmid
    (df["Model Type"] == "protein homolog model")      # mobile, homolog-detected ARGs only
]
arg_set = set(sub["Name"].unique())
```

**Do NOT use** `df["Contig"]`, `df["ARO_name"]`, or `df["Prevalence"]` — those columns do not exist in the file. Do NOT filter on `NCBI WGS >= 5` — that picks up chromosomal housekeeping genes (`rsmA`, `CRP`, `H-NS`) that are never HGT-transferred.

**Real column names in `card_prevalence.txt.gz`:**
`ARO Accession`, `Name`, `Model ID`, `Model Type`, `Pathogen`, `NCBI Plasmid`, `NCBI WGS`, `NCBI Chromosome`, `NCBI Genomic Island`, `Criteria`, `ARO Categories`

**Confirmed usable species (16):** *K. pneumoniae*, *E. cloacae*, *P. aeruginosa*, *E. faecium*, *S. aureus*, *A. baumannii*, *E. coli*, *S. enterica*, *E. faecalis*, *C. jejuni*, *A. pittii*, *P. putida*, *P. mirabilis*, *K. oxytoca*, *S. marcescens*, *C. freundii*

**Dropped species (0 plasmid ARGs — confirmed by EDA):** *Streptomyces coelicolor* (not in CARD-R at all), *Bacillus subtilis*, *Streptococcus pneumoniae*, *Clostridioides difficile*

**Output path:** `data/hgt_graph.txt` — not `data/processed/`.

**Expected output:** 16 nodes, ~144 directed edges.
