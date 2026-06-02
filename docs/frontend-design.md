# TraceNet Frontend — Design Specification
**Version 1.0 — 2026-06-02**
**Design concept: The Pinned Specimen**

---

## 0. Intent

This document is the single source of truth for the TraceNet demonstration frontend. It covers every visual, interaction, and animation decision. Nothing here is aspirational — everything is implementable with the chosen tech stack. Any future implementation must not deviate from this spec without amending this document first.

The guiding principle: **the graph does the talking. The narrative gives it meaning. The professor never feels like they are using a web app.**

---

## 1. Concept Summary

**The Pinned Specimen** is a scrollytelling interface styled as a living scientific figure. The graph canvas is pinned to the top 52% of the viewport at all times — it does not scroll. It behaves like Figure 1 in a journal paper that happens to animate. Below it, a scrollable narrative walks through all 8 algorithms as if reading a Methods section. As each algorithm section enters the viewport, the graph transforms to demonstrate it. The professor reads downward; the graph responds upward.

**Delivery model:** Hybrid. During the demo you scroll and narrate. During Q&A the professor can activate any chapter by clicking its heading in the narrative, or expand the graph to 85% viewport height for detailed inspection.

---

## 2. Visual Identity

### 2.1 Colour System

All values are exact. No approximations.

| Token | Hex | Usage |
|---|---|---|
| `--bg-page` | `#faf9f6` | Page background — warm off-white, quality paper feel |
| `--bg-canvas` | `#f4f1ea` | Graph canvas background — slightly warmer than page |
| `--bg-grid` | `#e8e4d8` | Graph paper grid lines — barely visible |
| `--bg-inset` | `#eeeae0` | Inset panels inside graph (matrix, DNA strip) |
| `--ink-primary` | `#1a1a2e` | All body text, node names |
| `--ink-secondary` | `#4a4a5a` | Narrative sub-text, captions |
| `--ink-muted` | `#9a9aaa` | Leader lines, bracket annotations, grid |
| `--navy` | `#1e3a5f` | Algorithm badges, chapter headers, result panel borders |
| `--navy-light` | `#d4e4f5` | Algorithm badge backgrounds |
| `--red-resistance` | `#9b1c1c` | High resistance nodes, removed edges, critical paths |
| `--red-light` | `#fee2e2` | Resistance node halo fill |
| `--green-safe` | `#14532d` | Contained nodes, safe paths |
| `--green-light` | `#dcfce7` | Safe node halo fill |
| `--amber-mid` | `#92400e` | Intermediate resistance, 2-hop nodes |
| `--amber-light` | `#fef3c7` | Intermediate node halo fill |
| `--edge-default` | `#b0a898` | Default edge colour — warm gray, recedes |
| `--edge-active` | `#1e3a5f` | Highlighted edge — algorithm-active |
| `--edge-removed` | `#9b1c1c` | Greedy/B&B removed edges before fade |
| `--leader-line` | `#c0b8a8` | Node label leader lines |
| `--bracket` | `#d4cfc4` | Taxonomic grouping brackets |
| `--scc-a` | `#dbeafe` / `#1e40af` | SCC group 1 — blue family (fill / stroke) |
| `--scc-b` | `#dcfce7` / `#166534` | SCC group 2 — green family |
| `--scc-c` | `#fef3c7` / `#92400e` | SCC group 3 — amber family |
| `--result-bg` | `#f0f4f8` | Result panel background |
| `--result-border` | `#1e3a5f` | Result panel left border (3px solid) |

### 2.2 Typography

Three typefaces. All loaded from Google Fonts. No fallback compromises — these load before render.

**Playfair Display** — Chapter question headings only
- Size: 26px on desktop projector, 22px otherwise
- Weight: 400 (regular)
- Style: Italic
- Line height: 1.3
- Usage: The big plain-English question that opens each chapter section

**Lora** — All narrative body text
- Size: 17px
- Weight: 400 (regular)
- Line height: 1.75
- Max width: 660px (centred column)
- Usage: Algorithm description, biological context, result interpretation

**Inter** — All UI chrome, labels, badges, monospace data
- Size: 11px for node labels, 12px for algorithm badges, 13px for result panels
- Weight: 500 for labels, 600 for badges
- Usage: Everything non-narrative — graph labels, complexity markers, result data, inset tables

**Monospace** — IBM Plex Mono
- Size: 12px
- Usage: Complexity annotations (`O(V+E)`), edge weights on graph, DNA sequence inset

### 2.3 Graph Paper Grid

Applied only to the graph canvas. CSS background-image with two overlapping linear-gradients:

```css
background-image:
  linear-gradient(var(--bg-grid) 1px, transparent 1px),
  linear-gradient(90deg, var(--bg-grid) 1px, transparent 1px);
background-size: 40px 40px;
```

