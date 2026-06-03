export function enter(data, G) {
  G.setChapterInfo('01 / 08 · Unit II', 'Breadth-First Search');
  G.hideInset();
  G.grayAllNodes(400);
  G.resetEdges(400);

  setTimeout(() => {
    G.animateBFS(data.algorithms.bfs, null);
  }, 500);
}

export function exit(data, G) {}
