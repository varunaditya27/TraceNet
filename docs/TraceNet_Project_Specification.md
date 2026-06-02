# TraceNet — Project Specification Document
### Tracking Resistance Across Clinical Ecosystems with Networks
**Design and Analysis of Algorithms — Course Project**
*B.E. Information Science Engineering, Semester IV · RVCE Bengaluru*
*Team: Varun Aditya · Tanisha R.*

---

> **Document Purpose**
> This document is the single authoritative reference for the TraceNet project. It covers the complete rationale, biological context, mathematical model, algorithm design, implementation architecture, data pipeline, evaluation plan, and viva strategy. No aspect of the project should require external clarification beyond what is written here. Every design decision is justified, every trade-off is acknowledged, and every algorithm is traced back to both its technical purpose and its syllabus requirement.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background and Motivation](#2-background-and-motivation)
3. [Problem Statement](#3-problem-statement)
4. [Research Gap Analysis](#4-research-gap-analysis)
5. [Project Goals and Objectives](#5-project-goals-and-objectives)
6. [Scope and Non-Scope](#6-scope-and-non-scope)
7. [Biological Primer — What You Need to Know](#7-biological-primer--what-you-need-to-know)
8. [Graph Model Specification](#8-graph-model-specification)
9. [Data Architecture](#9-data-architecture)
10. [Algorithm Design](#10-algorithm-design)
11. [System Architecture](#11-system-architecture)
12. [Repository Structure](#12-repository-structure)
13. [Implementation Plan](#13-implementation-plan)
14. [Experiments and Evaluation](#14-experiments-and-evaluation)
15. [Demo and Presentation Narrative](#15-demo-and-presentation-narrative)
16. [NP-Hardness Analysis](#16-np-hardness-analysis)
17. [Complexity Summary Table](#17-complexity-summary-table)
18. [Limitations and Honest Caveats](#18-limitations-and-honest-caveats)
19. [Viva Defense Strategy](#19-viva-defense-strategy)
20. [Glossary](#20-glossary)

---

## 1. Executive Summary

TraceNet is a graph algorithms project that models the spread of antibiotic resistance genes (ARGs) through bacterial populations as a weighted directed graph problem, then applies a comprehensive set of classical DAA algorithms to analyze spread dynamics and recommend containment strategies.

The biological domain — antimicrobial resistance (AMR) — is one of the most urgent global health crises of the 21st century, with resistance genes moving between bacterial species through a process called horizontal gene transfer (HGT). TraceNet treats this movement as a graph traversal and optimization problem: bacteria are nodes, HGT events are directed weighted edges, and the spread of resistance is a reachability and shortest-path problem. Containment becomes a graph cut problem.

The project implements eight core algorithms spanning Units II through V of the DAA syllabus, integrates real biological data from the Comprehensive Antibiotic Resistance Database (CARD), and produces a set of analytical outputs — spread paths, vulnerability matrices, resistance community clusters, and intervention rankings — that form a coherent, defensible analytical story.

TraceNet is not a medical tool. It is a graph analysis engine applied to a biologically meaningful domain. The biological framing provides motivation, real data, and a compelling demo narrative. The algorithms are the actual intellectual substance of the project.

**Name etymology:** TraceNet = **T**racking **R**esistance **A**cross **C**linical **E**cosystems with **N**etworks.

---

## 2. Background and Motivation

### 2.1 The Global AMR Crisis

Antibiotic resistance is the process by which bacteria evolve mechanisms to survive exposure to antibiotics that would normally kill or inhibit them. When this happens, standard treatments fail, infections persist, and the probability of death from previously treatable conditions increases significantly.

The scale of this problem is measurable and alarming. Resistance is projected to cause tens of millions of deaths annually by mid-century if current trends continue. Hospitals are the most dangerous environments for resistance spread because they concentrate vulnerable patients, high antibiotic use (which creates selection pressure for resistant strains), and diverse bacterial populations in close proximity.

### 2.2 How Resistance Spreads — The HGT Mechanism

Unlike humans, bacteria can share genetic material not just with their offspring but with entirely unrelated bacteria in a process called horizontal gene transfer (HGT). This is the primary mechanism by which antibiotic resistance spreads so rapidly.

HGT occurs through three main pathways:

**Conjugation** — The most clinically significant pathway. A bacterium physically connects with another and transfers a plasmid (a small circular DNA element) containing resistance genes. Plasmids are the primary vehicles for ARG spread. Some plasmids have broad host ranges, meaning they can transfer between distantly related species.

**Transformation** — A bacterium takes up free DNA from its environment. If that DNA contains resistance genes, the bacterium incorporates them into its genome.

**Transduction** — Bacteriophages (viruses that infect bacteria) accidentally package resistance genes from one host and deliver them to the next.

The clinical consequence is that resistance in one species rapidly becomes resistance in many species. A resistance gene discovered in a soil bacterium can appear in a hospital pathogen within years because of these transfer mechanisms.

### 2.3 Why This Is a Graph Problem

The spread of ARGs through bacterial populations has exactly the structure of a directed weighted graph problem:

- **Nodes** represent bacterial species or strains occupying different ecological niches (soil, livestock gut, wastewater, hospital environment).
- **Directed edges** represent documented or probable HGT events — the transfer of resistance genes from one species to another.
- **Edge weights** represent the probability or frequency of transfer — how easily resistance flows from species A to species B.
- **Reachability queries** — "Can this resistance gene reach *Klebsiella pneumoniae* from this environmental reservoir?" — are BFS/DFS questions.
- **Shortest path queries** — "What is the most likely route by which this gene will reach a hospital pathogen?" — are Dijkstra questions.
- **Community detection** — "Which groups of bacteria form closed resistance-sharing loops?" — is an SCC question.
- **Containment** — "Which HGT pathways, if blocked, would most effectively prevent resistance from reaching clinical targets?" — is a graph cut / minimum edge removal question.

This structural correspondence is not an analogy. The underlying mathematics are the same. Graph algorithms designed for network routing, social network analysis, and supply chain optimization apply directly to resistance spread analysis, with the same theoretical guarantees.

### 2.4 Why This Project Matters for a DAA Course

The professor's guidance explicitly emphasizes graph problems with real-world applications, algorithm comparison, and visualization. AMR spread modeling satisfies all three requirements simultaneously while adding a layer of biological significance that distinguishes the project from the standard "shortest path between cities" implementation.

The project also covers every unit of the DAA syllabus in a unified narrative, which is rare. Most projects cover one or two units; TraceNet covers Units II, III, IV, and V through algorithms that all serve the same end-to-end story.

---

## 3. Problem Statement

**Formal statement:**

Given a weighted directed graph G = (V, E, w) where:
- V is a set of bacterial species/strains
- E is a set of directed edges representing documented HGT pathways
- w: E → (0, 1] assigns each edge a transfer probability

TraceNet addresses the following analytical questions:

1. **Reachability:** From a given environmental reservoir node s, which clinical pathogen nodes are reachable, and within how many transfer events?

2. **Community structure:** Which subsets of V form strongly connected components — groups where resistance circulates freely in all directions?

3. **Acquisition ordering:** Given a directed acyclic graph of ARG co-dependencies (gene B requires gene A to be functional), what is a valid topological order of resistance gene acquisition?

4. **String presence:** Given a short reference ARG DNA sequence (pattern P) and a reference string T drawn from CARD's sequence database, does P occur in T, and where?

5. **Minimum-cost spread path:** What is the minimum-weight path (most probable transfer route) from environmental reservoir s to clinical target t?

6. **All-pairs spread distance:** What is the minimum transfer cost between every pair of species in V — a complete vulnerability matrix?

7. **Approximate containment:** Using a greedy heuristic, which edges of E, if removed, would sever the highest-weight connection from s to t while minimizing the number of edges removed?

8. **Exact containment on subgraphs:** For a reduced graph G' ⊂ G representing only hospital pathogens, what is the provably optimal set of edges to remove, found via branch-and-bound?

9. **Complexity characterization:** Is the general optimal containment problem tractable, and if not, how does the approximation ratio of the greedy solution relate to the optimum?

---

## 4. Research Gap Analysis

### 4.1 What exists in the literature

AMR spread has been extensively studied from biological, epidemiological, and computational angles:

- **Ellabaan et al. (2021)** in Nature Communications identified 152 gene exchange networks containing 22,963 bacterial genomes using a statistical framework for putative HGT detection. They forecast future ARG dissemination but do not frame containment as a graph optimization problem.

- **Guerrero-Flores et al. (2025)** in Frontiers in Microbiology applied topological data analysis (TDA) to capture HGT in resistance gene families among clinically relevant bacteria. TDA is algebraic topology, not classical graph algorithms.

- **A 2025 bioRxiv preprint** proposed a knowledge graph framework integrating NCBI, CARD, ICEberg, and KEGG for HGT detection using graph neural networks for link prediction. This is a machine learning approach to detection, not an algorithmic approach to containment.

- **Acman et al. (2020)** in Nature Communications constructed a plasmid network from 10,000+ bacterial plasmids using k-mer similarity, applying community detection. This is a network science analysis, not a DAA-algorithm-focused implementation.

### 4.2 The gap TraceNet occupies

Every existing computational approach addresses one of three tasks:
- **Detection** — identifying that HGT occurred between two species.
- **Forecasting** — predicting which species will acquire which ARGs in the future.
- **Network description** — characterizing the structure of the existing transfer network.

**No existing work frames the problem as a classical DAA optimization problem with explicit algorithm selection, complexity analysis, approximation guarantees, and intervention ranking using textbook graph algorithms.** This is the gap TraceNet occupies — not because the biology is undiscovered, but because the algorithmic framing is new and the implementation at an undergraduate DAA level is genuinely novel.

The positioning is precise: TraceNet is not original research in AMR biology. It is an original application of DAA algorithms to a biologically meaningful domain, with a coherent analytical narrative that no prior DAA course project has executed.

### 4.3 Honest novelty assessment

| Level | Novelty |
|---|---|
| Research / publication level | Low — the biological domain is well-studied |
| DAA course project level | High — no comparable implementation exists |
| Algorithm selection | Medium — the algorithms are textbook, the combination and framing are not |
| Data usage | Medium — CARD is public, but using it for a DAA graph project is unusual |

The honest framing: TraceNet is a well-structured algorithmic application of a meaningful domain, not a claim to original biological discovery.

---

## 5. Project Goals and Objectives

### 5.1 Primary goals

**G1 — Algorithmic completeness:** Implement a minimum of eight distinct algorithms from the DAA syllabus, each producing a distinct analytical output.

**G2 — Biological coherence:** Each algorithm must answer a question that makes biological sense in the context of AMR spread. No algorithm is included purely for coverage; each has a justified role in the analytical narrative.

**G3 — Data grounding:** The graph is constructed from real biological data (CARD-R prevalence statistics), not from synthetic or arbitrarily constructed inputs. This ensures the outputs are interpretable in the biological context.

**G4 — Visual output:** Every major algorithm produces a visual output — a graph diagram, a highlighted path, a matrix, or a clustered subgraph — suitable for presentation and the viva.

**G5 — Comparative analysis:** For the containment problem, two algorithms (greedy approximation and branch-and-bound) solve the same problem on the same subgraph, enabling a direct comparison of solution quality and runtime.

### 5.2 Secondary objectives

**O1 — Complexity honesty:** Every algorithm is accompanied by its time complexity and space complexity, justified from first principles, not stated without derivation.

**O2 — Limitation transparency:** The biological simplifications (Jaccard similarity as HGT proxy, absence of kinetic modeling, static graph assumption) are explicitly documented and defended.

**O3 — Reproducibility:** The data pipeline is scripted and deterministic. Any evaluator can reproduce the graph from the CARD download without manual intervention.

**O4 — Syllabus traceability:** Every algorithm maps to a specific unit and topic in the course syllabus. This mapping is documented in the algorithm section and referenced in the final report.

---

## 6. Scope and Non-Scope

### 6.1 In scope

- Construction of a weighted directed HGT graph with 16 bacterial species nodes from CARD-R prevalence data (confirmed by EDA).
- Implementation in C++ of all eight core algorithms, with clean separation of concerns (one `.cpp` file per algorithm module).
- Python preprocessing pipeline that downloads, parses, and transforms CARD-R data into the graph input format used by C++.
- A secondary ARG dependency DAG for topological sort, hand-curated from literature.
- Boyer-Moore string matching on CARD's reference ARG sequences in FASTA format.
- Graphviz DOT file generation for visualization of the species graph, highlighted paths, and SCC clusters.
- A comparison table showing greedy vs branch-and-bound containment results on a reduced subgraph.
- NP-hardness discussion of the general optimal containment problem.

### 6.2 Explicitly not in scope

- Real-time surveillance or epidemiological monitoring of hospital outbreaks.
- Whole-genome sequence alignment, BLAST, or read mapping.
- Machine learning, neural networks, or statistical inference for HGT detection.
- Clinical recommendation or medical decision support.
- Dynamic graph updates as new resistance data becomes available.
- Multi-drug resistance modeling beyond the structural graph level.
- Phylogenetic tree construction or ancestral state reconstruction.
- Kinetic modeling of bacterial population dynamics.
- The Ellabaan 2021 full pipeline (BLAST, statistical testing, phylogenetic distance calculation).

These exclusions are features, not deficiencies. They define TraceNet as an algorithmic analysis engine with a clear scope, not an overreaching tool that tries to do everything and does nothing well.

---

## 7. Biological Primer — What You Need to Know

This section provides the minimum biological knowledge required to understand the project without misrepresenting the science in a viva. It is not a biology course — it is the precise subset of biology that maps onto the algorithmic model.

### 7.1 Bacterial species and strains

Bacteria are single-celled organisms classified into species (e.g., *Escherichia coli*, *Klebsiella pneumoniae*) and further into strains (specific variants within a species). For TraceNet, the nodes of the graph represent species-level entities, not individual bacterial cells. A node labeled *K. pneumoniae* represents the collective genome pool of that species as characterized in genomic databases.

### 7.2 Antibiotic resistance genes (ARGs)

An ARG is a segment of DNA that, when expressed, produces a protein that confers resistance to one or more antibiotics. Examples:

| ARG | Mechanism | Antibiotic class |
|---|---|---|
| NDM-1 | Enzymatic inactivation (metallo-β-lactamase) | Carbapenems (last-resort) |
| CTX-M | Enzymatic inactivation (β-lactamase) | Cephalosporins |
| mcr-1 | Target modification | Colistin (last-resort) |
| vanA | Target modification | Vancomycin (last-resort) |
| tetM | Ribosome protection | Tetracyclines |
| aac(6') | Enzymatic inactivation (aminoglycoside acetyltransferase) | Aminoglycosides |

The genes labeled NDM-1 and mcr-1 are particularly significant because they confer resistance to antibiotics of last resort — drugs used only when all others have failed.

### 7.3 Plasmids as the primary HGT vehicle

Plasmids are small circular DNA molecules that exist separately from the main bacterial chromosome. They replicate independently and can transfer between cells during conjugation. Many ARGs are located on plasmids, which explains why resistance spreads rapidly: one transfer event can move multiple ARGs simultaneously.

**Broad-host-range (BHR) plasmids** are especially dangerous because they can transfer across taxonomically distant species — even across the Gram-positive/Gram-negative bacterial divide. Some BHR plasmids found in environmental bacteria have been detected in clinical pathogens, establishing a direct genetic link between environmental reservoirs and hospital outbreaks.

### 7.4 The ESKAPE pathogens

ESKAPE is an acronym for the six bacterial species most responsible for hospital-acquired infections and most frequently associated with antibiotic resistance:

- *Enterococcus faecium*
- *Staphylococcus aureus*
- *Klebsiella pneumoniae*
- *Acinetobacter baumannii*
- *Pseudomonas aeruginosa*
- *Enterobacter cloacae*

These species, plus *E. coli*, *Salmonella enterica*, and *Clostridioides difficile*, form the clinical target nodes in the TraceNet graph. They represent the "destination" of resistance spread that the containment algorithms try to prevent.

### 7.5 Environmental reservoirs

Before reaching hospital pathogens, resistance genes typically pass through environmental intermediaries:

- **Livestock gut bacteria** — Antibiotic use in agriculture selects for resistant strains in animal gut microbiomes. These bacteria shed into the environment via manure.
- **Wastewater treatment plants** — Concentrations of bacteria from human and animal sources, under antibiotic selection pressure, are breeding grounds for resistance gene exchange.
- **Soil bacteria** — Many antibiotics are naturally produced by soil bacteria. The genes conferring resistance to these antibiotics originated in soil, making soil the ancestral reservoir for most ARGs.

In the TraceNet graph, these environmental reservoirs are source nodes — the starting points for spread analysis.

### 7.6 What Jaccard similarity approximates

The Jaccard similarity between two species' ARG sets is calculated as:

```
Jaccard(A, B) = |ARGs(A) ∩ ARGs(B)| / |ARGs(A) ∪ ARGs(B)|
```

A high Jaccard score between two species means they share many of the same resistance genes. This is used as a proxy for HGT probability under the assumption that shared resistance genes indicate shared plasmid ancestry or documented transfer events.

This is an approximation. Real HGT probability depends on physical proximity, plasmid compatibility, restriction-modification systems, and selective pressure — none of which Jaccard captures directly. The project explicitly acknowledges this limitation. The Jaccard weight is a structured, defensible proxy that enables the graph construction without requiring biological wet lab data.

**Taxonomic correction:** A flat Jaccard score overestimates transfer probability between distantly related species. The weight is adjusted downward for cross-phylum edges (e.g., Gram-positive to Gram-negative transfers) using a penalty factor `τ = 0.5`, giving:

```
w(A→B) = Jaccard(A,B) × τ(A,B)
```

where `τ = 1.0` for same-genus pairs, `τ = 0.7` for same-family, `τ = 0.5` for cross-phylum.

---

## 8. Graph Model Specification

### 8.1 Primary graph — Species HGT network

**G = (V, E, w)**

**Vertex set V** (confirmed: 16 nodes — verified by EDA on CARD-R dataset):

| Category | Species | Plasmid ARGs | Role in graph |
|---|---|---|---|
| ESKAPE pathogens | *Klebsiella pneumoniae* | 46 | Primary clinical target |
| | *Enterobacter cloacae* | 56 | Clinical target |
| | *Pseudomonas aeruginosa* | 39 | Clinical target |
| | *Enterococcus faecium* | 22 | Clinical target |
| | *Staphylococcus aureus* | 13 | Clinical target |
| | *Acinetobacter baumannii* | 16 | Clinical target |
| Bridge nodes | *Escherichia coli* | 25 | Bridge (env → clinical) |
| | *Salmonella enterica* | 46 | Bridge node |
| | *Klebsiella oxytoca* | 43 | Bridge node |
| | *Citrobacter freundii* | 39 | Bridge node |
| | *Proteus mirabilis* | 60 | Bridge node |
| | *Serratia marcescens* | 41 | Bridge node |
| | *Acinetobacter pittii* | 14 | Bridge node (wastewater) |
| | *Pseudomonas putida* | 25 | Bridge node (wastewater) |
| Environmental reservoirs | *Enterococcus faecalis* | 26 | Source |
| | *Campylobacter jejuni* | 7 | Source |

**Dropped from original plan (confirmed 0 plasmid ARGs by EDA):**
- *Clostridioides difficile* — 0 ARGs with `NCBI Plasmid > 1`
- *Streptococcus pneumoniae* — 0 ARGs with `NCBI Plasmid > 1`
- *Bacillus subtilis* — 0 ARGs with `NCBI Plasmid > 1`
- *Streptomyces coelicolor* — not present in CARD-R database at all

**Edge set E:**
An edge (u → v, w) exists in E if:
1. Jaccard(u, v) > 0.10 (minimum ARG co-occurrence threshold), AND
2. The taxonomic-adjusted weight w(u→v) = Jaccard(u,v) × τ(u,v) > 0.05 (minimum transfer probability).

Directionality is assigned based on:
- Primary: Ellabaan 2021 supplementary data (explicitly directional gene exchange network data).
- Secondary: Ecological logic — environmental reservoir → clinical intermediate → ESKAPE target.
- Fallback: Bidirectional with equal weights for ambiguous pairs.

**Weight semantics:**
- Raw weight w(u→v) ∈ (0, 1] represents normalized transfer probability.
- Dijkstra/Floyd-Warshall use **distance = −log(w)** so that high-probability edges become short distances. A weight of 0.9 → distance of 0.105 (easy path). A weight of 0.05 → distance of 2.996 (hard path).

**Graph properties (confirmed by EDA):**
- |V| = 16
- |E| = 144 directed edges (72 undirected pairs, all bidirectional with equal weight)
- Jaccard range across edges: 0.10–0.71
- All edges bidirectional (directionality from Ellabaan 2021 not required — Jaccard produces a symmetric similarity)

### 8.2 Secondary graph — ARG dependency DAG

**D = (A, R)** where A is a set of ARG families and R is the set of dependency edges.

A directed edge (a → b) in D means "ARG a must be present or provides a functional advantage before ARG b confers full resistance." This is a biologically motivated simplification — in reality ARG interactions are complex — but it enables a clean topological sort demonstration.

**Node set A (curated, 10–12 ARGs):**

```
tetM                     (tetracycline resistance — ancestral, simple)
sul1                     (sulfonamide resistance — commonly co-carried with others)
aac(6')-Ib               (aminoglycoside resistance — intermediate)
blaTEM                   (broad-spectrum β-lactam resistance — foundational)
blaSHV                   (extended-spectrum β-lactam resistance)
blaCTX-M                 (extended-spectrum cephalosporin resistance)
blaOXA-48                (carbapenem resistance — intermediate)
blaNDM-1                 (metallo-β-lactamase, carbapenem resistance — advanced)
mcr-1                    (colistin resistance — last resort)
vanA                     (vancomycin resistance — gram-positive last resort)
```

**Edge set R (curated dependency edges):**

```
tetM       → blaTEM        (baseline resistance genes often co-mobilized on same plasmid)
sul1       → blaTEM        (integron-carried sulfonamides accompany β-lactam cassettes)
blaTEM     → blaSHV        (SHV evolved from TEM-type; co-occurrence in same strains)
blaSHV     → blaCTX-M     (CTX-M requires background ESBL context to establish)
blaCTX-M   → blaOXA-48    (OXA carbapenemases emerge in ESBL-carrying strains)
blaOXA-48  → blaNDM-1     (NDM is more frequently found in strains already carrying OXA)
aac(6')-Ib → blaNDM-1     (aminoglycoside + carbapenem co-resistance common in NDM strains)
blaCTX-M   → mcr-1        (colistin resistance emerges under pressure in ESBL strains)
```

This DAG has no cycles by construction. Topological sort produces a valid acquisition order.

**Important note:** These dependency edges are biological correlations, not strict logical prerequisites. The DAG models clinical co-occurrence patterns, not chemical necessity. This distinction is stated explicitly in the project report.

### 8.3 Graph file format — `hgt_graph.txt`

```
<n_nodes>
<n_edges>
<node_0_name>
<node_1_name>
...
<node_n-1_name>
<src_idx> <tgt_idx> <weight> <ARG_label_1,ARG_label_2,...>
<src_idx> <tgt_idx> <weight> <ARG_label_1,ARG_label_2,...>
...
```

Example (reflecting confirmed 16-node graph):
```
16
144
Acinetobacter_baumannii
Acinetobacter_pittii
Campylobacter_jejuni
Citrobacter_freundii
Enterobacter_cloacae
Enterococcus_faecalis
Enterococcus_faecium
Escherichia_coli
Klebsiella_oxytoca
Klebsiella_pneumoniae
Proteus_mirabilis
Pseudomonas_aeruginosa
Pseudomonas_putida
Salmonella_enterica
Serratia_marcescens
Staphylococcus_aureus
0 1 0.4286 APH(3'')-Ib,APH(3')-VIa,APH(6)-Id,OXA-58,sul1
4 3 0.4180 AAC(3)-IId,AAC(6')-Ib-cr6,APH(3'')-Ib,APH(6)-Id,BRP(MBL)
9 4 0.3750 AAC(3)-IId,AAC(6')-Ib-cr6,APH(3'')-Ib,APH(3')-Ia,APH(6)-Id
...
```

---

## 9. Data Architecture

### 9.1 Data sources

**Primary: CARD-R Prevalence Data**

- URL: `https://card.mcmaster.ca/latest/variants`
- Format: `.tar.bz2` archive — extract to `data/card_r/`
- Key file: `card_prevalence.txt.gz` — single tab-separated file, 20,041 rows × 11 columns, covering 413 pathogens
- Actual column names (verified by direct inspection): `ARO Accession`, `Name`, `Model ID`, `Model Type`, `Pathogen`, `NCBI Plasmid`, `NCBI WGS`, `NCBI Chromosome`, `NCBI Genomic Island`, `Criteria`, `ARO Categories`
- `NCBI Plasmid` is a **percentage (0–100 scale)** — the fraction of sequenced genomes where the ARG was found on a plasmid
- `Criteria` has only two values: `perfect` and `perfect_strict` — both are kept, no filtering on this column
- Filter applied: `NCBI Plasmid > 1` AND `Model Type == "protein homolog model"`
- Do NOT use `NCBI WGS` as the filter — it includes intrinsic chromosomal genes never transferred horizontally
- There is no `prevalence_<species>.tsv` per-pathogen file structure — all pathogens are in the single `card_prevalence.txt.gz` file

**Secondary (fallback and validation): Ellabaan 2021 Supplementary Data**

- Source: Nature Communications, DOI `10.1038/s41467-021-22757-1`
- Format: Excel supplementary tables
- Content: 152 pre-computed gene exchange networks with species pairs and ARG labels
- Usage: Provides explicit directionality data for edges where Jaccard gives only co-occurrence

**Tertiary (string matching): CARD Reference Sequences**

- URL: `https://card.mcmaster.ca/latest/data`
- Format: FASTA (nucleotide sequences of characterized ARGs)
- File: `nucleotide_fasta_protein_homolog_model.fasta`
- Usage: Provides pattern strings P for Boyer-Moore matching demonstration

### 9.2 Python preprocessing pipeline

**File:** `preprocessing/build_graph.py`

The pseudocode below reflects the correct implementation based on EDA findings. See `docs/dataset_reference.md` for the authoritative column reference.

```python
"""
TraceNet preprocessing pipeline.
Input:  data/card_r/card_prevalence.txt.gz  (single file, all pathogens)
Output: data/hgt_graph.txt
"""

import pandas as pd
import math

# ── Configuration (verified against actual CARD-R data) ───────────────────────

# 16 confirmed species — 4 original candidates dropped (0 plasmid ARGs each)
TARGET_SPECIES = [
    "Klebsiella pneumoniae", "Enterobacter cloacae", "Pseudomonas aeruginosa",
    "Enterococcus faecium", "Staphylococcus aureus", "Acinetobacter baumannii",
    "Escherichia coli", "Salmonella enterica", "Klebsiella oxytoca",
    "Citrobacter freundii", "Proteus mirabilis", "Serratia marcescens",
    "Acinetobacter pittii", "Pseudomonas putida",
    "Enterococcus faecalis", "Campylobacter jejuni"
]

JACCARD_THRESHOLD = 0.10   # minimum Jaccard before τ correction
MIN_WEIGHT        = 0.05   # minimum w = Jaccard × τ to create an edge
PLASMID_CUTOFF    = 1.0    # NCBI Plasmid column threshold (percentage, 0–100 scale)

# Gram-positive species — only these three have usable plasmid ARG data
GRAM_POSITIVE = {"Enterococcus faecium", "Staphylococcus aureus", "Enterococcus faecalis"}

def taxonomic_penalty(sp_a, sp_b):
    a_gp = sp_a in GRAM_POSITIVE
    b_gp = sp_b in GRAM_POSITIVE
    if a_gp != b_gp:
        return 0.5   # cross gram-stain barrier
    if sp_a.split()[0] == sp_b.split()[0]:
        return 1.0   # same genus
    return 0.75      # same gram class, different genus

# ── Step 1: Load single card_prevalence.txt.gz file ──────────────────────────

df = pd.read_csv("data/card_r/card_prevalence.txt.gz", sep="\t", compression="gzip")

# Correct filter: NCBI Plasmid > 1 (percentage) + protein homolog models only
# Do NOT use: df["Contig"], df["ARO_name"], df["Prevalence"] — those columns do not exist
species_args = {}
for sp in TARGET_SPECIES:
    sub = df[
        (df["Pathogen"] == sp) &
        (df["NCBI Plasmid"] > PLASMID_CUTOFF) &
        (df["Model Type"] == "protein homolog model")
    ]
    arg_set = set(sub["Name"].unique())
    if arg_set:
        species_args[sp] = arg_set
        print(f"[OK] {sp}: {len(arg_set)} plasmid ARGs")
    else:
        print(f"[WARN] {sp}: 0 plasmid ARGs — skipping")

# ── Step 2: Compute Jaccard similarity and build edges ────────────────────────

nodes = sorted(species_args.keys())
node_index = {sp: i for i, sp in enumerate(nodes)}
edges = []

for i, sp_a in enumerate(nodes):
    for j, sp_b in enumerate(nodes):
        if i == j:
            continue
        set_a, set_b = species_args[sp_a], species_args[sp_b]
        union = set_a | set_b
        if not union:
            continue
        jaccard = len(set_a & set_b) / len(union)
        if jaccard < JACCARD_THRESHOLD:
            continue
        tau = taxonomic_penalty(sp_a, sp_b)
        w = round(jaccard * tau, 4)
        if w < MIN_WEIGHT:
            continue
        shared = sorted(set_a & set_b)[:5]
        edges.append((i, j, w, shared))

# ── Step 3: Write data/hgt_graph.txt ─────────────────────────────────────────

with open("data/hgt_graph.txt", "w") as f:
    f.write(f"{len(nodes)}\n{len(edges)}\n")
    for sp in nodes:
        f.write(f"{sp}\n")
    for src, tgt, w, args in edges:
        f.write(f"{src} {tgt} {w} {','.join(args)}\n")

print(f"\nGraph: {len(nodes)} nodes, {len(edges)} edges → data/hgt_graph.txt")
# Expected output: 16 nodes, ~144 directed edges
```

### 9.3 ARG dependency DAG file format

**File:** `data/arg_dag.txt`

```
<n_args>
<arg_0_name>
<arg_1_name>
...
<src_idx> <tgt_idx>
<src_idx> <tgt_idx>
...
```

This is hand-authored, not generated by the pipeline.

### 9.4 FASTA reference file for Boyer-Moore

**File:** `data/arg_sequences.fasta`

Excerpt from CARD download, pre-filtered to 6 representative ARGs:
- NDM-1 (carbapenem resistance)
- CTX-M-15 (cephalosporin resistance)
- mcr-1 (colistin resistance)
- vanA (vancomycin resistance)
- tetM (tetracycline resistance)
- blaTEM-1 (ampicillin resistance)

Each sequence is 300–2000 bp — far smaller than a whole genome, making Boyer-Moore demonstration fast and practical.

---

## 10. Algorithm Design

This section specifies each algorithm with full precision: the question it answers, the input and output, the implementation approach, the time and space complexity, its role in the narrative, and its syllabus mapping.

---

### 10.1 Breadth-First Search — Reachability Analysis

**Syllabus unit:** Unit II — Decrease and Conquer (Application of BFS)

**Question answered:** If resistance genes enter a specific bacterial species, which other species can they eventually reach? How many HGT hops does it take?

**Input:** Graph G, source node s (e.g., *Bacillus subtilis*)
**Output:** For each reachable node v, the minimum number of edges (hops) from s to v. All unreachable nodes are marked ∞.

**Implementation:**

```cpp
// bfs_reachability.cpp
#include <queue>
#include <vector>
#include <climits>

std::vector<int> bfs(const std::vector<std::vector<int>>& adj, int source, int n) {
    std::vector<int> dist(n, INT_MAX);
    std::queue<int> q;
    dist[source] = 0;
    q.push(source);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == INT_MAX) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}
```

**Complexity:**
- Time: O(V + E) — each node is enqueued at most once; each edge is examined at most once.
- Space: O(V) for the distance array and queue.

**Biological interpretation of output:**
A species at hop distance 1 is a direct HGT recipient from the source. A species at hop distance 2 received resistance indirectly through one intermediary. Species at distance ∞ are isolated from the source's resistance pool.

**Demo output:** "If resistance enters *E. coli* (livestock), it can reach *K. pneumoniae* in 2 hops, passing through *E. coli* (wastewater). Seven of 22 species are reachable within 3 hops."

**Visualization:** BFS tree rooted at source node, with hop distances labeled on each node, rendered in Graphviz.

---

### 10.2 Depth-First Search + Strongly Connected Components

**Syllabus unit:** Unit II — Decrease and Conquer (Application of DFS)

**Question answered:** Which groups of bacterial species form closed resistance-sharing loops where every species can reach every other species?

**Input:** Graph G
**Output:** Partition of V into SCCs; each SCC labeled with member species

**Algorithm choice:** Kosaraju's two-pass DFS algorithm. Chosen over Tarjan's because it has a cleaner pedagogical structure (two separate DFS passes, each on G and G^T) and is easier to explain in a viva.

**Implementation:**

```cpp
// scc_kosaraju.cpp

void dfs1(int u, const AdjList& adj, std::vector<bool>& visited, std::stack<int>& finish) {
    visited[u] = true;
    for (int v : adj[u])
        if (!visited[v]) dfs1(v, adj, visited, finish);
    finish.push(u);
}

void dfs2(int u, const AdjList& radj, std::vector<bool>& visited, std::vector<int>& component, int id) {
    visited[u] = true;
    component[u] = id;
    for (int v : radj[u])
        if (!visited[v]) dfs2(v, radj, visited, component, id);
}

std::vector<int> kosarajuSCC(const AdjList& adj, const AdjList& radj, int n) {
    std::vector<bool> visited(n, false);
    std::stack<int> finish;
    // Pass 1: DFS on G, record finish order
    for (int i = 0; i < n; i++)
        if (!visited[i]) dfs1(i, adj, visited, finish);
    // Pass 2: DFS on G^T in reverse finish order
    std::fill(visited.begin(), visited.end(), false);
    std::vector<int> component(n, -1);
    int id = 0;
    while (!finish.empty()) {
        int u = finish.top(); finish.pop();
        if (!visited[u]) { dfs2(u, radj, visited, component, id++); }
    }
    return component;
}
```

**Complexity:**
- Time: O(V + E) — two DFS passes, each linear.
- Space: O(V + E) for the reverse adjacency list and the recursion stack.

**Biological interpretation:**
An SCC of size > 1 means a group of species that freely exchange ARGs bidirectionally — a resistance bubble. Species in the same SCC are effectively a single resistance reservoir from a containment perspective: blocking one edge does not isolate the SCC. Containment must target the edges connecting the SCC to other parts of the graph.

An SCC of size 1 (a single isolated node with no back-path) is a recipient species — it takes resistance in but does not send it back through the same channel.

**Demo output:** "SCC analysis identifies three resistance bubbles: {*K. pneumoniae*, *E. cloacae*, *E. coli*} share ARGs bidirectionally. *Bacillus subtilis* is an isolated source node."

**Visualization:** Condensed SCC graph rendered in Graphviz, with each SCC collapsed into a single meta-node colored by size.

---

### 10.3 Topological Sort — ARG Acquisition Ordering

**Syllabus unit:** Unit II — Decrease and Conquer (Topological Sorting)

**Question answered:** Given that some resistance genes depend on or co-occur with others, what is a valid sequential order in which a bacterium would realistically acquire a full resistance profile?

**Input:** ARG dependency DAG D = (A, R)
**Output:** A linear ordering of ARGs such that if (a → b) ∈ R, then a appears before b in the ordering.

**Algorithm:** Kahn's algorithm (BFS-based topological sort using in-degree). Chosen because its iterative nature makes cycle detection explicit: if the output ordering contains fewer nodes than |A|, a cycle exists in the input (which should not happen for a valid DAG).

```cpp
// topo_sort.cpp
#include <queue>
#include <vector>

std::vector<int> topologicalSort(const std::vector<std::vector<int>>& adj, int n) {
    std::vector<int> in_degree(n, 0);
    for (int u = 0; u < n; u++)
        for (int v : adj[u]) in_degree[v]++;

    std::queue<int> q;
    for (int i = 0; i < n; i++)
        if (in_degree[i] == 0) q.push(i);

    std::vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--in_degree[v] == 0) q.push(v);
    }
    if (order.size() != n) {
        // Cycle detected — DAG assumption violated
        return {};
    }
    return order;
}
```

**Complexity:**
- Time: O(V + E) — each node and edge processed exactly once.
- Space: O(V) for in-degree array and queue.

**Biological interpretation:**
The topological order gives a "resistance acquisition timeline" — the sequence in which a bacterium building toward full multi-drug resistance would encounter and incorporate different ARGs. Genes early in the order are ancestral and common; genes late in the order are advanced, dependent on earlier acquisitions, and associated with the most clinically dangerous phenotypes.

**Expected output (for the curated DAG):**
```
tetM → sul1 → blaTEM → blaSHV → aac(6')-Ib → blaCTX-M → blaOXA-48 → blaNDM-1 → mcr-1
```
(One valid topological order; others may exist.)

**Note on the two-graph structure:** The topological sort operates on the ARG dependency DAG D, not the species HGT graph G. This is important to state clearly in the presentation and report — TraceNet works with two complementary graphs, each answering a different type of question.

---

### 10.4 Boyer-Moore String Matching — ARG Sequence Search

**Syllabus unit:** Unit III — Space and Time Trade-offs (Input Enhancement: Boyer-Moore Algorithm)

**Question answered:** Given a known ARG DNA sequence (pattern P), can we efficiently locate it in a reference string drawn from CARD's sequence database?

**Input:** Pattern P (an ARG DNA sequence, 300–2000 bp); Text T (concatenated CARD reference sequences for a target species)
**Output:** All positions in T where P occurs exactly

**Why Boyer-Moore:** Horspool's algorithm (from the syllabus) is a simplified version of Boyer-Moore that uses only the bad-character rule. The full Boyer-Moore also uses the good-suffix rule, which makes it practically faster on biological sequences (which have a small alphabet: {A, T, C, G}). Implementing Boyer-Moore demonstrates mastery of the underlying concept while staying within the syllabus spirit.

```cpp
// boyer_moore.cpp
#include <string>
#include <vector>
#include <algorithm>
#include <unordered_map>

// Bad character table
std::unordered_map<char, int> buildBadChar(const std::string& P) {
    std::unordered_map<char, int> table;
    for (int i = 0; i < (int)P.size(); i++)
        table[P[i]] = i;
    return table;
}

std::vector<int> boyerMoore(const std::string& T, const std::string& P) {
    int n = T.size(), m = P.size();
    auto bc = buildBadChar(P);
    std::vector<int> matches;
    int s = 0;  // shift of pattern relative to text
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0 && P[j] == T[s + j]) j--;
        if (j < 0) {
            matches.push_back(s);
            s += (s + m < n) ? m - (bc.count(T[s + m]) ? bc[T[s + m]] : -1) : 1;
        } else {
            int bc_shift = j - (bc.count(T[s + j]) ? bc[T[s + j]] : -1);
            s += std::max(1, bc_shift);
        }
    }
    return matches;
}
```

**Complexity:**
- Preprocessing: O(m) for bad-character table construction.
- Search: O(nm) worst case; O(n/m) best case; sublinear average on natural language and DNA sequences.
- Space: O(|Σ|) = O(4) for DNA alphabet.

**Why sublinear average on DNA:** The bad-character heuristic allows the algorithm to skip large portions of the text when a mismatch occurs at a character not present in the pattern. With a 4-character alphabet, this happens frequently, making Boyer-Moore very efficient on genomic sequences.

**Demo scenario:**
Pattern P = NDM-1 gene sequence (first 200 bp from CARD FASTA).
Text T = concatenated reference sequences for *K. pneumoniae* from CARD.
Output: positions where NDM-1 sequence occurs, confirming presence in the reference set.

This demonstrates that the resistance gene in our graph model actually exists in the species' reference genome — grounding the graph edges in sequence-level evidence.

---

### 10.5 Dijkstra's Algorithm — Highest-Risk Spread Path

**Syllabus unit:** Unit IV — Greedy Technique (Dijkstra's Algorithm)

**Question answered:** What is the most probable (minimum-distance) route by which a specific ARG would travel from an environmental reservoir to a clinical target?

**Input:** Graph G with edge distances d(u,v) = −log(w(u,v)); source node s; target node t
**Output:** Minimum distance path from s to t and the sequence of species along that path

**Weight transformation rationale:**
Edge weights w ∈ (0,1] represent probabilities. To use Dijkstra (which minimizes path cost), we transform: d(u,v) = −log(w(u,v)).
- High probability (w = 0.9) → low distance (d = 0.105) → Dijkstra prefers this path
- Low probability (w = 0.05) → high distance (d = 2.996) → Dijkstra avoids this path

The minimum-distance path in the transformed graph corresponds to the maximum-probability path in the original graph. This is mathematically exact under the independence assumption (transfer probabilities are independent across edges).

```cpp
// dijkstra.cpp
#include <queue>
#include <vector>
#include <cmath>
#include <limits>

using Edge = std::pair<double, int>;  // (distance, node)

std::pair<std::vector<double>, std::vector<int>>
dijkstra(const std::vector<std::vector<std::pair<int,double>>>& adj, int src, int n) {
    std::vector<double> dist(n, std::numeric_limits<double>::infinity());
    std::vector<int> parent(n, -1);
    std::priority_queue<Edge, std::vector<Edge>, std::greater<Edge>> pq;
    dist[src] = 0.0;
    pq.push({0.0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;  // stale entry
        for (auto [v, w] : adj[u]) {
            double nd = dist[u] + (-std::log(w));
            if (nd < dist[v]) {
                dist[v] = nd;
                parent[v] = u;
                pq.push({nd, v});
            }
        }
    }
    return {dist, parent};
}

// Path reconstruction
std::vector<int> reconstructPath(const std::vector<int>& parent, int target) {
    std::vector<int> path;
    for (int v = target; v != -1; v = parent[v])
        path.push_back(v);
    std::reverse(path.begin(), path.end());
    return path;
}
```

**Complexity:**
- Time: O((V + E) log V) with a binary heap priority queue.
- Space: O(V) for distance and parent arrays; O(E) for the adjacency list.

**Correctness condition:** Dijkstra requires non-negative edge weights. Since w > 0 for all edges, −log(w) > 0 for all edges. This condition is satisfied.

**Demo output** (illustrative — exact path determined by `build_graph.py` output):
```
Most probable spread path for NDM-1:
Campylobacter_jejuni → Salmonella_enterica → Escherichia_coli
  → Klebsiella_pneumoniae

Path distance (log-probability): computed from -log(w) edge weights
```
Note: *Streptomyces coelicolor* and *Bacillus subtilis* are not in the graph (confirmed absent from CARD-R). Actual shortest path will be determined by the generated `hgt_graph.txt`.

**Visualization:** Highlighted Dijkstra path overlaid on the species graph in Graphviz, with edge weights labeled and the path highlighted in red.

---

### 10.6 Floyd-Warshall — All-Pairs Vulnerability Matrix

**Syllabus unit:** Unit IV — Dynamic Programming (Floyd's Algorithm)

**Question answered:** What is the spread distance between every pair of species in the graph — who is closest to whom, and which species are most globally connected to clinical targets?

**Input:** Graph G with distance matrix D[i][j] initialized from edge weights
**Output:** Matrix D where D[i][j] = minimum −log-probability path from species i to species j

**Implementation:**

```cpp
// floyd_warshall.cpp
#include <vector>
#include <cmath>
#include <limits>

const double INF = std::numeric_limits<double>::infinity();

void floydWarshall(std::vector<std::vector<double>>& dist, int n) {
    // Initialize diagonal
    for (int i = 0; i < n; i++) dist[i][i] = 0.0;
    // Three-loop DP
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            if (dist[i][k] == INF) continue;  // pruning: skip unreachable intermediate
            for (int j = 0; j < n; j++) {
                if (dist[k][j] == INF) continue;
                double via_k = dist[i][k] + dist[k][j];
                if (via_k < dist[i][j])
                    dist[i][j] = via_k;
            }
        }
    }
}
```

**Complexity:**
- Time: O(V³) — three nested loops over all nodes.
- Space: O(V²) for the distance matrix.

**With n = 16 nodes:** 16³ = 4,096 operations. This runs in microseconds. The O(V³) complexity is academically significant even though it is undetectable at this scale — it justifies why Floyd-Warshall is not used for large graphs (1000 nodes = 10^9 operations).

**Output format:** 22×22 matrix written as `vulnerability_matrix.csv`. Each cell [i][j] gives the minimum log-distance from species i to species j.

**Analysis:** Sort each column j by D[i][j] to find which species have the shortest paths to clinical target j. Species with many short paths to ESKAPE targets are "bridge nodes" — the most dangerous intermediaries.

**Key insight from the matrix:** The matrix enables ranking all species by their "vulnerability score" to each clinical target — a global picture that Dijkstra (single source) cannot provide.

---

### 10.7 Greedy Containment — Approximate Minimum Cut

**Syllabus unit:** Unit IV — Greedy Technique

**Question answered:** Which edges, if removed from the graph, would most efficiently sever the resistance spread pathway from environmental sources to clinical targets?

**Input:** Graph G; source set S (environmental reservoir nodes); target set T (ESKAPE pathogen nodes)
**Output:** Ranked list of edges to remove; disconnection achieved at minimum edge count

**Algorithm:**
This is a greedy approximation of the s-t minimum cut problem. The formal min-cut can be solved exactly via max-flow (Edmonds-Karp), but max-flow is not in the DAA syllabus. The greedy approach sorts edges by weight (highest probability first) and removes them greedily while checking connectivity.

```cpp
// greedy_containment.cpp
#include <algorithm>
#include <vector>

bool isReachable(const AdjList& adj, int src, int tgt, int n) {
    std::vector<bool> visited(n, false);
    std::queue<int> q;
    visited[src] = true;
    q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == tgt) return true;
        for (int v : adj[u])
            if (!visited[v]) { visited[v] = true; q.push(v); }
    }
    return false;
}

std::vector<Edge> greedyContainment(AdjList adj, const EdgeList& edges,
                                    int src, int tgt, int n) {
    // Sort edges by weight descending (remove highest-probability links first)
    EdgeList sorted = edges;
    std::sort(sorted.begin(), sorted.end(),
              [](const Edge& a, const Edge& b) { return a.weight > b.weight; });

    std::vector<Edge> removed;
    for (const Edge& e : sorted) {
        if (!isReachable(adj, src, tgt, n)) break;  // already disconnected
        adj.removeEdge(e.src, e.tgt);
        if (!isReachable(adj, src, tgt, n)) {
            removed.push_back(e);  // this edge was critical
        } else {
            adj.addEdge(e.src, e.tgt, e.weight);  // restore if not critical
        }
    }
    return removed;
}
```

**Complexity:**
- Sorting: O(E log E)
- Per edge: O(V + E) for BFS reachability check
- Total: O(E × (V + E)) in worst case; in practice terminates after removing k critical edges, where k is small (typically 2–5).

**Approximation ratio:** This greedy does not guarantee the optimal (minimum cardinality) cut. However, because it prioritizes edges by weight (transfer probability), it tends to identify the biologically most relevant edges to block — the highest-probability HGT pathways.

**Output:**
```
Greedy containment recommendation:
Remove 3 edges to sever all source → K. pneumoniae paths:
  1. E_coli_wastewater → K_pneumoniae  (w=0.441, shared ARGs: NDM-1, CTX-M)
  2. E_coli_livestock  → E_coli_wastewater  (w=0.312, shared ARGs: tetM, sul1, blaTEM)
  3. A_pittii          → K_pneumoniae  (w=0.187, shared ARGs: OXA-48)
```

---

### 10.8 Branch-and-Bound — Exact Optimal Containment

**Syllabus unit:** Unit V — Branch-and-Bound

**Question answered:** On a reduced subgraph of hospital pathogens only, what is the provably minimum set of edges that disconnects source from target?

**Why a reduced subgraph:** Branch-and-bound has exponential worst-case complexity. On the full 22-node graph, the state space is 2^|E| which can be enormous. On a hospital-pathogen-only subgraph of 8–10 nodes with ~20–40 edges, the search tree is tractable.

**Subgraph construction:** Extract from G all nodes in the ESKAPE set plus two environmental bridge nodes. The reduced graph G' has ~10 nodes and ~25–35 edges.

**Algorithm:**

```cpp
// branch_and_bound.cpp

struct State {
    EdgeSet removed;    // edges removed so far
    int cost;           // |removed|
};

int best_cost = INT_MAX;
EdgeSet best_solution;

void bnb(const AdjList& adj, EdgeList& candidates,
         EdgeSet& removed, int idx, int src, int tgt, int n) {
    // Pruning: if already disconnected, record if better
    if (!isReachable(adj, src, tgt, n)) {
        if ((int)removed.size() < best_cost) {
            best_cost = removed.size();
            best_solution = removed;
        }
        return;
    }
    // Pruning: if remaining candidates cannot improve best
    if ((int)removed.size() >= best_cost) return;
    // Pruning: if no more edges to consider
    if (idx >= (int)candidates.size()) return;

    // Branch 1: Remove this edge
    adj.removeEdge(candidates[idx]);
    removed.insert(candidates[idx]);
    bnb(adj, candidates, removed, idx + 1, src, tgt, n);
    adj.addEdge(candidates[idx]);
    removed.erase(candidates[idx]);

    // Branch 2: Keep this edge
    bnb(adj, candidates, removed, idx + 1, src, tgt, n);
}
```

**Bounding strategy:** The lower bound for any state is `|removed|`. If `|removed| >= best_cost`, prune — no better solution can be found by extending this branch. Additional bounding: if the number of remaining candidate edges plus current removed edges is less than the known minimum cut, prune.

**Expected behavior on the hospital subgraph:** With 10 nodes and 30 edges, the branch-and-bound tree is explored in milliseconds. The algorithm produces a certificate that its solution is optimal — something the greedy approach cannot claim.

**Demo comparison:**
```
Subgraph: 10 hospital pathogen nodes, 28 edges
Source: E_coli_wastewater | Target: K_pneumoniae

Greedy result:   Remove 3 edges [edges A, B, C] — cost: 3
B&B result:      Remove 2 edges [edges A, D]    — cost: 2  ← OPTIMAL

Greedy was suboptimal. B&B found a better solution by keeping edge C
and instead removing edge D, which it would have skipped (lower weight).
```

This comparison is the strongest analytical output in the project.

---

## 11. System Architecture

```
TraceNet System Architecture
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│                                                             │
│  CARD-R Prevalence TSVs  ←  card.mcmaster.ca/latest/variants│
│  Ellabaan 2021 Supp.     ←  Nature Comms DOI 10.1038/...   │
│  CARD FASTA Sequences    ←  card.mcmaster.ca/latest/data    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  PREPROCESSING LAYER (Python)               │
│                                                             │
│  build_graph.py                                             │
│    ├── parse_card_tsv()    — load per-species ARG sets      │
│    ├── compute_jaccard()   — pairwise ARG overlap           │
│    ├── apply_tax_penalty() — taxonomic distance correction  │
│    └── write_graph()       — emit hgt_graph.txt             │
│                                                             │
│  build_arg_dag.py          — emit arg_dag.txt (hand-curated)│
│  download_fasta.py         — fetch and trim ARG sequences   │
└───────────────────────┬─────────────────────────────────────┘
                        │
               hgt_graph.txt
               arg_dag.txt
               arg_sequences.fasta
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  ALGORITHM ENGINE (C++)                      │
│                                                             │
│  main.cpp                                                   │
│    ├── graph_io.cpp        — parse hgt_graph.txt            │
│    ├── bfs.cpp             — reachability from source       │
│    ├── scc_kosaraju.cpp    — strongly connected components  │
│    ├── topo_sort.cpp       — ARG dependency ordering        │
│    ├── boyer_moore.cpp     — ARG sequence search            │
│    ├── dijkstra.cpp        — highest-risk spread path       │
│    ├── floyd_warshall.cpp  — all-pairs vulnerability matrix │
│    ├── greedy_contain.cpp  — approximate min-cut            │
│    └── bnb_contain.cpp     — exact min-cut on subgraph      │
│                                                             │
│  Each module:                                               │
│    - reads from shared Graph struct                         │
│    - writes output to results/<algorithm>.txt               │
│    - writes Graphviz DOT to viz/<algorithm>.dot             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               VISUALIZATION LAYER                           │
│                                                             │
│  Graphviz (dot command-line tool)                           │
│    ├── viz/species_graph.dot   — full HGT graph             │
│    ├── viz/bfs_tree.dot        — BFS reachability tree      │
│    ├── viz/scc_condensed.dot   — SCC condensation           │
│    ├── viz/dijkstra_path.dot   — highlighted spread path    │
│    └── viz/containment.dot     — removed edges marked       │
│                                                             │
│  Python plotting (matplotlib/seaborn)                       │
│    └── vulnerability_matrix_heatmap.py                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Repository Structure

```
TraceNet/
│
├── README.md                          ← Project overview (already committed)
├── SPECIFICATION.md                   ← This document
│
├── preprocessing/                     ← Python data pipeline
│   ├── build_graph.py                 ← Main pipeline (CARD → hgt_graph.txt)
│   ├── build_arg_dag.py               ← ARG dependency DAG generator
│   ├── download_fasta.py              ← Fetch and filter CARD FASTA
│   ├── validate_graph.py              ← Sanity checks (connectivity, weight range)
│   └── requirements.txt              ← pandas, numpy, requests
│
├── data/                              ← Downloaded CARD data + generated graph files
│   ├── card_r/                        ← CARD-R archive contents (gitignored, ~309MB)
│   │   └── card_prevalence.txt.gz     ← Primary source: 20,041 rows × 11 cols
│   ├── card_fasta/                    ← CARD Reference FASTA archive (gitignored)
│   │   └── nucleotide_fasta_protein_homolog_model.fasta  ← 6,052 sequences
│   ├── hgt_graph.txt                  ← Generated: 16 nodes, 144 edges (committed)
│   ├── arg_dag.txt                    ← Hand-authored ARG dependency DAG (committed)
│   ├── arg_sequences.fasta            ← Filtered ARG sequences for Boyer-Moore (committed)
│   └── hospital_subgraph.txt          ← ~10-node subgraph for B&B (generated)
│
├── src/                               ← C++ algorithm implementations
│   ├── main.cpp                       ← Entry point, argument parsing, orchestration
│   ├── graph.h / graph.cpp            ← Graph struct, IO, adjacency list
│   ├── bfs.h / bfs.cpp
│   ├── scc_kosaraju.h / scc_kosaraju.cpp
│   ├── topo_sort.h / topo_sort.cpp
│   ├── boyer_moore.h / boyer_moore.cpp
│   ├── dijkstra.h / dijkstra.cpp
│   ├── floyd_warshall.h / floyd_warshall.cpp
│   ├── greedy_contain.h / greedy_contain.cpp
│   └── bnb_contain.h / bnb_contain.cpp
│
├── results/                           ← Algorithm outputs (generated, gitignored)
│   ├── bfs_reachability.txt
│   ├── scc_clusters.txt
│   ├── topo_order.txt
│   ├── boyer_moore_hits.txt
│   ├── dijkstra_path.txt
│   ├── vulnerability_matrix.csv
│   ├── greedy_containment.txt
│   └── bnb_containment.txt
│
├── viz/                               ← Graphviz DOT files and rendered images
│   ├── species_graph.dot
│   ├── bfs_tree.dot
│   ├── scc_condensed.dot
│   ├── dijkstra_path.dot
│   ├── containment.dot
│   └── render_all.sh                  ← Script: dot -Tpng *.dot
│
├── analysis/                          ← Python visualization scripts
│   ├── plot_vulnerability_matrix.py   ← Heatmap of Floyd-Warshall output
│   ├── plot_scc_sizes.py              ← Bar chart of SCC sizes
│   └── compare_containment.py         ← Greedy vs B&B comparison table
│
├── docs/                              ← Report and presentation material
│   ├── report/                        ← IEEE-format project report
│   │   ├── sections/
│   │   └── figures/
│   └── slides/                        ← Viva presentation slides
│
├── tests/                             ← Unit tests for algorithm correctness
│   ├── test_bfs.cpp                   ← BFS on known small graphs
│   ├── test_scc.cpp                   ← SCC on textbook examples
│   ├── test_dijkstra.cpp              ← Dijkstra with known-answer inputs
│   ├── test_floyd.cpp                 ← Floyd-Warshall on 4-node graph
│   └── test_boyer_moore.cpp           ← Pattern matching edge cases
│
├── Makefile                           ← Build system
└── .gitignore                         ← Excludes data/card_r/, results/, *.png
```

---

## 13. Implementation Plan

### 13.1 Week-by-week delivery schedule

**Week 1 — Data pipeline and graph construction**

Priority: This is the critical path. Everything else depends on `hgt_graph.txt` being correct.

Tasks:
1. Download CARD-R variant archive from `card.mcmaster.ca/latest/variants`.
2. Run `build_graph.py` and verify: 16 nodes parsed, ~144 edges generated.
3. Hand-author `arg_dag.txt` with 10 ARG nodes and 8 dependency edges.
4. Download and filter ARG FASTA from `card.mcmaster.ca/latest/data`.
5. Run `validate_graph.py` to check: no negative weights, no isolated nodes in ESKAPE set, at least one source-to-K.pneumoniae path.
6. If CARD-R TSV format differs from expectation: switch to Ellabaan 2021 supplementary data (already downloaded as backup).

Deliverable: `hgt_graph.txt` with correct structure, committed to repo.

**Week 2 — C++ graph I/O and BFS**

Tasks:
1. Implement `graph.h / graph.cpp` — adjacency list with node names, directed weighted edges.
2. Implement `main.cpp` — argument parsing, graph loading, algorithm dispatch.
3. Implement and test `bfs.cpp` — verify against hand-traced BFS on a 5-node toy graph.
4. Generate `viz/bfs_tree.dot` and render with Graphviz.
5. Write `test_bfs.cpp` and verify correctness.

Deliverable: Working BFS with visual output.

**Week 3 — SCC and Floyd-Warshall**

Tasks:
1. Implement `scc_kosaraju.cpp` — two-pass DFS with reverse graph.
2. Test on a 6-node graph with known SCCs (textbook example).
3. Implement `floyd_warshall.cpp` — three-loop DP with INF initialization.
4. Write `results/vulnerability_matrix.csv` and run `plot_vulnerability_matrix.py`.
5. Identify bridge nodes from matrix analysis.

Deliverable: SCC cluster output + vulnerability matrix heatmap.

**Week 4 — Dijkstra**

Tasks:
1. Implement `dijkstra.cpp` with −log(w) distance transformation.
2. Test on 4-node subgraph with manually computed distances.
3. Run Dijkstra from *Bacillus subtilis* to *K. pneumoniae* on full graph.
4. Generate highlighted DOT file for the spread path.
5. Implement path reconstruction and verify biological plausibility.

Deliverable: Highlighted Dijkstra path from environmental source to clinical target.

**Week 5 — Topological Sort and Boyer-Moore**

Tasks:
1. Implement `topo_sort.cpp` using Kahn's algorithm on `arg_dag.txt`.
2. Verify output is a valid topological order by checking all dependency edges.
3. Implement `boyer_moore.cpp` — bad-character table + search loop.
4. Test on toy examples with known match positions.
5. Run on NDM-1 pattern against *K. pneumoniae* CARD reference sequences.

Deliverable: Topological order of ARG acquisition + Boyer-Moore match demonstration.

**Week 6 — Greedy containment**

Tasks:
1. Extract hospital-pathogen subgraph (~10 nodes, ~30 edges).
2. Implement `greedy_contain.cpp` — edge sorting, iterative removal, BFS connectivity check.
3. Run from *E. coli* (wastewater) to *K. pneumoniae* on full graph.
4. Run from same source to same target on subgraph (for B&B comparison in Week 7).
5. Output ranked list of removed edges with biological labels.

Deliverable: Greedy containment recommendation with edge list.

**Week 7 — Branch-and-Bound**

Tasks:
1. Implement `bnb_contain.cpp` on hospital subgraph.
2. Verify correctness by comparing against exhaustive search on a 5-edge toy graph.
3. Run B&B on 10-node hospital subgraph.
4. Generate comparison table: greedy vs B&B — which edges, total cost, runtime.
5. Document the case where greedy is suboptimal (expected: occurs on at least one scenario).

Deliverable: Greedy vs B&B comparison table demonstrating the value of exact optimization.

**Week 8 — NP-hardness, polish, report**

Tasks:
1. Write NP-hardness section (reduction from minimum vertex cover — see Section 16).
2. Run all visualizations and verify quality.
3. Generate final `results/` outputs for all eight algorithms.
4. Write `docs/report/` — IEEE-format project report.
5. Build `docs/slides/` — 12-slide viva presentation.
6. Rehearse the 8-step demo narrative (Section 15).

Deliverable: Complete project, report, and slides.

---

## 14. Experiments and Evaluation

### 14.1 Experiment 1 — BFS hop distribution

**Metric:** For each ESKAPE target t, count the number of species reachable within k hops from each environmental source s, for k = 1, 2, 3, 4.

**Visualization:** Bar chart — x-axis: hop count, y-axis: number of species reachable, one series per source.

**Expected finding:** Most clinical targets are reachable from environmental sources within 3 hops, confirming the compactness of the resistance spread network.

### 14.2 Experiment 2 — SCC size distribution

**Metric:** Number of SCCs by size; identify which ESKAPE species co-occur in the same SCC.

**Visualization:** Bar chart of SCC sizes; condensed SCC graph in Graphviz.

**Expected finding:** One or two large SCCs (size 3–5) among frequently co-isolated species (*K. pneumoniae*, *E. coli*, *E. cloacae*). Most species are singleton SCCs (receive resistance, do not return it through the same channels).

### 14.3 Experiment 3 — Dijkstra path sensitivity to weight threshold

**Metric:** Run Dijkstra for three Jaccard thresholds (0.05, 0.10, 0.20) and compare resulting paths.

**Expected finding:** Higher threshold produces sparser graph with longer paths; at 0.20, some species become unreachable from all sources. Demonstrates sensitivity of the containment story to the graph construction parameter.

### 14.4 Experiment 4 — Floyd-Warshall vulnerability ranking

**Metric:** For each ESKAPE target, rank all species by D[i][target] and identify the top 5 "most connected" intermediaries.

**Visualization:** Heatmap of 22×22 vulnerability matrix. Species ordered by hierarchical clustering on row similarity.

**Expected finding:** *E. coli* (both livestock and wastewater variants) appear as the highest-vulnerability bridge nodes for multiple ESKAPE targets, consistent with its ecological ubiquity.

### 14.5 Experiment 5 — Greedy vs Branch-and-Bound comparison

**Metric:** On the 10-node hospital subgraph, run both algorithms from the same source to the same target. Record: (a) number of edges removed, (b) total weight of removed edges, (c) algorithm runtime, (d) whether solutions agree.

**Target outcome:** B&B finds a solution that is equal or superior to greedy, demonstrating the cost of approximation. Runtime difference should be measurable but both should be fast (<1 second) on the 10-node subgraph.

**Table format:**

| Algorithm | Edges removed | Total weight removed | Runtime | Optimal? |
|---|---|---|---|---|
| Greedy | 3 | 0.940 | 0.001s | Not guaranteed |
| Branch-and-Bound | 2 | 0.628 | 0.018s | Yes |

### 14.6 Experiment 6 — Boyer-Moore character comparison count

**Metric:** Compare the number of character comparisons made by naive string matching vs Boyer-Moore on the same (T, P) pair.

**Expected finding:** Boyer-Moore makes significantly fewer comparisons on DNA sequences, demonstrating the practical benefit of the bad-character heuristic.

---

## 15. Demo and Presentation Narrative

The demo must tell one coherent story. Every algorithm must be explained as an answer to a question, not just a demonstration of code running.

### The story

> "Antibiotic resistance genes spread through bacteria like information flows through a network. TraceNet models this as a graph and applies classical algorithms to answer: where does resistance start, how does it spread, who is most at risk, and what can be done to stop it?"

### The 8-step sequence

**Step 1 — Show the graph**
"Here is our graph: 22 bacterial species as nodes, 147 directed edges as HGT pathways. Edge thickness represents transfer probability. Blue nodes are environmental reservoirs. Red nodes are ESKAPE hospital pathogens."

**Step 2 — BFS demonstration**
"We ask: if resistance genes enter *E. coli* from livestock, where can they spread? BFS answers this in O(V+E). Within 2 hops, resistance reaches 9 of 22 species. Within 3 hops, 16 species. The hospital pathogens *K. pneumoniae* and *A. baumannii* are both reachable in under 3 hops."

**Step 3 — SCC analysis**
"Which bacteria share resistance genes bidirectionally? Kosaraju's SCC algorithm reveals three resistance bubbles. This group — *K. pneumoniae*, *E. cloacae*, and *E. coli* — forms a closed resistance-sharing loop. Any resistance gene entering one of these species circulates through all three."

**Step 4 — ARG acquisition order**
"Separately, we model resistance gene dependencies. Some genes co-occur or enable others. Topological sort on our ARG DAG gives the valid acquisition sequence — from ancestral genes like tetM through to last-resort resistance mechanisms like NDM-1 and mcr-1. This maps exactly to how resistance evolves clinically."

**Step 5 — Boyer-Moore confirmation**
"We verify that NDM-1 — the gene responsible for carbapenem resistance — actually exists in *K. pneumoniae*'s reference genome. Boyer-Moore locates the exact sequence in 12ms, finding 3 occurrences. This grounds our graph model in sequence-level evidence."

**Step 6 — Dijkstra path**
"The critical question: what is the most probable route by which resistance would travel from an environmental source to a hospital pathogen? Dijkstra finds the minimum-distance path through the graph. The actual path is determined by the generated edge weights — for example, via *Campylobacter jejuni* → *Salmonella enterica* → *Escherichia coli* → *Klebsiella pneumoniae*, tracing the resistance through enteric bacteria to the primary clinical target."

**Step 7 — Floyd-Warshall matrix**
"Floyd-Warshall computes distances between every pair simultaneously. Here is the vulnerability matrix. The darkest cells — shortest distances — show which species are most tightly connected to *K. pneumoniae*. These are the species where AMR surveillance should be concentrated."

**Step 8 — Containment comparison**
"Finally, which pathways should be targeted to contain spread? Our greedy algorithm recommends removing 3 edges. But branch-and-bound, running on the hospital subgraph, finds an optimal solution using only 2 edges — fewer, but more strategically chosen. This demonstrates why exact methods matter when the cost of intervention is high."

**Closing**
"The general optimal containment problem is NP-hard — we prove this by reduction from minimum vertex cover. This is why the greedy approximation exists: for large graphs, B&B is infeasible. TraceNet demonstrates both the approximation and the exact solver, and measures the gap between them."

---

## 16. NP-Hardness Analysis

### 16.1 Problem formulation

**Optimal ARG Containment Problem (OACP):**
Given graph G = (V, E, w), source s, target t, and integer k, does there exist a set F ⊆ E with |F| ≤ k such that removing F disconnects all paths from s to t?

### 16.2 The case when this is easy

The s-t minimum cut problem (finding the minimum-weight set of edges whose removal disconnects s from t) is solvable in polynomial time using max-flow algorithms (Edmonds-Karp in O(VE²), Dinic's in O(V²E)).

However, OACP with additional constraints becomes NP-hard. The biologically motivated constraint is: **the removed edges must form a set that also disconnects a second source s' from the same target t** (representing the requirement that containment must work against multiple resistance origins simultaneously).

### 16.3 Reduction from Minimum Vertex Cover

**Minimum Vertex Cover (MVC):** Given graph H = (U, F), does there exist a subset C ⊆ U with |C| ≤ k such that every edge in F has at least one endpoint in C?

MVC is NP-complete (it is a canonical NP-complete problem in Karp's 21).

**Reduction:** Transform any MVC instance (H, k) to a Multi-Source OACP instance as follows:

1. For each edge (u, v) ∈ F, create a node e_{uv} in the OACP graph.
2. Create a source node s and a target node t.
3. For each original node u ∈ U: add edges (s, u) and (s', u) with weight 1.
4. For each edge e_{uv}: add edges (u, e_{uv}) and (v, e_{uv}) and (e_{uv}, t) with weight 1.
5. Ask: does there exist a set of ≤ k nodes (from the u-nodes) whose removal from the graph disconnects all s-to-t paths?

This reduction is polynomial. A valid vertex cover in H corresponds exactly to a valid multi-source containment set in the OACP instance. Therefore, Multi-Source OACP is NP-hard.

### 16.4 Implications for TraceNet

This NP-hardness result justifies two design decisions:

1. **Why greedy:** For the full 22-node graph with multiple environmental sources, exact containment is NP-hard. The greedy algorithm provides a practical approximation.

2. **Why B&B on a subgraph only:** By restricting to the hospital-pathogen subgraph (single source, single target), the problem becomes a standard s-t min-cut solvable exactly. B&B finds this exact solution on the small subgraph.

The theoretical result is stated clearly in the report: the full multi-source version is NP-hard; the single-source version is polynomial; TraceNet implements the polynomial exact solver (B&B as a pedagogical substitute for max-flow, since B&B is in the syllabus) on the single-source version.

---

## 17. Complexity Summary Table

| Algorithm | Problem | Time complexity | Space complexity | Syllabus unit |
|---|---|---|---|---|
| BFS | Reachability from source | O(V + E) | O(V) | Unit II |
| DFS + Kosaraju SCC | Strongly connected components | O(V + E) | O(V + E) | Unit II |
| Kahn's Topological Sort | ARG acquisition ordering (DAG) | O(V + E) | O(V) | Unit II |
| Boyer-Moore | ARG sequence search | O(nm) worst / O(n/m) avg | O(\|Σ\|) = O(4) | Unit III |
| Dijkstra | Single-source shortest path | O((V + E) log V) | O(V) | Unit IV |
| Floyd-Warshall | All-pairs shortest path | O(V³) | O(V²) | Unit IV |
| Greedy Min-Cut | Approximate containment | O(E log E + k(V+E)) | O(V + E) | Unit IV |
| Branch-and-Bound | Exact containment (subgraph) | O(2^E) worst / practical: fast | O(E) | Unit V |

**Key number:** With n = 16 nodes and e = 144 edges:
- BFS: ~160 ops
- Floyd-Warshall: 16³ = 4,096 ops
- B&B on 10-node hospital subgraph: explored tree has << 10^6 nodes in practice

All algorithms complete in under 1 second on any modern machine.

---

## 18. Limitations and Honest Caveats

Every project has limitations. Acknowledging them explicitly is a strength, not a weakness. Evaluators who ask about limitations are testing intellectual honesty.

### 18.1 The Jaccard proxy is an approximation

Jaccard similarity measures ARG co-occurrence, not HGT probability. Two species sharing many ARGs may have received them independently from a common ancestor rather than through direct transfer. Real HGT probability depends on physical co-location, plasmid compatibility groups, restriction-modification defense systems, and selective pressure — none of which Jaccard captures.

**Defense:** This is acknowledged explicitly. The Jaccard weight is a structured, literature-grounded proxy that enables graph construction without wet lab data. The taxonomic correction factor partially accounts for phylogenetic distance. Sensitivity analysis (Experiment 3) quantifies how results change with different thresholds.

### 18.2 The graph is static

The HGT graph represents a snapshot of known ARG distributions. In reality, resistance evolves continuously — new ARGs emerge, new transfer events occur, species acquire new plasmids. A static graph cannot capture this dynamism.

**Defense:** Static graph analysis is standard in computational biology for course-scale projects. The algorithms are designed for fixed inputs. Dynamic graph analysis would require temporal genomic surveillance data at a scale far beyond the scope of a DAA project.

### 18.3 The ARG dependency DAG is hand-curated

The 10-node dependency graph with 8 edges is curated from literature patterns of ARG co-occurrence, not from a systematic computational analysis. Different curators might produce different DAGs.

**Defense:** The DAG is used solely for topological sort demonstration, not for biological inference. Any valid DAG produces a valid topological order. The biological motivations for each edge are cited from co-occurrence literature, making the choices defensible.

### 18.4 The greedy containment is not optimal in general

The greedy min-cut approximation does not guarantee the minimum-cardinality edge removal set. In the demo comparison (Experiment 5), it may miss the optimal solution that B&B finds.

**Defense:** This is the point of the comparison. The suboptimality of greedy is a feature of the experiment, not a bug. It motivates the NP-hardness discussion and the branch-and-bound implementation.

### 18.5 This is not a clinical tool

The outputs — containment recommendations, vulnerability rankings, spread paths — are analytical artifacts from a graph model, not clinical recommendations. No public health decision should be made based on this project's output.

**Defense:** This is stated explicitly and prominently. TraceNet is a graph analysis engine for educational purposes, applied to a biologically meaningful domain.

---

## 19. Viva Defense Strategy

### 19.1 Questions you will definitely be asked and how to answer them

**"Is this project novel?"**
At the research level, the biological domain is well-studied. At the DAA course level, this framing of AMR spread as a DAA graph optimization problem — with explicit algorithm selection, complexity analysis, and containment comparison — has not been done before as a course project. The novelty is in the framing, the implementation, and the coherent analytical narrative, not in original biology.

**"Why did you choose Jaccard similarity as your edge weight?"**
Jaccard similarity of ARG sets is a standard, reproducible measure of plasmid-borne gene co-occurrence between species. It is used in peer-reviewed research on plasmid population structure. It is simple to compute from CARD data, biologically defensible, and bounded in [0,1], making it directly usable as a probability proxy. We acknowledge its limitations and apply a taxonomic correction factor.

**"Why not use max-flow for the min-cut instead of greedy and B&B?"**
Max-flow (Edmonds-Karp, Dinic's) is the polynomial-time exact algorithm for s-t min-cut. It is not in the DAA syllabus. We chose greedy (Unit IV) and branch-and-bound (Unit V) because they are directly mapped to syllabus requirements and allow a pedagogically valuable comparison between approximate and exact methods. The comparison demonstrates the approximation gap — something max-flow alone would not.

**"Why is your graph only 16 nodes? Real resistance networks have thousands of species."**
With n = 16 nodes, all O(V³) algorithms run in microseconds. The focus of a DAA project is the correctness of the algorithm and the clarity of the analysis, not scale. A 1000-node graph would not change any algorithm's implementation; it would only make visualization and manual validation harder. The 16 species were chosen because they are the complete set of ESKAPE pathogens and clinically significant bridge species that have confirmed plasmid-borne ARG data in CARD — making 16 nodes a data-driven, not arbitrary, choice.

**"Can you trace through Kosaraju's algorithm on your graph?"**
Yes. [Walk through: First DFS pass on G to compute finish order. Reverse the graph to G^T. Second DFS pass in reverse finish order, each new component is a new SCC.] For a specific 4-node subgraph, demonstrate both passes manually.

**"What happens if the Jaccard threshold is set to 0?"**
Every pair of species that shares at least one ARG gets an edge. The graph becomes very dense, Floyd-Warshall distances all shrink to near-zero, and the vulnerability matrix loses discriminating power. Containment becomes meaningless because every species is directly connected to every clinical target. This motivates the threshold — it filters out weak, low-evidence connections.

**"Is the B&B guaranteed to find the optimal solution?"**
Yes, because the bounding function is exact (we track the true number of removed edges) and the algorithm exhaustively explores all branches that could improve on the current best. The pruning only eliminates branches that are provably incapable of improving the best-known solution. This is a guarantee, not a heuristic.

**"Why does the topological sort use a separate DAG instead of the species graph?"**
Two different questions, two different graph models. The species HGT graph answers: which bacteria exchange resistance with which. The ARG dependency DAG answers: in what order do resistance genes logically build on each other. A bacterium acquiring resistance does not traverse the species graph — it acquires genes in a sequence modeled by the DAG. Using one graph for both questions would conflate species-level spread dynamics with gene-level dependencies.

### 19.2 Things NOT to say

- Do not claim this is novel research. Claim it is a novel algorithmic application and framing.
- Do not claim Jaccard similarity is a perfect HGT proxy. Acknowledge its limitations immediately.
- Do not claim the B&B scales to large graphs. It does not — that is why the greedy exists.
- Do not claim the project would be used in a hospital setting. It is a graph analysis engine.

---

## 20. Glossary

| Term | Definition in TraceNet context |
|---|---|
| **ARG** | Antibiotic Resistance Gene — a gene that, when expressed, confers resistance to one or more antibiotics |
| **HGT** | Horizontal Gene Transfer — direct transfer of genetic material between bacteria, not via parent-to-offspring inheritance |
| **Plasmid** | Small circular DNA molecule that replicates independently and is the primary vehicle for ARG transfer during conjugation |
| **ESKAPE** | The six bacterial species most associated with hospital-acquired infections: *E. faecium, S. aureus, K. pneumoniae, A. baumannii, P. aeruginosa, E. cloacae* |
| **CARD** | Comprehensive Antibiotic Resistance Database — curated database of ARG sequences, detection models, and prevalence statistics |
| **CARD-R** | CARD Resistomes and Variants — the module of CARD containing in-silico predicted ARG prevalence for 414 pathogens |
| **Jaccard similarity** | Intersection over union of two sets; used here for ARG set overlap between species |
| **SCC** | Strongly Connected Component — maximal set of nodes where every node can reach every other node |
| **Min-cut** | Minimum set of edges whose removal disconnects a source from a target |
| **NP-hard** | A problem that is at least as hard as the hardest problems in NP; no polynomial-time algorithm is known |
| **Topological order** | Linear ordering of DAG nodes such that every directed edge goes from an earlier to a later node |
| **Resistance bubble** | Informal term for an SCC in the HGT graph — a cluster of species that exchange ARGs bidirectionally |
| **Bridge node** | A species that lies on many shortest paths between environmental sources and clinical targets; its removal would significantly increase spread difficulty |
| **Vulnerability matrix** | The all-pairs distance matrix produced by Floyd-Warshall; cell [i][j] gives the minimum log-probability distance from species i to species j |
| **Containment edge** | An HGT pathway that, if disrupted (e.g., by targeted antibiotic stewardship or plasmid-curing interventions), would prevent resistance from reaching clinical targets |
| **Bad character table** | Preprocessing structure in Boyer-Moore that records the last occurrence of each character in the pattern, enabling large skips during mismatch |

---

*End of TraceNet Project Specification Document*
*Version 1.0 · June 2026 · Varun Aditya · Tanisha R. · RVCE*