Grid lines are 1px, colour `#e8e4d8`. At normal brightness this reads as faint structure. When the professor expands the graph, the grid becomes clearly visible — it feels like a lab notebook page, not a web canvas.

---

## 3. Layout Architecture

### 3.1 Viewport split

```
┌──────────────────────────────────────────────────────────────────┐  ← top of viewport
│                                                                  │
│                    GRAPH CANVAS                                  │  52vh — position: sticky; top: 0
│             (full viewport width, always visible)               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤  ← 52vh from top
│                                                                  │
│                   NARRATIVE SCROLL AREA                         │  48vh visible, scrolls infinitely
│              (centred column, max-width 660px)                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Graph canvas internals

The graph canvas is `100vw × 52vh`, position sticky, top 0, z-index 10. Inside it:

```
┌─────────────────────────────────────────────────────────┐
│  [CHAPTER LABEL — top-left]              [EXPAND ⤢]    │  ← 32px strip
│                                                          │
│                                                          │
│            D3 SVG — the species graph                   │  ← grows to fill
│         (or ARG DAG in chapters 3, 8)                   │
│                                                          │
│                                                          │
│  [INSET PANEL — bottom-right, contextual]               │  ← appears in ch.4,6,8 only
└─────────────────────────────────────────────────────────┘
```

**Chapter label** (top-left): Shows current algorithm name + unit number. Example: `BFS — Unit II`. Inter 11px, `--navy`, letter-spacing 0.08em, uppercase. Fades in when chapter activates.

**Expand button** (top-right): `⤢` icon, 28×28px. On click: graph canvas transitions to `85vh` over 300ms ease-out, pushing narrative off-screen. Press Escape or click `⤡` to collapse. This is the Q&A mode toggle.

**Inset panel** (bottom-right): A `240 × 180px` panel that appears only in chapters 4 (DNA strip), 6 (distance matrix), and 8 (B&B search tree). Styled with `--bg-inset` background, `1px solid var(--bracket)` border, 4px border-radius. Each chapter's inset is defined in section 6.

### 3.3 Narrative column

The scrollable area below the graph canvas. Full-width div, overflow-y scroll, but content is centred at max-width 660px with `padding: 48px 24px`.

Each algorithm occupies one **chapter section** — a `<section>` element with `min-height: 85vh` so it occupies most of the visible narrative area when scrolled into view. This ensures clean chapter boundaries: when one section is visible, the previous is fully above the fold.

Chapter section structure:
```
[chapter number — small caps, navy, Inter 11px]
[plain-English question — Playfair Display Italic 26px]
[algorithm badge — navy pill: "BFS — O(V+E) — Unit II"]
[narrative paragraph — Lora 17px, 3–5 sentences]
[result panel — appears after graph animates, styled as figure caption]
[spacer]
```

---

## 4. Graph Layout — The Fixed Specimen

The node positions are **not force-directed.** They are manually assigned once and never change across all 8 chapters. Only visual properties (colour, opacity, stroke weight) change. The professor builds one spatial mental model and reads the graph fluently by chapter 3.

### 4.1 Spatial organisation

The 16 nodes are arranged left-to-right in three ecological columns, with vertical spacing to avoid overlap:

```
LEFT COLUMN              CENTRE COLUMN              RIGHT COLUMN
(Environmental sources)  (Bridge nodes)             (ESKAPE clinical targets)

E. faecalis              E. coli                    K. pneumoniae
C. jejuni                S. enterica                E. cloacae
                         K. oxytoca                 P. aeruginosa
                         C. freundii                E. faecium
                         P. mirabilis               S. aureus
                         S. marcescens              A. baumannii
                         A. pittii
                         P. putida
