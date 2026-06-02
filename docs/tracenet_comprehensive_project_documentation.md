# TraceNet: Comprehensive End-to-End Project Documentation

## Project Identity

**Project Name:** TraceNet  
**Full Title:** Graph-Theoretic Analysis of Antibiotic Resistance Spread  
**Project Domain:** Design and Analysis of Algorithms (DAA), Graph Algorithms, Bioinformatics-Inspired Systems Modeling  
**Primary Implementation Stack:** Python for preprocessing, C++ for core algorithm implementation, optional Graphviz/Python for visualization  
**Academic Context:** Undergraduate DAA course project  

---

## Overview

TraceNet is a graph-based algorithmic project that models the spread of antibiotic resistance across bacterial species and analyzes that spread using classical Design and Analysis of Algorithms concepts. The project treats bacterial species or strains as nodes in a graph and possible resistance-transfer relationships as weighted directed edges. On top of this graph, it applies a coordinated set of algorithms from the DAA syllabus to answer practical questions about reachability, shortest transmission paths, resistance-sharing communities, dependency ordering, approximate containment, and exact containment on smaller subgraphs.

At its core, TraceNet is not a medical product, not a hospital surveillance tool, and not a full bioinformatics pipeline. It is an **algorithm-first academic system** that uses a biologically meaningful and socially relevant problem to demonstrate how classical algorithms can be integrated into a coherent analytical framework.

The project is intentionally designed to satisfy several academic goals simultaneously:

- It aligns strongly with graph-oriented guidance commonly given in DAA lab/project components.
- It covers multiple units of the syllabus in one unified system rather than through isolated toy implementations.
- It is realistic enough to appear meaningful and technically mature.
- It remains scoped enough to be implementable by undergraduate students in a limited academic timeline.
- It allows rich visualization and performance comparison, which makes it highly suitable for presentation and evaluation.

---

## Problem Statement

Antibiotic resistance is one of the most serious long-term global public health threats. Resistance genes can move across bacterial populations through horizontal gene transfer, often via plasmids and other mobile genetic elements. Because these transfers form relationships between organisms, they can be modeled as a network. Once framed as a network, many classical algorithmic questions naturally arise:

- Which organisms can be reached from a known resistant source?
- Which groups of species exchange resistance in tightly coupled cycles?
- What is the most likely or least-cost path through which a resistance gene may reach a dangerous clinical pathogen?
- What is the spread distance between any two species in the network?
- If interventions are limited, which transfer relationships should be blocked first?
- How do approximate containment strategies compare against exact optimization on smaller instances?

TraceNet addresses these questions through graph modeling and algorithmic analysis. It converts a biologically inspired transmission scenario into a rigorously defined computational problem that can be explored using traversal, shortest path, dynamic programming, greedy strategy, branch-and-bound, and string matching.

---

## Reason for Choosing This Project

The project was chosen because it sits at an unusually strong intersection of **social relevance**, **technical depth**, **visual clarity**, and **syllabus fit**.

### 1. It solves a meaningful real-world problem

Many DAA projects use transportation networks, social graphs, or cable design because those are standard examples. TraceNet uses the same algorithmic foundations but applies them to antibiotic resistance spread, which immediately makes the project feel more original and more impactful.

### 2. It naturally fits graph algorithms

The project is not forcing a graph where no graph exists. The underlying domain is genuinely network-like:

- bacterial entities can be represented as nodes,
- transfer opportunities can be represented as edges,
- transfer strength can be represented as weights,
- clusters and pathways have natural biological meaning.

This makes the project more defensible than a superficial rebranding of a generic graph problem.

### 3. It supports multiple units of the DAA syllabus in one story

Instead of building separate programs for BFS, Dijkstra, Floyd-Warshall, Topological Sort, Greedy methods, and Branch-and-Bound, TraceNet uses all of them within a single application scenario. This makes the project look integrated and intellectually deliberate.

### 4. It is visually demonstrable

A key advantage of TraceNet is that the algorithms produce outputs that are easy to visualize and explain:

- spread graphs,
- highlighted shortest paths,
- SCC clusters,
- distance matrices,
- ranked containment edges,
- dependency DAGs.

