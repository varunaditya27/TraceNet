export function enter(data, G) {
  G.setChapterInfo('05 / 08 · Unit IV', "Dijkstra's Algorithm");
  G.hideInset();
  G.grayAllNodes(400);
  G.resetEdges(300);

  const { dijkstra } = data.algorithms;

  setTimeout(() => {
    G.animateDijkstra(dijkstra, dijkstra.highest_risk);
  }, 500);
}

export function exit(data, G) {}