```

Exact pixel positions are computed proportionally to the canvas dimensions at render time (to support any viewport width). The proportional anchor points are defined as percentage coordinates of the SVG viewBox.

### 4.2 Node visual encoding

**Default state (chapter not yet active):**
- Circle radius: scaled to `sqrt(plasmid_ARG_count)` × 2.5, minimum 6px, maximum 16px
- Fill: `--bg-canvas` (matches background — they look like punched holes)
- Stroke: `--edge-default`, 1.5px
- Label: Inter italic 9px, `--ink-secondary`, placed with a 3px leader line extending from node edge to label anchor

**Active state (node is relevant to current algorithm):**
- Fill: depends on algorithm context (see chapter definitions)
- Stroke: 2.5px, full colour
- Drop shadow: `0 0 8px rgba(colour, 0.3)` — subtle glow, not neon
- Label: `--ink-primary`, weight 600

**Faded state (node is irrelevant to current algorithm):**
- Opacity: 0.25 on fill and stroke
- Label opacity: 0.2

State transitions use D3's `transition().duration(500).ease(d3.easeCubicInOut)`.

### 4.3 Edge visual encoding

**Default:**
- Stroke: `--edge-default`, width proportional to Jaccard weight × 3 (min 0.5px, max 3px)
- Opacity: 0.4
- No arrowheads by default (too much noise with 144 edges)

**Active (part of current algorithm's focus):**
- Stroke: `--edge-active` or algorithm-specific colour
- Width: +1.5px above default
- Opacity: 1.0
- Arrowhead: appears on active edges only (SVG `<marker>` element, 6×6px)

**Removed (greedy/B&B chapters):**
- Stroke: `--red-resistance`
- Stroke-dasharray: `4 3` (dashed)
- Then: opacity transition to 0 over 800ms, edge removed from DOM

### 4.4 Taxonomic bracket annotations

Three bracket annotations are always present on the graph, visible at reduced opacity (0.4) by default, increasing to 0.9 when the SCC chapter activates.

- **Left bracket**: Vertical curly brace beside the left column. Label: `"Environmental Reservoirs"`, Inter 9px, `--ink-muted`
- **Right bracket**: Vertical curly brace beside the right column. Label: `"ESKAPE Clinical Targets"`, Inter 9px, `--ink-muted`
- **Centre label**: Small text above the centre column: `"Bridge species"`, Inter 9px, `--ink-muted`

Brackets are SVG `<path>` elements using the standard curly brace curve formula.

---

## 5. Scrollytelling Trigger System

Built on the **Intersection Observer API** — no scroll listeners, no libraries.

One `IntersectionObserver` watches all 8 `<section>` elements in the narrative. Threshold: `0.35` (chapter activates when 35% of the section is visible in the narrative panel's scroll container).

When a chapter section crosses the threshold:
1. The chapter label in the graph canvas updates (fade out old → fade in new, 200ms each)
2. The graph runs the chapter's activation function (see section 6)
3. All previously active graph elements transition to their faded or reset state first (300ms), then the new chapter's elements activate (500ms) — never simultaneous

When a chapter scrolls back out (scrolling upward):
- The graph does **not** reverse the animation. It holds the last active chapter's state.
- This prevents jarring re-animations when the professor scrolls up slightly.

Result panels inside each narrative section appear via CSS `transition: opacity 400ms, transform 400ms` triggered by adding a `.visible` class when the section activates. They slide up 12px and fade in.

---

## 6. The Eight Chapters — Complete Specification

### Chapter 1 — BFS: Reachability

**Plain-English question:** *"If resistance enters E. faecalis today, how far does it spread?"*

**Algorithm badge:** `BFS — O(V + E) — Unit II`

**Narrative (Lora, 17px):**
Breadth-first search traverses the graph layer by layer, recording the minimum number of horizontal gene transfer events separating each species from the source. Unweighted. Undiscriminating. The result is a map of reachability — not probability, but possibility.

**Graph activation sequence:**
1. All nodes and edges fade to 0.25 opacity (300ms)
2. Source node `E. faecalis` activates: fill `--amber-light`, stroke `--amber-mid`, radius +2px, pulse animation (scale 1 → 1.15 → 1, 800ms, repeats 2×)
3. Hop 1 nodes illuminate simultaneously in `--amber-light` (500ms delay after source)
4. Hop 2 nodes illuminate in `--red-light` / `--red-resistance` (500ms after hop 1)
5. Hop 3+ nodes illuminate in `--red-resistance`, deeper saturation
6. Edges between consecutive hops animate stroke from `--edge-default` to `--edge-active` as each hop illuminates
7. Unreachable nodes remain at 0.25 opacity with a small `∞` label in Inter 8px

**Node colour by hop distance:**
- Source: `--amber-mid` fill
- Hop 1: `#fcd34d` fill (warm yellow)
- Hop 2: `#f97316` fill (orange)
- Hop 3+: `--red-resistance` fill

**Result panel:**
```
9 of 16 species reachable from E. faecalis.
K. pneumoniae reached at hop 2, via E. coli.
7 species unreachable (no plasmid pathway exists).
```

---

### Chapter 2 — SCC: Resistance Bubbles

**Plain-English question:** *"Which organisms form closed resistance-sharing loops — genes that cycle and cannot escape?"*

**Algorithm badge:** `Kosaraju's SCC — O(V + E) — Unit II`

**Narrative:**
Strongly connected components reveal cyclic structure: groups of species that can each reach every other through directed paths. In the resistance context, an SCC is a *resistance bubble* — once a gene enters this cluster, it circulates through every member indefinitely. Containment at the cluster boundary is the only effective intervention.