This is ideal for demonstrations, lab evaluations, viva voce, and presentations.

### 5. It is ambitious but still feasible

The project looks more advanced than standard student graph projects, but the computational scale remains manageable if the graph is kept modest in size. This balance is crucial: it impresses without becoming impossible.

---

## Motivation

The motivation behind TraceNet can be understood at three levels.

### Academic motivation

The project aims to demonstrate complete command over multiple DAA topics through one unified implementation. It shows not just that individual algorithms can be coded, but that they can be selected appropriately based on the structure of the problem.

### Technical motivation

Most student projects apply one algorithm to one dataset and stop there. TraceNet instead constructs an entire mini-framework:

- data preprocessing,
- graph construction,
- multiple algorithm modules,
- comparison of outputs,
- visual explanation,
- discussion of complexity and trade-offs.

This makes the project feel closer to a small analytical system than to a single coding assignment.

### Problem-domain motivation

Antibiotic resistance spread is a high-stakes phenomenon with natural network structure. Using this domain gives the project seriousness and relevance while still keeping the actual implementation algorithmic rather than clinical.

---

## Background Concepts

Before implementation, the project depends on understanding several domain and algorithm concepts.

### Antibiotic resistance

Antibiotic resistance occurs when bacteria evolve or acquire the ability to survive drugs that would normally kill them. This can make infections harder to treat and can significantly increase clinical risk.

### ARGs: Antibiotic Resistance Genes

Resistance is often enabled by specific genes, such as genes that degrade antibiotics, pump drugs out of the cell, or modify cellular targets so the drug no longer works effectively.

In TraceNet, these genes are treated as labels and attributes associated with bacterial species and transfer relationships.

### Horizontal gene transfer (HGT)

Bacteria can acquire genes not just through vertical inheritance from parent to offspring but also through horizontal transfer from other bacteria. This frequently happens through plasmids, integrons, and transposons.

For TraceNet, HGT is the domain-inspired basis for creating graph edges.

### Plasmids

Plasmids are small DNA molecules that exist separately from the bacterial chromosome and can carry resistance genes. Because plasmids can move between bacteria, they play a major role in the spread of antibiotic resistance.

### Graph abstraction

The main abstraction used in TraceNet is:

- **Node:** bacterial species or strain
- **Directed edge:** possible or inferred transfer relationship
- **Weight:** transfer risk, cost, similarity, or inverse difficulty
- **Label:** shared ARG family or gene group

This abstraction is not claiming exact biological truth. It is a computational model designed to support algorithmic analysis.

---

## Project Vision

The long-term vision of TraceNet is to act as a compact educational framework that demonstrates how graph algorithms can be applied to model, trace, and reason about the spread of resistance in microbial ecosystems.

Within the course context, the project vision is more specific:

- build a graph-based analytical system,
- support multiple DAA algorithms in one architecture,
- generate interpretable outputs,
- compare exact and approximate solutions,
- present the results in a clean and compelling way.

---

## Objectives

### Primary objective

To design and implement a graph-based analytical framework that models antibiotic resistance spread and solves key spread and containment questions using algorithms from the DAA syllabus.

### Secondary objectives

- To preprocess biological or semi-curated data into a graph representation suitable for algorithmic analysis.
- To implement graph traversal and connectivity algorithms for reachability and community analysis.
- To implement shortest path and all-pairs path algorithms for transmission analysis.
- To model simplified gene dependencies using a DAG and topological sorting.
- To incorporate pattern matching for resistance gene sequence lookup using Boyer-Moore or Horspool.
- To compare a greedy containment strategy against an exact branch-and-bound method on reduced graphs.
- To provide visualization and result interpretation suitable for academic demonstration.
- To analyze time and space complexity for each algorithm and justify why it is appropriate.

---

## Goals

The practical project goals are as follows:

1. Produce a working graph from a manageable, curated dataset.
2. Implement all selected algorithms correctly and modularly.
3. Demonstrate how each algorithm answers a distinct project question.
4. Ensure the graph size remains small enough for easy testing and presentation.
5. Produce outputs that are understandable without deep biological knowledge.
6. Avoid overclaiming scientific novelty while maintaining strong technical value.
7. Create a project that is viva-ready, demonstrable, and academically defensible.

