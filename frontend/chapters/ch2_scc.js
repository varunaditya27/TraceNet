export function enter(data, G) {
  G.setChapterInfo('02 / 08 · Unit II', 'Kosaraju SCC');
  G.hideInset();
  G.grayAllNodes(300);

  setTimeout(() => {
    G.animateSCC(data.algorithms.scc);
  }, 400);
}

export function exit(data, G) {}