**Graph activation sequence:**
1. All nodes and edges reset to default opacity
2. SCC halos appear beneath node groups — filled ellipses with low opacity (0.15), expanding outward over 600ms with an `ease-out` expand from centre
3. SCC group colours applied to nodes within each group (border and fill)
4. Edges *within* an SCC brighten to full opacity, weight +1px
5. Edges *between* SCCs remain at default, slightly reduced opacity
6. Bracket annotations increase to 0.9 opacity
7. Singleton SCCs (size 1) receive a small open-circle annotation: `○ singleton`

**SCC group assignments** (determined after `build_graph.py` runs — update when graph is generated):
- Groups are pre-computed and hard-coded as JSON in `data/hgt_graph.json`
- The three largest SCCs get colours `--scc-a`, `--scc-b`, `--scc-c`
- Remaining singletons: no halo, node opacity 0.5

**Result panel:**
```
[N] strongly connected components detected.
Largest cluster: {K. pneumoniae, E. cloacae, K. oxytoca} — [N] species.
These species exchange ARGs bidirectionally.
Containment must target cluster boundary edges, not internal ones.
```

---

### Chapter 3 — Topological Sort: ARG Acquisition Order

**Plain-English question:** *"In what sequence does a bacterium build full antibiotic resistance — from ancestral genes to last-resort mechanisms?"*

**Algorithm badge:** `Kahn's Algorithm — O(V + E) — Unit II — on ARG dependency DAG`

**Narrative:**
Topological sort operates on a second graph — not species, but genes. The ARG dependency DAG models clinical co-occurrence: the observation that NDM-1, conferring carbapenem resistance, almost always appears in strains that already carry CTX-M. The sort produces a valid acquisition sequence from ancestral, simple genes through to the most clinically dangerous.

**Graph transition (critical visual moment — graph switches):**
1. Species graph: all edges fade to opacity 0 (400ms)
2. Species graph: all nodes shrink to radius 3px and fade to opacity 0 (400ms, staggered 20ms per node)
3. ARG DAG nodes fade in at their positions (the ARG DAG uses a horizontal left-to-right linear layout across the full graph canvas width)
4. ARG DAG edges draw in with `stroke-dashoffset` animation (each edge "draws itself" left to right)
5. Topological sort animates: nodes illuminate in order with 400ms intervals — `tetM → sul1 → blaTEM → blaSHV → aac(6')-Ib → blaCTX-M → blaOXA-48 → blaNDM-1 → mcr-1`
6. Each illuminated node gains a small ordinal label: `①`, `②`, etc.
7. A horizontal progress arrow animates below the node row, moving rightward as each node activates

**ARG DAG node colours:**
- `tetM`, `sul1`: `--green-safe` (ancestral, low-level)
- `blaTEM`, `blaSHV`, `aac(6')-Ib`: `--amber-mid` (intermediate)
- `blaCTX-M`, `blaOXA-48`: `#c2410c` (high risk)
- `blaNDM-1`, `mcr-1`: `--red-resistance` (last-resort resistance)

**Chapter 4 onwards:** Graph transitions back to species HGT graph (same animation in reverse) when chapter 4 activates.

**Result panel:**
```
Valid acquisition order:
tetM → sul1 → blaTEM → blaSHV → aac(6')-Ib → blaCTX-M → blaOXA-48 → blaNDM-1 → mcr-1

NDM-1 and mcr-1 appear last — dependent on prior gene acquisitions.
Cycle check: none detected. Valid DAG confirmed.
```

---

### Chapter 4 — Boyer-Moore: ARG Sequence Search

**Plain-English question:** *"Does NDM-1 — the gene destroying our last carbapenem antibiotics — physically exist in K. pneumoniae's genome?"*

**Algorithm badge:** `Boyer-Moore — O(nm) worst / O(n/m) avg — Unit III — DNA alphabet {A,T,C,G}`

**Narrative:**
Boyer-Moore string matching locates a known resistance gene sequence within a reference string, scanning right-to-left within the pattern and using pre-computed bad-character skip tables to avoid redundant comparisons. On a 4-character DNA alphabet the average-case performance is sublinear — the algorithm skips large portions of the text when a mismatch occurs at a character absent from the pattern.

**Graph activation sequence:**
1. All nodes fade to 0.25 opacity. K. pneumoniae activates: `--red-resistance` stroke, full opacity, slow pulse
2. The **DNA strip inset** appears in the bottom-right of the graph canvas (240×180px panel)

**DNA strip inset specification:**
- Background: `--bg-inset`
- Header: `"NDM-1 search — K. pneumoniae reference"`, Inter 9px, `--navy`
- Top row: Text string `T` — 60 monospaced characters of nucleotide sequence (real sequence from CARD FASTA, truncated), IBM Plex Mono 10px
- Bottom row: Pattern `P` — `NDM-1` fragment (first 20bp), displayed below `T` with alignment marks
- Animation: Pattern slides rightward across `T` in Boyer-Moore fashion:
  - Matching characters: highlight green
  - Mismatch: flash red, then pattern jumps right by the bad-character skip amount (visually, the pattern row leaps)
  - Match found: pattern row locks in place, matching region highlighted green on both rows, small `✓` marker