---

## Scope

### Included in scope

- Modeling a bacterial resistance transfer network as a weighted directed graph
- Building graph input from curated or preprocessed data
- Implementing the selected DAA algorithms
- Comparing algorithm outputs and performance
- Visualizing graph structure and selected outputs
- Providing theoretical discussion of complexity and tractability

### Excluded from scope

- Clinical diagnosis
- Real-time hospital deployment
- Full-scale genome analysis pipelines
- Sequence alignment on whole genomes
- Machine learning prediction of unknown HGT events
- Claiming biological ground truth for all inferred edges

This distinction is essential. The project is an **algorithmic decision-support and analysis model**, not a biomedical prediction engine.

---

## Users and Stakeholders

Even though this is a course project, it helps to identify who the effective stakeholders are.

### Primary stakeholders

- Course professor
- Lab instructors
- Project team members
- Evaluators during project review or viva

### Secondary conceptual users

If extended in the future, such a framework could conceptually be useful to:

- bioinformatics students,
- systems biology researchers,
- hospital infection-control analysts,
- public health data modelers.

For the present project, however, the main audience is academic.

---

## End-to-End System View

TraceNet can be viewed as a pipeline with five major stages.

### Stage 1: Data acquisition

A curated or semi-curated source is selected. Options include prevalence tables, resistance gene occurrence summaries, or supplementary matrices from prior studies.

### Stage 2: Data preprocessing

The raw tables are transformed into a graph-friendly form. Species are selected, ARGs are filtered, similarity scores are computed, and the final adjacency structure is exported.

### Stage 3: Graph construction

The preprocessed data is written to a graph file such as `hgt_graph.txt`. This becomes the main input to the C++ engine.

### Stage 4: Algorithmic analysis

Each algorithm module consumes the graph and answers a specific class of question:

- traversal,
- clustering,
- shortest paths,
- all-pairs distances,
- dependency ordering,
- pattern search,
- containment.

### Stage 5: Interpretation and visualization

The outputs are rendered into human-readable tables, paths, clusters, and graphs for explanation and presentation.

---

## Methodology

The project methodology should be executed in a disciplined sequence.

### Phase 1: Problem formalization

Before coding, define exactly what the project means by:

- node,
- edge,
- edge direction,
- edge weight,
- source,
- target,
- containment.

Without this formalization, the algorithms may be implemented correctly but answer the wrong conceptual questions.

### Phase 2: Dataset selection

Choose a data route that is feasible and low-risk. The best practical option is a curated prevalence dataset or a precomputed supplementary matrix. Avoid raw-genome reconstruction unless a much larger time budget exists.

### Phase 3: Preprocessing design

Write Python code to:

- parse the source data,
- identify selected species,
- build species-to-ARG sets,
- compute shared ARG overlaps,
- derive edge weights,
- export the graph.

### Phase 4: Core C++ graph engine

Implement modular C++ classes or functions for:

- graph reading,
- adjacency list construction,
- adjacency matrix construction if needed,
- algorithm modules.

### Phase 5: Output and validation

Each algorithm should be tested independently and then integrated into a menu-driven or scenario-driven execution flow.

### Phase 6: Visualization and reporting

Generate supporting artifacts such as:

- Graphviz graphs,
- CSV distance matrices,
- highlighted shortest paths,
- SCC group summaries,
- containment ranking tables.

---

## Architecture

The architecture of TraceNet is best understood as a layered system.

### Layer 1: Data layer

This layer holds:

- curated prevalence data,
- ARG lists,
- optional supplementary matrices,
- optional FASTA reference files for string matching.

### Layer 2: Preprocessing layer

Implemented in Python, this layer:

- loads raw data,
- filters species and ARGs,
- computes weights,
- constructs edges,
- emits a compact graph file.

### Layer 3: Graph representation layer

Implemented in C++, this layer loads the processed graph into memory. It may use:

