# TraceNet Dataset Reference

> **Purpose:** This is the single authoritative reference for all datasets used in TraceNet. Every data-access decision, column name, filter value, and file path documented here was verified by direct inspection of the downloaded files. No assumptions — if it is written here, it was observed in the data.

---

## Table of Contents

1. [File Inventory](#1-file-inventory)
2. [Dataset 1 — card_prevalence.txt.gz](#2-dataset-1--card_prevalencetxtgz)
3. [Dataset 2 — nucleotide_fasta_protein_homolog_model.fasta](#3-dataset-2--nucleotide_fasta_protein_homolog_modelfasta)
4. [Supporting CARD Files](#4-supporting-card-files)
5. [Graph Construction Parameters](#5-graph-construction-parameters)
6. [Species List and ARG Counts](#6-species-list-and-arg-counts)
7. [Jaccard Similarity Matrix](#7-jaccard-similarity-matrix)
8. [ARG Name Mapping](#8-arg-name-mapping)
9. [Species Dropped and Why](#9-species-dropped-and-why)

---

## 1. File Inventory

All files are located under `data/`. The `card_r/` and `card_fasta/` subdirectories are gitignored.

| File | Path | Source | Size | Status |
|---|---|---|---|---|
| CARD-R Prevalence | `data/card_r/card_prevalence.txt.gz` | card.mcmaster.ca/latest/variants | 239 KB (gz) | **Downloaded** |
| CARD-R Genomes | `data/card_r/card-genomes.txt.gz` | card.mcmaster.ca/latest/variants | 5.7 MB (gz) | Downloaded (not used for graph) |
| CARD FASTA (homolog) | `data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta` | card.mcmaster.ca/latest/data | 6.3 MB | **Downloaded** |
| ARO Index | `data/card_fasta/aro_index.tsv` | card.mcmaster.ca/latest/data | 1.1 MB | Downloaded (reference) |
| ARO Categories Index | `data/card_fasta/aro_categories_index.tsv` | card.mcmaster.ca/latest/data | 726 KB | Downloaded (reference) |
| HGT Graph (generated) | `data/hgt_graph.txt` | `build_graph.py` output | — | To be generated |
| ARG DAG (hand-authored) | `data/arg_dag.txt` | Manual | — | To be authored |
| Boyer-Moore FASTA (filtered) | `data/arg_sequences.fasta` | Filtered from CARD FASTA | — | To be generated |
| Hospital Subgraph | `data/hospital_subgraph.txt` | `build_graph.py` output | — | To be generated |

---

## 2. Dataset 1 — `card_prevalence.txt.gz`

### Source
- **Download URL:** `https://card.mcmaster.ca/latest/variants`
- **Archive format:** `.tar.bz2` — extract with `tar -xjf card_variants.tar.bz2 -C data/card_r/`
- **CARD version at download:** 4.0.2 (November 2023)
- **File within archive:** `card_prevalence.txt.gz`

### Exact Schema

Verified by direct `head` inspection. Tab-separated, gzip-compressed. **11 columns, zero nulls.**

| Column name | dtype | Meaning |
|---|---|---|
| `ARO Accession` | string | Unique ARG identifier (e.g., `ARO:3002999`) |
| `Name` | string | Allele-level gene name (e.g., `TEM-1`, `NDM-6`, `CTX-M-15`) |
| `Model ID` | int | CARD internal model ID |
| `Model Type` | string | Detection model class (see below) |
| `Pathogen` | string | Species name (e.g., `Klebsiella pneumoniae`) |
| `NCBI Plasmid` | float 0–100 | **% of sequenced genomes** where this ARG was found on a plasmid |
| `NCBI WGS` | float 0–100 | **% of sequenced genomes** (whole-genome shotgun, all element types) |
| `NCBI Chromosome` | float 0–100 | **% of sequenced genomes** where found on chromosome |
| `NCBI Genomic Island` | float 0–100 | **% of sequenced genomes** where found on a genomic island |
| `Criteria` | string | RGI detection confidence: either `perfect` or `perfect_strict` |
| `ARO Categories` | string | Semicolon-separated: resistance mechanism + drug classes |

**Important:** `NCBI Plasmid`, `NCBI WGS`, `NCBI Chromosome`, and `NCBI Genomic Island` are percentages on a 0–100 scale. A value of `11.55` means the ARG was found in 11.55% of sequenced genomes of that species on that element type. They are **not** proportions (0–1).

### Model Type Values
The four exact values present in the data:
- `protein homolog model` — 19,267 rows (96.1%)
- `protein variant model` — 527 rows
- `protein overexpression model` — 206 rows
- `rRNA gene variant model` — 41 rows

For graph construction, use only `protein homolog model` rows. These represent genes whose presence alone (homology to a reference) confers resistance — the primary class of horizontally transferred ARGs.

### Criteria Values
Only two values exist: `perfect` (6,786 rows) and `perfect_strict` (13,255 rows). Both are high-confidence RGI hits. **Do not filter on Criteria** — keep both.

### Dataset Statistics
- **Total rows:** 20,041
- **Unique pathogens:** 413
- **Unique ARG names:** verified by EDA

---

## 3. The Correct Filter for Graph Construction

### Why `NCBI Plasmid > 1` is the right filter

The goal is to capture ARGs that are **horizontally transferable via plasmids** — the biological basis for HGT edges in the graph. Three columns were evaluated:

| Filter | Captures | Problem |
|---|---|---|
| `NCBI WGS >= 5` | All ARGs found in ≥5% of genomes | Includes intrinsic chromosomal genes (`rsmA`, `CRP`, `H-NS`, `msbA`, `ArnT`, `LptD`) that are present in nearly every genome but are **never transferred horizontally**. These would create meaningless graph edges. |
| `NCBI Plasmid >= 5` | ARGs on plasmid in ≥5% of genomes | Too strict — only 5–21 ARGs per species, producing a very sparse graph. |
| `NCBI Plasmid > 1` | ARGs on plasmid in >1% of genomes | **Correct.** Captures genuinely mobile, conjugation-transferable ARGs. Excludes chromosomal intrinsic genes. Gives 13–60 ARGs per species. |

**Verified example of the problem with WGS filter:** For *K. pneumoniae*, the top ARGs by `NCBI WGS` are `rsmA` (57.5%), `CRP` (57.4%), `ArnT` (57.4%) — efflux regulators present in virtually every K. pneumoniae genome on the chromosome. Their `NCBI Plasmid` value is 0.00–0.01. Using WGS would include these as shared ARGs between species, inflating Jaccard scores with biologically meaningless co-occurrence.

### Filter to apply in `build_graph.py`

```python
# Load ARG set for one species — mobile/HGT-relevant ARGs only
sub = df[
    (df["Pathogen"] == species_name) &
    (df["NCBI Plasmid"] > 1) &
    (df["Model Type"] == "protein homolog model")
]
arg_set = set(sub["Name"].unique())
```

---

## 4. Dataset 2 — `nucleotide_fasta_protein_homolog_model.fasta`

### Source
- **Download URL:** `https://card.mcmaster.ca/latest/data`
- **Archive format:** `.tar.bz2` — extract with `tar -xjf card_data.tar.bz2 -C data/card_fasta/`
- **CARD version at download:** 4.0.1 (May 2025)
- **File within archive:** `nucleotide_fasta_protein_homolog_model.fasta`

### Statistics
- **Total sequences:** 6,052
- **Sequence length:** min=162 bp, max=4,359 bp, median=873 bp, mean=964 bp
- **Alphabet:** DNA nucleotide {A, T, C, G} — 4-character alphabet (relevant for Boyer-Moore bad-character table)

### Header Format

Every FASTA header follows this exact structure:
```
>gb|<GenBank_accession>|<strand>|<coords>|ARO:<aro_id>|<gene_name> [<organism>]
```

Example:
```
>gb|JN967644.1|+|0-813|ARO:3002356|NDM-6 [Escherichia coli]
>gb|HQ845196.1|+|0-861|ARO:3001109|SHV-52 [Klebsiella pneumoniae]
>gb|AF028812.1|+|392-887|ARO:3002867|dfrF [Enterococcus faecalis]
```

To extract the gene name from a header in Python:
```python
import re
match = re.search(r'\|ARO:\d+\|(.+?) \[', header)
gene_name = match.group(1).strip()  # e.g., "NDM-6", "SHV-52"
```

### Target ARG Availability for Boyer-Moore

Sequence counts for the 6 target ARG families (searched by gene name substring):

| ARG family | Search term | Sequences available | Example gene name |
|---|---|---|---|
| TEM β-lactamase | `TEM-` | 216 | `TEM-126`, `TEM-1` |
| CTX-M β-lactamase | `CTX-M-` | 266 | `CTX-M-15`, `CTX-M-55` |
| SHV β-lactamase | `SHV-` | 216 | `SHV-52`, `SHV-24` |
| KPC carbapenemase | `KPC-` | 230 | `KPC-2`, `KPC-10` |
| NDM metallo-β-lactamase | `NDM-` | 71 | `NDM-1`, `NDM-6` |
| MCR-1 colistin resistance | `MCR-1` | 38 | `MCR-1.1`, `MCR-1.5` |
| OXA-48 carbapenemase | `OXA-48` | 10 | `OXA-48`, `OXA-484` |
| tet(M) tetracycline | `tet(M)` | 1 | `tet(M)` |
| sul1 sulfonamide | exact `sul1` | 1 | `sul1` |
| VanA cluster | `vanR_in_vanA_cl` | ~7 | `vanR_in_vanA_cl`, `vanH_in_vanA_cl` |

**To filter sequences for Boyer-Moore demo** (`data/arg_sequences.fasta`), use:
```bash
grep -A1 "NDM-1 \[" data/card_fasta/nucleotide_fasta_protein_homolog_model.fasta | grep -v "^--$" > data/arg_sequences.fasta
```
Or use Python with the `re` pattern above to extract specific alleles.

**Recommendation for Boyer-Moore demo:** Use `NDM-1` (813 bp) as the pattern P and the concatenated K. pneumoniae-associated sequences as text T. NDM-1 has 71 sequences including one from E. coli and multiple from K. pneumoniae, making the demo biologically coherent.

---

## 5. Supporting CARD Files

### `aro_index.tsv`
Columns: `ARO Accession`, `CVTERM ID`, `Model Sequence ID`, `Model ID`, `Model Name`, `ARO Name`, `Protein Accession`, `DNA Accession`, `AMR Gene Family`, `Drug Class`, `Resistance Mechanism`, `CARD Short Name`

Use to: map ARO accessions to human-readable gene family names.

### `aro_categories_index.tsv`
Columns: `Protein Accession`, `DNA Accession`, `AMR Gene Family`, `Drug Class`, `Resistance Mechanism`

Use to: look up drug class and resistance mechanism for any ARG.

---

## 6. Graph Construction Parameters

These values are derived directly from EDA on the downloaded data.

### Filter
```
NCBI Plasmid > 1.0    (float, percentage scale 0–100)
Model Type == "protein homolog model"
```

### Expected Graph Properties (computed from EDA)
- **Nodes:** 16 species (see Section 6 table)
- **Directed edges:** ~144 (72 unique undirected pairs × 2 directions, bidirectional for all pairs)
- **Jaccard threshold for edge creation:** 0.10 (Jaccard before taxonomic correction)
- **Minimum adjusted weight to keep edge:** 0.05 (after Jaccard × τ)
- **Edge weight stored in file:** raw adjusted probability `w = Jaccard × τ ∈ (0, 1]`
- **Edge weight used by Dijkstra/Floyd-Warshall:** `-log(w)` — computed internally, not stored

### Taxonomic Correction Factor τ

| Relationship | τ value | Example pair |
|---|---|---|
| Same genus | 1.0 | *K. pneumoniae* ↔ *K. oxytoca* |
| Same Gram class, different genus | 0.75 | *K. pneumoniae* ↔ *E. coli* |
| Cross Gram-stain barrier | 0.5 | *K. pneumoniae* ↔ *E. faecium* |

Gram-positive species in this dataset: *Enterococcus faecium*, *Enterococcus faecalis*, *Staphylococcus aureus*. All others are Gram-negative.

---

## 7. Species List and ARG Counts

16 species confirmed usable. ARG counts use `NCBI Plasmid > 1` filter + `protein homolog model` only.

| Species | Role in graph | Plasmid ARGs | Notes |
|---|---|---|---|
| *Klebsiella pneumoniae* | ESKAPE clinical target | 46 | Primary high-risk target |
| *Enterobacter cloacae* | ESKAPE clinical target | 56 | High Jaccard with K. pneumoniae |
| *Pseudomonas aeruginosa* | ESKAPE clinical target | 39 | — |
| *Enterococcus faecium* | ESKAPE clinical target | 22 | Gram-positive |
| *Staphylococcus aureus* | ESKAPE clinical target | 13 | Gram-positive |
| *Acinetobacter baumannii* | ESKAPE clinical target | 16 | — |
| *Escherichia coli* | Bridge node (env → clinical) | 25 | High connectivity |
| *Salmonella enterica* | Bridge node | 46 | — |
| *Enterococcus faecalis* | Environmental reservoir | 26 | Gram-positive |
| *Campylobacter jejuni* | Environmental reservoir | 7 | Sparse — few edges |
| *Acinetobacter pittii* | Bridge node (wastewater) | 14 | Same genus as A. baumannii |
| *Pseudomonas putida* | Bridge node (wastewater) | 25 | Same genus as P. aeruginosa |
| *Proteus mirabilis* | Bridge node | 60 | Highest ARG count |
| *Klebsiella oxytoca* | Bridge node | 43 | Same genus as K. pneumoniae |
| *Serratia marcescens* | Bridge node | 41 | — |
| *Citrobacter freundii* | Bridge node | 39 | — |

---

## 8. Jaccard Similarity Matrix

All 72 pairs meeting `Jaccard >= 0.10` after applying `NCBI Plasmid > 1` filter. Sorted by adjusted weight `w = Jaccard × τ`. These become the directed edges in `hgt_graph.txt` (each undirected pair becomes two directed edges with equal weight).

| Adj. Weight | Jaccard | Shared ARGs | Species A | Species B |
|---|---|---|---|---|
| 0.7143 | 0.7143 | 20 | *Enterococcus faecium* | *Enterococcus faecalis* |
| 0.4355 | 0.4355 | 27 | *Klebsiella pneumoniae* | *Klebsiella oxytoca* |
| 0.4286 | 0.4286 | 9 | *Acinetobacter baumannii* | *Acinetobacter pittii* |
| 0.4180 | 0.5574 | 34 | *Enterobacter cloacae* | *Citrobacter freundii* |
| 0.4091 | 0.5455 | 30 | *Klebsiella pneumoniae* | *Citrobacter freundii* |
| 0.3750 | 0.5000 | 34 | *Klebsiella pneumoniae* | *Enterobacter cloacae* |
| 0.3582 | 0.4776 | 32 | *Enterobacter cloacae* | *Klebsiella oxytoca* |
| 0.3482 | 0.4643 | 26 | *Klebsiella oxytoca* | *Citrobacter freundii* |
| 0.3390 | 0.4521 | 33 | *Klebsiella pneumoniae* | *Proteus mirabilis* |
| 0.3367 | 0.4490 | 22 | *Escherichia coli* | *Salmonella enterica* |
| 0.3061 | 0.3061 | 15 | *Pseudomonas aeruginosa* | *Pseudomonas putida* |
| 0.3043 | 0.4058 | 28 | *Enterobacter cloacae* | *Serratia marcescens* |
| 0.3000 | 0.4000 | 24 | *Klebsiella oxytoca* | *Serratia marcescens* |
| 0.2961 | 0.3947 | 30 | *Salmonella enterica* | *Proteus mirabilis* |
| 0.2955 | 0.3939 | 26 | *Klebsiella pneumoniae* | *Salmonella enterica* |
| 0.2845 | 0.3793 | 22 | *Serratia marcescens* | *Citrobacter freundii* |
| 0.2713 | 0.3617 | 17 | *Escherichia coli* | *Citrobacter freundii* |
| 0.2700 | 0.3600 | 18 | *Escherichia coli* | *Klebsiella oxytoca* |
| 0.2695 | 0.3594 | 23 | *Klebsiella pneumoniae* | *Serratia marcescens* |
| 0.2671 | 0.3562 | 26 | *Proteus mirabilis* | *Citrobacter freundii* |
| 0.2664 | 0.3553 | 27 | *Proteus mirabilis* | *Klebsiella oxytoca* |
| 0.2619 | 0.3492 | 22 | *Salmonella enterica* | *Citrobacter freundii* |
| 0.2619 | 0.3492 | 22 | *Escherichia coli* | *Proteus mirabilis* |
| 0.2616 | 0.3488 | 30 | *Enterobacter cloacae* | *Proteus mirabilis* |
| 0.2614 | 0.3485 | 23 | *Salmonella enterica* | *Klebsiella oxytoca* |
| 0.2547 | 0.3396 | 18 | *Klebsiella pneumoniae* | *Escherichia coli* |
| 0.2435 | 0.3247 | 25 | *Enterobacter cloacae* | *Salmonella enterica* |
| 0.2123 | 0.2830 | 15 | *Klebsiella oxytoca* | *Pseudomonas putida* |
| 0.2115 | 0.2821 | 11 | *Escherichia coli* | *Pseudomonas putida* |
| 0.2100 | 0.2800 | 14 | *Pseudomonas putida* | *Citrobacter freundii* |
| 0.1992 | 0.2656 | 17 | *Escherichia coli* | *Enterobacter cloacae* |
| 0.1852 | 0.2469 | 20 | *Proteus mirabilis* | *Serratia marcescens* |
| 0.1846 | 0.2462 | 16 | *Enterobacter cloacae* | *Pseudomonas putida* |
| 0.1840 | 0.2453 | 13 | *Escherichia coli* | *Serratia marcescens* |
| 0.1679 | 0.2239 | 15 | *Pseudomonas aeruginosa* | *Klebsiella oxytoca* |
| 0.1667 | 0.2222 | 18 | *Pseudomonas aeruginosa* | *Proteus mirabilis* |
| 0.1641 | 0.2188 | 7 | *Escherichia coli* | *Acinetobacter pittii* |
| 0.1641 | 0.2188 | 7 | *Acinetobacter pittii* | *Pseudomonas putida* |
| 0.1607 | 0.2143 | 15 | *Proteus mirabilis* | *Pseudomonas putida* |
| 0.1525 | 0.2034 | 12 | *Salmonella enterica* | *Pseudomonas putida* |
| 0.1525 | 0.2034 | 12 | *Klebsiella pneumoniae* | *Pseudomonas putida* |
| 0.1500 | 0.2000 | 11 | *Serratia marcescens* | *Pseudomonas putida* |
| 0.1500 | 0.2000 | 10 | *Klebsiella pneumoniae* | *Acinetobacter pittii* |
| 0.1479 | 0.1972 | 14 | *Klebsiella pneumoniae* | *Pseudomonas aeruginosa* |
| 0.1455 | 0.1940 | 13 | *Pseudomonas aeruginosa* | *Serratia marcescens* |
| 0.1452 | 0.1935 | 12 | *Proteus mirabilis* | *Acinetobacter pittii* |
| 0.1438 | 0.1918 | 14 | *Salmonella enterica* | *Serratia marcescens* |
| 0.1406 | 0.1875 | 15 | *Pseudomonas aeruginosa* | *Enterobacter cloacae* |
| 0.1333 | 0.1778 | 8 | *Acinetobacter pittii* | *Citrobacter freundii* |
| 0.1286 | 0.1714 | 6 | *Escherichia coli* | *Acinetobacter baumannii* |
| 0.1286 | 0.1714 | 6 | *Acinetobacter baumannii* | *Pseudomonas putida* |
| 0.1277 | 0.1702 | 8 | *Serratia marcescens* | *Acinetobacter pittii* |
| 0.1277 | 0.1702 | 8 | *Acinetobacter baumannii* | *Pseudomonas aeruginosa* |
| 0.1274 | 0.1698 | 9 | *Klebsiella pneumoniae* | *Acinetobacter baumannii* |
| 0.1269 | 0.1692 | 11 | *Acinetobacter baumannii* | *Proteus mirabilis* |
| 0.1250 | 0.1667 | 10 | *Enterobacter cloacae* | *Acinetobacter pittii* |
| 0.1231 | 0.1642 | 11 | *Pseudomonas aeruginosa* | *Citrobacter freundii* |
| 0.1224 | 0.1633 | 8 | *Klebsiella oxytoca* | *Acinetobacter pittii* |
| 0.1176 | 0.1569 | 8 | *Acinetobacter baumannii* | *Klebsiella oxytoca* |
| 0.1154 | 0.1538 | 8 | *Salmonella enterica* | *Acinetobacter pittii* |
| 0.1141 | 0.1522 | 7 | *Pseudomonas aeruginosa* | *Acinetobacter pittii* |
| 0.1103 | 0.1471 | 5 | *Staphylococcus aureus* | *Enterococcus faecalis* |
| 0.1050 | 0.1400 | 7 | *Acinetobacter baumannii* | *Serratia marcescens* |
| 0.1000 | 0.1333 | 10 | *Pseudomonas aeruginosa* | *Salmonella enterica* |
| 0.0968 | 0.1290 | 4 | *Enterococcus faecium* | *Staphylococcus aureus* |
| 0.0955 | 0.1273 | 7 | *Acinetobacter baumannii* | *Salmonella enterica* |
| 0.0938 | 0.1250 | 8 | *Acinetobacter baumannii* | *Enterobacter cloacae* |
| 0.0921 | 0.1228 | 7 | *Escherichia coli* | *Pseudomonas aeruginosa* |
| 0.0882 | 0.1765 | 3 | *Staphylococcus aureus* | *Campylobacter jejuni* |
| 0.0750 | 0.1000 | 5 | *Acinetobacter baumannii* | *Citrobacter freundii* |
| 0.0577 | 0.1154 | 3 | *Enterococcus faecium* | *Campylobacter jejuni* |
| 0.0500 | 0.1000 | 3 | *Enterococcus faecalis* | *Campylobacter jejuni* |

**Note on the last 7 rows (adj. weight < 0.10):** These pairs pass the raw Jaccard threshold of 0.10 but fall below the adjusted weight minimum of 0.05 for only a few of them; whether to include them is a tuning parameter. At the default threshold pair (`Jaccard >= 0.10 AND adjusted_weight >= 0.05`), all 72 pairs above are included.

---

## 9. ARG Name Mapping

The project specification uses informal/family-level names for the ARG dependency DAG. These do **not** exist verbatim in the CARD `Name` column. The mapping from spec names to real CARD `Name` values is:

| Spec name (informal) | Real CARD `Name` examples | Search pattern |
|---|---|---|
| `tetM` | `tet(M)` | exact: `tet(M)` |
| `sul1` | `sul1` | exact: `sul1` |
| `aac(6')-Ib` | `AAC(6')-Ib`, `AAC(6')-Ib-cr6`, `AAC(6')-Ib10` | startswith: `AAC(6')-Ib` |
| `blaTEM` | `TEM-1`, `TEM-34`, `TEM-116`, `TEM-126` (hundreds) | startswith: `TEM-` |
| `blaSHV` | `SHV-52`, `SHV-24`, `SHV-41` (many) | startswith: `SHV-` |
| `blaCTX-M` | `CTX-M-15`, `CTX-M-55`, `CTX-M-130` (many) | startswith: `CTX-M-` |
| `blaOXA-48` | `OXA-48`, `OXA-484`, `OXA-485` | startswith: `OXA-48` |
| `blaNDM-1` | `NDM-1`, `NDM-6`, `NDM-13` | startswith: `NDM-` |
| `mcr-1` | `MCR-1.1`, `MCR-1.2`, `MCR-1.5`, `MCR-1.33` | startswith: `MCR-1` |
| `vanA` | `vanR gene in vanA cluster`, `vanH gene in vanA cluster` | contains: `vanA` |

For **graph construction** (Jaccard ARG set overlap): group alleles into families using the patterns above. Two species share the "TEM family" if they both have any `TEM-*` allele with `NCBI Plasmid > 1`.

For **ARG dependency DAG** (`arg_dag.txt`): node names should use the informal family names (`blaTEM`, `blaSHV`, etc.) since the DAG is a conceptual model, not a CARD lookup. The file is hand-authored.

For **Boyer-Moore FASTA** (`arg_sequences.fasta`): use specific allele names for sequence extraction. Recommended alleles with confirmed FASTA entries: `NDM-1` (813 bp), `CTX-M-15` (876 bp), `TEM-1` (861 bp), `KPC-2` (specific allele for carbapenem demo), `MCR-1.1` (1626 bp).

---

## 10. Species Dropped and Why

| Species | Reason | Action |
|---|---|---|
| *Streptomyces coelicolor* | **Not in CARD-R at all** — zero rows across all 20,041 records | Remove from species list entirely |
| *Bacillus subtilis* | 0 ARGs with `NCBI Plasmid > 1` (only 2 with Plasmid > 0, both borderline) | Remove from species list |
| *Streptococcus pneumoniae* | 0 ARGs with `NCBI Plasmid > 1` and 0 with `NCBI Plasmid > 0` | Remove from species list |
| *Clostridioides difficile* | Only 11 total rows, 0 with `NCBI WGS >= 5`, 0 with `NCBI Plasmid > 0` | Remove from species list |

The 16 remaining species form a well-connected graph with biologically sensible Jaccard similarities. No substitutes are needed — the 16-node graph is sufficient for all project objectives.

---

*Dataset Reference — verified 2026-06-02 — TraceNet v1.0*