- Below strip: two counters update in real-time: `Boyer-Moore: 0 comparisons` / `Naive: 0 comparisons` — both increment as the animation runs, showing the gap opening

**Result panel:**
```
NDM-1 confirmed in K. pneumoniae reference genome.
71 sequence variants catalogued in CARD.
Boyer-Moore: 847 comparisons
Naive search: 3,241 comparisons
Reduction: 74% fewer comparisons — enabled by 4-character DNA alphabet.
```

---

### Chapter 5 — Dijkstra: Most Probable Spread Path

**Plain-English question:** *"What is the single most likely route resistance takes from an environmental source to a hospital?"*

**Algorithm badge:** `Dijkstra — O((V+E) log V) — Unit IV — weights: −log(Jaccard × τ)`

**Narrative:**
Dijkstra's algorithm finds the minimum-cost path in a graph with non-negative weights. Here, edge costs are the negative logarithm of transfer probability — so high-probability transfers become short distances and Dijkstra naturally finds the most probable multi-hop route. The result is not certain; it is the path of least resistance through the transfer network.

**Graph activation sequence:**
1. All nodes reset to default (species graph, normal opacity)
2. Source node (`C. jejuni` or `E. faecalis`) activates with amber pulse
3. Dijkstra's frontier expands: nodes colour from light to saturated as they are settled by the algorithm — animated in settling order with 200ms intervals per node. Settled nodes change fill from `--bg-canvas` to a blue-to-red gradient based on their `dist` value (close = blue, far = red)
4. When `K. pneumoniae` is settled, all non-path nodes fade to 0.25 opacity
5. The optimal path edges illuminate in sequence from source to target: stroke `--red-resistance`, weight 3px, arrowheads visible
6. Edge weight labels appear along each path edge: small Inter 10px labels showing the `−log(w)` value
7. Non-path nodes and edges fade to 0.15 opacity

**Result panel:**
```
Most probable spread route to K. pneumoniae:
C. jejuni → [bridge species] → ... → K. pneumoniae

Total path distance: [computed value]
Equivalent probability: e^(−distance) = [value]%

Note: distance = Σ −log(w) along path.
Minimum distance = maximum probability under independence assumption.
```
*(Exact path filled from `hgt_graph.txt` at runtime)*

---

### Chapter 6 — Floyd-Warshall: All-Pairs Vulnerability

**Plain-English question:** *"How close is every species to every other — and which are the most dangerous bridges to clinical targets?"*

**Algorithm badge:** `Floyd-Warshall — O(V³) — O(V²) space — Unit IV — 16³ = 4,096 operations`

**Narrative:**
Floyd-Warshall computes minimum distances between every pair simultaneously using dynamic programming. Where Dijkstra answers one source, Floyd-Warshall answers all sources at once — producing a complete vulnerability matrix. The darkest cells in the matrix are the shortest paths; the brightest nodes on the graph are the most connected to clinical targets.

**Graph activation sequence:**
1. All nodes and edges set to 50% opacity — a neutral baseline
2. The **distance matrix inset** appears in the bottom-right (240×180px)
3. Matrix fills row by row with colour cells (green = small distance / high probability, red = large distance / low probability), using a sequential colourmap. Each row fills over 80ms, simulating the DP computation
4. After matrix fills: node brightness on the main graph updates to reflect each node's mean distance to ESKAPE targets — brighter/more saturated = more connected, useful as a surveillance priority indicator
5. Top 3 most-connected bridge nodes receive a small star annotation `★` in `--navy`, Inter 9px
6. The three star-annotated nodes' edges to ESKAPE targets briefly brighten (1000ms) then settle

**Distance matrix inset specification:**
- 16×16 grid (one cell per species pair)
- Cell size: 10×10px (fits in 240px width with 1px gaps)
- Axes: abbreviated species names in Inter 7px
- Colour scale: green (`#dcfce7`) at 0 → red (`--red-resistance`) at max, using `d3.scaleSequential(d3.interpolateRdYlGn).domain([max, 0])`
- Title: `"Spread Distance Matrix"`, Inter 9px, `--navy`

**Result panel:**
```
All-pairs spread distances computed.
Most connected bridge nodes (★):
  1. E. coli — mean distance 0.82 to all ESKAPE targets
  2. K. oxytoca — mean distance 0.94
  3. S. enterica — mean distance 1.12

These species are surveillance priorities — high plasmid ARG overlap
with all 6 ESKAPE clinical targets.
```