- adjacency lists for traversal and Dijkstra,
- adjacency matrices for Floyd-Warshall,
- reverse graph storage for Kosaraju,
- specialized storage for labels and weights.

### Layer 4: Algorithm layer

This layer contains the implementations of all chosen DAA algorithms.

### Layer 5: Reporting and visualization layer

This layer converts raw algorithm outputs into readable forms suitable for interpretation, screenshots, figures, and project presentation.

---

## Repository Structure

```text
TraceNet/
├── data/                    # Downloaded CARD data + generated graph files
│   ├── card_r/              # CARD-R Prevalence archive contents (gitignored)
│   ├── card_fasta/          # CARD Reference FASTA archive contents (gitignored)
│   ├── hgt_graph.txt        # Generated 16-node HGT graph
│   ├── arg_dag.txt          # Hand-authored ARG dependency DAG
│   ├── arg_sequences.fasta  # Filtered ARG sequences for Boyer-Moore
│   └── hospital_subgraph.txt# Reduced subgraph for branch-and-bound
├── preprocessing/           # Python pipeline scripts
├── src/                     # C++ source files (one .h/.cpp per algorithm)
├── results/                 # Algorithm output files (gitignored)
├── viz/                     # Graphviz DOT files and render_all.sh
├── analysis/                # Python heatmap and comparison scripts
├── tests/                   # C++ unit tests per algorithm
├── experiments/             # Experiment harnesses
├── docs/                    # dataset_reference.md, project specification
└── README.md
```

---

## Data Modeling Details

### Node set

The node set is **16 confirmed species**, determined by EDA on the CARD-R Prevalence dataset. This is the complete set of species from the original plan that have a non-empty plasmid-borne ARG set in CARD. See `docs/dataset_reference.md` for the full species table with ARG counts.

Four species from the original plan were dropped after EDA confirmed they have no usable data:
- *Streptomyces coelicolor* — not present in CARD-R at all
- *Bacillus subtilis* — 0 ARGs with `NCBI Plasmid > 1`
- *Streptococcus pneumoniae* — 0 ARGs with `NCBI Plasmid > 1`
- *Clostridioides difficile* — 0 ARGs with `NCBI Plasmid > 1`

### ARG filtering strategy

Filter is applied to `data/card_r/card_prevalence.txt.gz` using these exact criteria:

```python
(df["NCBI Plasmid"] > 1) & (df["Model Type"] == "protein homolog model")
```

`NCBI Plasmid` is a percentage column (0–100 scale) representing the fraction of sequenced genomes of that species where the ARG was found on a plasmid. A threshold of `> 1` captures genuinely mobile, conjugation-transferable ARGs.

**Do not use `NCBI WGS`** as the filter — it includes intrinsic chromosomal genes (efflux regulators, outer membrane proteins) that are present in nearly every genome but are never horizontally transferred. This was confirmed by EDA: the top-ranked ARGs under a `NCBI WGS >= 5` filter for *K. pneumoniae* are `rsmA`, `CRP`, `H-NS`, `ArnT` — housekeeping genes, not resistance-transfer genes.

### Weight computation strategy

A practical weight definition is based on Jaccard similarity:

\[
J(A,B)=\frac{|A \cap B|}{|A \cup B|}
\]

Then convert similarity to path cost using:

\[
cost(A,B) = -\log(J(A,B))
\]

This means:

- high similarity → low cost → easier transfer path,
- low similarity → high cost → less plausible path.

If the similarity is zero, no edge is created.

### Direction strategy

If direction is known from curated literature or a precomputed network, keep it directed. If not, create bidirectional edges with a penalty factor or annotate them as uncertain.

---

## Graph File Format

A simple and effective input file format is:

```text
N
M
node_0
node_1
...
node_N-1
u v weight label1,label2,label3
u v weight label1,label2
...
```

Where:

- `N` = number of nodes
- `M` = number of edges
- nodes are stored as names
- each edge stores source index, destination index, weight, and label list

This format is readable, easy to parse, and flexible enough for the project.

---

## Algorithms and Their Correlation to the Project Questions

A major strength of TraceNet is that each algorithm has a specific role rather than being included randomly.

### Breadth-First Search (BFS)

