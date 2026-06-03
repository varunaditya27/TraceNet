export function enter(data, G) {
  G.setChapterInfo('07 / 08 · Unit IV', 'Greedy Containment');
  G.hideInset();

  const { greedy_contain, bnb_contain } = data.algorithms;

  // Use hospital subgraph node indices mapped to main graph
  // sources = E. faecalis (14), C. jejuni (15) in main graph
  // targets = E. faecium (3), S. aureus (4)
  const sources = greedy_contain.sources;   // [14, 15]
  const targets = greedy_contain.targets;   // [3, 4]

  G.animateGreedy(
    greedy_contain.removed_edges,
    sources,
    targets,
    null
  );
}

export function exit(data, G) {}