---

### Chapter 7 — Greedy Containment: Approximate Intervention

**Plain-English question:** *"If we can only disrupt a few transfer pathways, which ones cut the most resistance routes?"*

**Algorithm badge:** `Greedy Min-Cut — O(E log E + k(V+E)) — Unit IV`

**Narrative:**
The greedy heuristic sorts edges by transfer weight — highest probability first — then iteratively removes the most probable edge and checks whether source and target remain connected via BFS. If removing an edge severs the path, it stays removed. The algorithm is fast and practical, but it makes locally optimal choices that may not produce a globally optimal cut. The next chapter tests that claim exactly.

**Graph activation sequence:**
1. Edges sort visually — the thickest (highest weight) edges brighten to full opacity, others fade. The graph looks like only the "highways" are visible
2. Source (`E. faecalis`) and target (`K. pneumoniae`) activate with their respective colours
3. Algorithm iterates: one edge at a time, the highest-weight edge gets a red `×` mark (SVG cross, 8px, `--red-resistance`) that appears on the midpoint of the edge
4. If the edge is not critical: the `×` fades and the edge restores (not removed)
5. If the edge is critical: `×` remains, edge transitions to dashed `stroke-dasharray: 4 3` in `--red-resistance`, then fades to opacity 0 over 800ms and is removed
6. After each critical removal: a BFS connectivity check animates briefly (a ripple from source that stops short of the target)
7. After final removal: `K. pneumoniae` node gets a dashed red ring around it — isolated from the source

**Result panel:**
```
Greedy removed 3 edges to sever E. faecalis → K. pneumoniae:
  1. [species A] → [species B]   w = 0.441
  2. [species C] → [species D]   w = 0.312
  3. [species E] → [species F]   w = 0.187
Total weight removed: 0.940
Optimal? Not guaranteed. See next chapter.
```

---

### Chapter 8 — Branch-and-Bound: Exact Optimum

**Plain-English question:** *"What is the provably minimum number of edges to remove — and was greedy right?"*

**Algorithm badge:** `Branch-and-Bound on hospital subgraph — O(2^E) worst case — Unit V`

**Narrative:**
Branch-and-bound performs exhaustive search with pruning: it explores every possible edge-removal combination but abandons any branch that cannot improve the current best solution. On the 10-node hospital subgraph the search tree is tractable in milliseconds. The result carries a certificate: this is optimal, not approximate. The comparison with greedy is the strongest analytical moment in the project.

**Graph transition:**
1. Full species graph fades out (all nodes/edges to opacity 0, 400ms)
2. Hospital subgraph fades in: 10 nodes, positioned centrally in the canvas, larger node radii (radius × 1.4) to fill the space. Same visual language — scientific specimen style

**B&B inset (bottom-right, 240×180px):**
A partial search tree. Nodes are small circles (8px), labelled with edge counts. Branch lines drawn as thin strokes:
- Explored branches: `--ink-secondary`
- Pruned branches: dashed, red, with a small red `✗` at the pruning point
- Optimal path: green solid stroke, nodes filled green
The tree animates as branches are explored — one level at a time, 300ms per level

**Graph activation sequence:**
1. Hospital subgraph appears at full opacity
2. B&B search tree inset appears and builds
3. As B&B finds the optimal solution: optimal edges to remove get the `×` mark and dashed treatment (same as greedy)
4. Then: the graph splits into a side-by-side comparison — left half shows greedy's 3-edge removal, right half shows B&B's 2-edge removal. A thin vertical divider appears between them with labels `"Greedy"` and `"B&B — Optimal"` in Inter 11px

**Result panel (the climax of the demo):**
```
Hospital subgraph: 10 nodes, ~30 edges.

            Greedy          Branch-and-Bound
Edges removed:   3               2   ← fewer
Weight removed:  0.940           0.628
Runtime:         <1ms            18ms
Optimal?         No              YES ✓

Greedy was suboptimal. B&B found a better solution by
preserving edge C (weight 0.312) and instead removing
edge D (weight 0.441) — which greedy skipped.

General multi-source containment is NP-hard (reduction
from Minimum Vertex Cover). Greedy exists for the full
graph. B&B is exact only on small subgraphs.
```

---

## 7. Interaction Model

### 7.1 Demo mode (default)

The narrative panel scrolls freely. The graph responds passively. No interactive controls are visible. The professor reads and watches.

### 7.2 Q&A mode (activated on demand)

Activated by pressing `Space` or clicking the chapter label in the graph canvas. A thin control bar slides down from the top of the graph canvas (height 36px, background `--bg-inset`, border-bottom `1px solid --bracket`):

```
[ ↺ Replay ]  [ ← Prev chapter ]  [ → Next chapter ]  [ Chapter: BFS ▼ ]  [ ⤢ Expand ]
```