**Purpose:** Determine how far resistance can spread from a source within the graph.

**Question answered:** If resistance begins at node X, which other species can eventually be reached?

**Use in project:** BFS provides reachability and layer-by-layer spread. It is especially useful for unweighted traversal interpretation.

**Why BFS matters here:** It provides the first baseline view of spread before weighted analysis is introduced.

### Depth-First Search (DFS)

**Purpose:** Traverse graph structure deeply and support SCC computation.

**Question answered:** What structural connectivity patterns exist in the network?

**Use in project:** DFS is used for exploration and for SCC algorithms such as Kosaraju or Tarjan.

### Strongly Connected Components (SCC)

**Purpose:** Identify cyclic resistance-sharing communities.

**Question answered:** Which sets of species can all reach each other through directed paths?

**Meaning in TraceNet:** Such groups represent resistance-sharing communities or “bubbles” in which resistance may circulate repeatedly.

### Topological Sort

**Purpose:** Order dependencies in a directed acyclic graph.

**Question answered:** If some resistance-associated functions depend on prior gene acquisition, what is a valid acquisition order?

**Use in project:** This is applied not on the main species graph, but on a derived ARG dependency DAG.

**Importance:** It introduces a second graph type and broadens the project beyond only spread analysis.

### Boyer-Moore / Horspool

**Purpose:** Efficient pattern matching for gene signatures.

**Question answered:** Can a known ARG sequence or motif be located efficiently in a reference string or sequence set?

**Use in project:** Demonstrates string matching from the syllabus using manageable FASTA-like data.

**Importance:** Adds Unit III relevance without destabilizing the graph-centered architecture.

### Dijkstra’s Algorithm

**Purpose:** Compute the shortest path from a source to all other nodes in a weighted graph with non-negative weights.

**Question answered:** What is the least-cost or highest-plausibility spread path from a source reservoir to a critical pathogen?

**Meaning in TraceNet:** The output path is the most likely route for resistance spread under the chosen cost model.

### Floyd-Warshall Algorithm

**Purpose:** Compute all-pairs shortest paths.

**Question answered:** What is the minimum spread cost between every pair of species?

**Use in project:** Produces a full vulnerability matrix. This gives a broader view than Dijkstra and supports comparison.

### Greedy Containment Heuristic

**Purpose:** Select important edges to remove quickly.

**Question answered:** If limited interventions are possible, which transfer routes should be targeted first?

**Use in project:** Sort edges by significance and iteratively remove them until the source-target path is disrupted.

**Importance:** Gives a practical approximate strategy for containment.

### Branch-and-Bound

**Purpose:** Solve a reduced optimization problem exactly by exploring and pruning a search tree.

**Question answered:** What is the true minimum set of removals required to sever spread on a small graph?

**Use in project:** Run this only on a smaller induced subgraph where exact search is feasible.

**Importance:** Provides a principled comparison against the greedy heuristic.

---

## Correlation Between the Algorithms

The algorithms are not isolated; they form a progression of increasing analytical depth.

### Relationship 1: BFS/DFS before weighted shortest paths

Traversal algorithms provide the first answer to whether spread is even possible. There is no point computing shortest paths if the target is unreachable.

### Relationship 2: SCC complements reachability

BFS/DFS show where resistance can go; SCC shows where it can circulate cyclically.

### Relationship 3: Dijkstra complements Floyd-Warshall

Dijkstra is best when the question is source-specific. Floyd-Warshall is best when the full pairwise landscape is needed.

### Relationship 4: Greedy containment depends on path analysis

Containment is meaningful only after important paths and high-risk links are identified. Shortest-path analysis informs containment strategy.

### Relationship 5: Branch-and-Bound validates Greedy

The exact solution on a small graph can be compared to the heuristic result. This creates a strong analytical section in the final report.

### Relationship 6: Topological Sort broadens the framework

Topological sort introduces dependency analysis, showing that TraceNet is not restricted to only one graph question.

### Relationship 7: String matching supports graph semantics

Pattern matching can be used to justify or enrich ARG labels used in the graph. This provides a light but coherent integration of Unit III.

---

## Detailed Algorithmic Workflow

A complete project run can follow the sequence below.

1. Load preprocessed graph.
2. Display node and edge counts.
3. Run BFS from a selected source.
4. Run DFS-based SCC decomposition.
5. Run Dijkstra from source to target.
6. Run Floyd-Warshall to compute full distance matrix.
7. Load dependency DAG and perform topological sorting.
8. Load reference sequences and perform Boyer-Moore search.
9. Execute greedy containment on the graph.
10. Execute branch-and-bound on a smaller subgraph.
11. Save outputs and generate visualizations.

This sequence can be presented through a menu-based interface or through scripted experiments.

---

## Computational Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Role |
|---|---:|---:|---|
| BFS | O(V + E) | O(V) | Reachability |
| DFS | O(V + E) | O(V) | Traversal / SCC support |
| SCC (Kosaraju/Tarjan) | O(V + E) | O(V) | Community detection |
| Topological Sort | O(V + E) | O(V) | Dependency ordering |
| Boyer-Moore | Average sublinear after preprocessing | O(m + alphabet) | Pattern matching |
| Dijkstra | O((V + E) log V) | O(V + E) | Single-source shortest path |
| Floyd-Warshall | O(V^3) | O(V^2) | All-pairs shortest path |
| Greedy containment | Depends on checks; practical polynomial | Depends on graph size | Approximate edge selection |
| Branch-and-Bound | Exponential worst case | Exponential worst case | Exact optimization on small graphs |

For the graph sizes expected in a student version of TraceNet, all algorithms except branch-and-bound remain very manageable.

---

## Why the Project Is Feasible

The feasibility of TraceNet comes from careful scoping.

### Small graph size

A graph with around 10 to 20 nodes and tens to low hundreds of edges is enough to look serious while remaining computationally trivial for BFS, DFS, Dijkstra, and Floyd-Warshall.

### Modular preprocessing

The hardest part conceptually is not the algorithms but graph construction. By isolating that task into Python preprocessing, the algorithmic engine stays clean.

### Use of curated data

The project avoids raw bioinformatics pipelines. That removes a major implementation risk.

### Separate exact and approximate optimization

Branch-and-bound is only used on a reduced graph, which makes the exact solver feasible and meaningful.

---

## Assumptions

To leave no room for ambiguity, the following assumptions should be explicitly stated in the project documentation and presentation.

1. The graph is an **analytical abstraction**, not a direct claim of observed transfer in every edge.
2. Edge weights represent a proxy for transfer plausibility, not verified biological probabilities.
3. The species set is deliberately restricted for tractability.
4. The ARG dependency DAG is a simplified conceptual model for demonstrating topological sorting.
5. The containment heuristic models “blocking an edge” as reducing or eliminating a transfer pathway in the abstract graph, not as a literal single biological action.
6. Pattern matching is applied to manageable reference sequences, not to full genomic-scale raw datasets.
7. The branch-and-bound solver is restricted to small subgraphs due to exponential complexity.

These assumptions are not weaknesses. They are necessary modeling boundaries that make the project academically sound.

---

## Limitations

No serious project documentation is complete without limitations.

### Biological limitations

- Jaccard similarity is a proxy, not a direct measure of HGT probability.
- Shared ARG presence does not prove transfer direction.
- Real resistance spread depends on ecological, temporal, and clinical context not modeled here.

### Data limitations

- Curated datasets may be incomplete or differently formatted.
- Thresholding species and ARGs may affect graph structure.
- Directionality may need to be approximated in some cases.

### Algorithmic limitations

- Greedy containment is not guaranteed globally optimal.
- Branch-and-bound does not scale to larger graphs.
- Floyd-Warshall is dense and simple but not ideal for very large sparse graphs.

### Project-scope limitations

- TraceNet is not a predictive clinical system.
- It is not meant to replace bioinformatics pipelines or epidemiological analysis.
- It is a DAA-focused model and teaching tool.

---

## Validation Strategy

The project should be validated at multiple levels.

### 1. Data validation

- Check that all selected species have non-empty ARG sets.
- Verify that graph file node and edge counts match expectations.
- Inspect a few edge weights manually.