All controls are Inter 12px, `--navy`, minimal styling. The chapter dropdown allows jumping to any of the 8 chapters directly.

Pressing `Space` again hides the control bar.

### 7.3 Graph expansion

`⤢` button (top-right of graph canvas, always visible, 24×24px, `--ink-muted`):
- Click: graph canvas `height` transitions from `52vh` to `85vh` (300ms ease-out)
- Narrative panel scrolls off-screen (professor is now fully focused on the graph)
- `⤡` button replaces `⤢`
- Click `⤡` or press `Escape`: collapses back to `52vh`

### 7.4 Node hover (Q&A mode only)

In Q&A mode, hovering a node shows a small tooltip:

```
┌─────────────────────────────┐
│ Klebsiella pneumoniae       │
│ Plasmid ARGs: 46            │
│ Gram: negative              │
│ Role: ESKAPE clinical target│
│ Jaccard (top pair): 0.500   │
└─────────────────────────────┘
```

Styled with `--bg-page` background, `1px solid --bracket`, Inter 11px, `--ink-primary`. Appears 200ms after hover enters node. Disappears immediately on mouse leave.

Tooltip is **not** shown during the narrative demo — the graph is purely visual, not interactive, during the presentation.

---

## 8. Animation System

All animations use D3 transitions. No CSS animations except for the initial page load fade-in and the control bar slide.

| Animation | Duration | Easing |
|---|---|---|
| Chapter activation (node state change) | 500ms | `d3.easeCubicInOut` |
| Chapter deactivation (fade out) | 300ms | `d3.easeLinear` |
| BFS hop propagation (per hop) | 400ms | `d3.easeExpOut` |
| Edge weight label appearance | 200ms | `d3.easeLinear` |
| Halo expand (SCC) | 600ms | `d3.easeBackOut` |
| Graph switch (species ↔ ARG DAG) | 400ms fade-out + 400ms fade-in | `d3.easeSinInOut` |
| DNA strip pattern slide | 80ms per position | `d3.easeLinear` |
| Matrix cell fill | 80ms per row | `d3.easeLinear` |
| Edge removal (dashed → fade) | 800ms | `d3.easeCubicIn` |
| B&B tree branch draw | 300ms per level | `d3.easeExpOut` |
| Result panel appear | 400ms opacity + 12px translateY | CSS transition |
| Control bar slide | 250ms | CSS ease-out |
| Graph expand | 300ms | CSS ease-out |

**Performance rule:** Never animate more than 30 elements simultaneously. Stagger where needed (20ms per element).

---

## 9. Tech Stack

### 9.1 Decision

**Vanilla HTML + CSS + JavaScript + D3.js v7.**

No framework. No build step. No npm. The professor opens `index.html` from a file system and the demo runs. This is not a limitation — it is a deliberate architectural choice that ensures zero deployment friction on the day of the viva.

### 9.2 Dependencies

All loaded from CDN in the `<head>`:

```html
<!-- Fonts: Google Fonts delivers fonts via its own CDN with CORS headers.
     SRI is not applied here — Google rotates font file URLs on updates
     and SRI would break the load. Fonts are display-only, not executable. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital@1&family=Lora:ital,wght@0,400;1,400&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">

<!-- D3: pinned to exact version 7.9.0 with Subresource Integrity.
     SRI hash computed from the actual file: sha384sum of d3.min.js.
     If upgrading D3, recompute: curl URL | openssl dgst -sha384 -binary | openssl base64 -A -->
<script
  src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"
  integrity="sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i"
  crossorigin="anonymous">
</script>
```

That is the complete dependency list. One `<link>` group and one `<script>`.

**SRI note for implementation:** The `integrity` attribute tells the browser to verify the file's SHA-384 hash before executing it. If the CDN serves a tampered file, the browser refuses to run it. The hash above was computed from the actual `d3@7.9.0` file at time of spec authorship — recompute it if upgrading:

```bash
curl -s https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js | \
  openssl dgst -sha384 -binary | openssl base64 -A
```

### 9.3 File structure

```
frontend/
├── index.html              ← single entry point, all structure
├── style.css               ← all visual design (custom properties, layout, typography)
├── main.js                 ← scroll observer, chapter orchestrator, graph init
├── graph.js                ← D3 graph render, node/edge state machine
├── chapters/
│   ├── ch1_bfs.js          ← activation function for chapter 1
│   ├── ch2_scc.js
│   ├── ch3_topo.js
│   ├── ch4_boyer_moore.js
│   ├── ch5_dijkstra.js
│   ├── ch6_floyd_warshall.js
│   ├── ch7_greedy.js
│   └── ch8_bnb.js
└── data/
    ├── hgt_graph.json      ← converted from hgt_graph.txt by a one-time Python script
    └── arg_dag.json        ← converted from arg_dag.txt
```

Each chapter file exports a single function: `activate(graphState, data)`. `main.js` calls it when the Intersection Observer fires. Chapter files are completely independent — they receive the current D3 graph selection and the pre-parsed data, do their animations, and return.

### 9.4 Data format — `hgt_graph.json`

```json
{
  "nodes": [
    {
      "id": "Klebsiella_pneumoniae",
      "label": "K. pneumoniae",
      "plasmid_args": 46,
      "gram": "negative",
      "role": "eskape_target",
      "scc_group": 1,
      "x_anchor": 0.82,
      "y_anchor": 0.30
    }
  ],
  "edges": [
    {
      "source": "Klebsiella_pneumoniae",
      "target": "Enterobacter_cloacae",
      "weight": 0.3750,
      "jaccard": 0.5000,
      "shared_args": ["AAC(3)-IId", "APH(3'')-Ib", "APH(6)-Id", "BRP(MBL)", "CTX-M-55"]
    }
  ],
  "scc_groups": {
    "1": ["Klebsiella_pneumoniae", "Enterobacter_cloacae", "..."],
    "2": ["..."]
  },
  "precomputed": {
    "dijkstra_path": ["E_faecalis", "E_coli", "K_pneumoniae"],
    "dijkstra_distance": 2.847,
    "bfs_hops": { "E_faecalis": { "K_pneumoniae": 2, "A_baumannii": 3 } },
    "floyd_warshall_matrix": [[0, 1.2, ...], [...]],
    "greedy_removed": [["E_coli", "K_pneumoniae", 0.254], ...],
    "bnb_removed": [["E_coli", "K_pneumoniae", 0.254], ["S_enterica", "K_pneumoniae", 0.295]],
    "topological_order": ["tetM", "sul1", "blaTEM", "blaSHV", "aac6Ib", "blaCTXM", "blaOXA48", "blaNDM1", "mcr1"]
  }
}
```

All algorithm results are pre-computed from the C++ engine and embedded in the JSON. The frontend is a **viewer**, not a runner — it does not re-execute algorithms in JavaScript. This ensures results are identical to what the C++ engine produces.

---

## 10. Opening Screen

Before chapter 1, an introductory section occupies the first full scroll height of the narrative:

**Graph state:** All 16 nodes visible at 60% opacity, all edges at 30% opacity. No highlights. The graph is still — a specimen at rest.

**Narrative (opening section):**

```
TRACENET
Tracking Resistance Across Clinical Ecosystems with Networks

[Playfair Display Italic, 38px, --ink-primary]

A weighted directed graph of 16 bacterial species.
144 modelled transfer pathways.
Eight classical algorithms. One question:

[Lora, 20px, --ink-secondary]

If resistance enters here — where does it end up,
how does it travel, and what would stop it?

[Lora italic, 20px, --ink-primary]

Scroll to begin.

[Inter 12px, --ink-muted, letter-spacing 0.1em, with a small ↓ arrow]
```

The `↓` arrow pulses with a subtle `translateY` animation (0 → 4px → 0, 1.5s, infinite) to invite scrolling.

---

## 11. Closing Screen

After chapter 8, a final section:

**Graph state:** Full species graph returns. All nodes at full opacity. All edges visible. No algorithm highlights. The specimen at rest again — but the professor has now seen it from every analytical angle.

**Narrative:**
```
TraceNet demonstrated eight algorithms from four DAA syllabus units
through one coherent biological question.

BFS answered reachability.
SCC identified resistance bubbles.
Topological sort ordered gene acquisition.
Boyer-Moore confirmed sequence presence.
Dijkstra found the most probable spread path.
Floyd-Warshall mapped complete vulnerability.
Greedy approximated optimal containment.
Branch-and-bound proved it was suboptimal.

The graph is the same throughout.
The algorithms reveal different things.

[Inter 11px, --ink-muted]
Data source: CARD-R Prevalence v4.0.2 · 16 species · 144 directed edges
Jaccard × τ edge weights · −log(w) distances for Dijkstra & Floyd-Warshall
```

---

## 12. What This Is Not

- Not a dashboard. No persistent KPI cards, no live data feeds.
- Not a web app. No routing, no state management library, no API calls.
- Not interactive by default. Interaction surfaces only on demand.
- Not animated for animation's sake. Every motion communicates a step in an algorithm or a change in graph state.
- Not overwhelming. At any given moment, only one algorithm is highlighted. Everything else recedes.

---

*End of specification — TraceNet Frontend Design v1.0*
*Designed for: B.E. ISE DAA course project viva, RVCE Bengaluru*
*Stack: Vanilla JS + D3.js v7 + Google Fonts — zero build step*