### 2. Graph sanity validation

- Confirm there are no invalid node indices.
- Confirm the graph is connected enough to produce meaningful paths.
- Confirm weights are non-negative for Dijkstra.

### 3. Algorithm validation

- Test BFS/DFS on small hand-crafted graphs.
- Test SCC on known cyclic examples.
- Test Dijkstra against manually computed paths.
- Test Floyd-Warshall against repeated single-source runs on small graphs.
- Test topological sort on a known DAG.
- Test Boyer-Moore on sample strings with expected matches.
- Compare branch-and-bound results against brute force on tiny graphs.

### 4. Output validation

- Ensure generated paths are reconstructable and readable.
- Ensure SCC groups are clearly listed.
- Ensure containment outputs actually disconnect source and target.

---

## Experiment Plan

A strong TraceNet project should include experiments, even if lightweight.

### Experiment 1: Reachability analysis

Pick a source node and compute reachable species via BFS. Record the number of reachable nodes and path depth levels.

### Experiment 2: SCC analysis

Run SCC decomposition and interpret whether a tightly linked resistance-sharing group exists.

### Experiment 3: Source-to-target path tracing

Use Dijkstra to trace the minimum-cost route from a reservoir to a hospital pathogen. Display the path and total cost.

### Experiment 4: All-pairs distance matrix

Run Floyd-Warshall and save the full matrix to CSV. Highlight the closest and farthest meaningful species pairs.

### Experiment 5: Containment comparison

Run the greedy heuristic and the exact branch-and-bound solver on a reduced subgraph. Compare:

- number of removed edges,
- selected edges,
- total removal cost,
- runtime.

### Experiment 6: Pattern matching baseline

Use Boyer-Moore or Horspool to search for selected ARG sequences in reference strings and compare against naive matching.

---

## Output Artifacts

By the end of the project, the outputs should include the following artifacts.

### Core outputs

- Processed graph file
- Adjacency list printout
- BFS reachability results
- SCC cluster report
- Dijkstra path output
- Floyd-Warshall matrix
- Topological order result
- Boyer-Moore match results
- Greedy containment ranking
- Branch-and-bound optimal solution for small graph

### Presentation outputs

- Graph image with labeled nodes and weighted edges
- Highlighted shortest path visualization
- SCC cluster diagram or group table
- Distance matrix heatmap or CSV view
- Greedy vs exact containment comparison table

---

## Visualization Strategy

Visualization is one of the most important practical components of TraceNet because it makes abstract graph analysis concrete.

### Recommended visualizations

1. **Main graph view**  
   Shows species as nodes and transfer relationships as directed weighted edges.

2. **Shortest path highlight**  
   Shows a Dijkstra path with distinct coloring.

3. **SCC cluster coloring**  
   Colors strongly connected components differently.

4. **Distance matrix**  
   Shows Floyd-Warshall results in tabular or heatmap form.

5. **Containment edge ranking**  
   Highlights which edges greedy or exact methods choose to remove.

### Tools

- Graphviz for static directed graph rendering
- Python matplotlib/seaborn for matrix display if needed
- CSV export for clean report integration

---

## Implementation Plan

A practical implementation timeline is provided below.

### Week 1: Finalize graph definition and dataset

- Decide exact node meaning
- Select source data
- Identify 10–20 species
- Define filtering criteria for ARGs

### Week 2: Build preprocessing script

- Parse dataset
- Build species-to-ARG sets
- Compute Jaccard similarities
- Export graph file

### Week 3: Build graph engine

- Implement graph reading
- Build adjacency list and matrix
- Test graph integrity

### Week 4: Implement traversal algorithms

- BFS
n- DFS
- SCC
- Basic output formatting

### Week 5: Implement shortest path algorithms

- Dijkstra
- Floyd-Warshall
- Path reconstruction
- CSV export

### Week 6: Implement dependency and string modules

- Topological sort
- Boyer-Moore or Horspool

### Week 7: Implement containment modules

- Greedy heuristic
- Branch-and-bound on reduced graph
- Runtime comparison

### Week 8: Visualization and report preparation

- Generate Graphviz outputs
- Prepare comparison tables
- Finalize documentation and viva notes

---

## Risk Analysis

### Risk 1: Data parsing difficulty

If the selected dataset is messy or inconsistent, preprocessing may take longer than expected.

**Mitigation:** Use a smaller curated subset or a precomputed supplementary matrix.

### Risk 2: Overcomplicated biology

The project may become difficult to explain if too many biological details are introduced.

**Mitigation:** Keep the narrative graph-first and use biology only as context.

### Risk 3: Branch-and-bound explosion

The exact optimization solver may become too slow.

**Mitigation:** Restrict it to a carefully selected small subgraph.

### Risk 4: Weak visualization

Even correct algorithms can feel unimpressive if outputs are raw and unreadable.

**Mitigation:** Prioritize graph visualization early.

### Risk 5: Conceptual ambiguity

If edge meaning, weight meaning, or containment meaning are vague, evaluators may challenge the model.

**Mitigation:** Define all modeling assumptions explicitly in the documentation.

---

## Why This Project Is Strong for a DAA Course

TraceNet is especially strong as a DAA project for the following reasons:

- It is graph-centric, which aligns directly with common professor guidance for graph problem projects.
- It allows comparison between different algorithmic strategies.
- It produces meaningful and visual outputs.
- It includes both exact and approximate reasoning.
- It spans multiple syllabus units in a coherent way.
- It can be defended at both a conceptual and implementation level.

In other words, the project does not merely “contain algorithms”; it demonstrates **algorithm selection, modeling discipline, and problem-solution alignment**.

---

## Expected Viva Questions and Conceptual Answers

### Q1. Why choose antibiotic resistance as the domain?

Because it is a meaningful real-world problem with a natural graph structure. Resistance spreads through relationships between bacterial species, so graph algorithms are appropriate.

### Q2. Is the graph biologically exact?

No. It is an abstraction built from curated data and similarity proxies. Its purpose is algorithmic analysis, not clinical certainty.

### Q3. Why use both Dijkstra and Floyd-Warshall?

Dijkstra answers source-specific shortest path queries efficiently, while Floyd-Warshall provides all-pairs shortest path information for the whole graph.

### Q4. Why not use only greedy containment?

Because greedy is approximate. Branch-and-bound on a smaller subgraph provides an exact baseline for comparison.

### Q5. Why include Boyer-Moore?

It connects the project to string-matching content in the syllabus and supports ARG-related sequence lookup in a manageable way.

### Q6. Why topological sort if the graph is cyclic?

Topological sort is applied to a separate dependency DAG, not the main spread graph.

---

## Overall Summary

TraceNet is a comprehensive DAA course project that models antibiotic resistance spread as a weighted directed graph and analyzes it using a sequence of classical algorithms. The project begins with curated data, transforms that data into a graph through preprocessing, and then applies BFS, DFS, SCC, topological sorting, Boyer-Moore, Dijkstra, Floyd-Warshall, greedy containment, and branch-and-bound to answer distinct but related questions about spread, structure, dependencies, and intervention.

Its strength lies in integration. Each algorithm has a clear role. Each output supports a larger narrative. The project remains grounded, implementable, visually demonstrable, and academically sound.

Most importantly, the project leaves no major ambiguity when properly documented:

- what the graph means,
- what each algorithm does,
- why each algorithm is included,
- what assumptions are being made,
- what the outputs represent,
- and where the project’s boundaries lie.

That clarity is what will ultimately make TraceNet not just a coded project, but a strong academic submission.

---

## Final Project Definition in One Paragraph

TraceNet is an end-to-end graph-theoretic analytical framework for modeling and studying the spread of antibiotic resistance across bacterial species. Using curated biological input transformed into a weighted directed graph, the system applies core algorithms from the Design and Analysis of Algorithms syllabus to analyze reachability, cyclic communities, dependency ordering, shortest transmission paths, all-pairs vulnerability, pattern matching of resistance genes, and both approximate and exact containment strategies. It is intentionally scoped as an algorithmic academic project rather than a clinical system, and its design emphasizes correctness, interpretability, modularity, visualization, and strong alignment with DAA learning objectives.
