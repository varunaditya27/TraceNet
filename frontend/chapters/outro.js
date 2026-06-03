export function enter(data, G) {
  G.setChapterInfo('Summary', 'Eight Algorithms, One Network');
  G.hideInset();
  G.resetNodes(600);
  G.resetEdges(500);

  // Gentle final state: role colors + weight-proportional edge opacity
  setTimeout(() => {
    d3.select('#edges-layer').selectAll('line.edge')
      .transition().duration(700)
      .attr('opacity', d => 0.05 + d.weight * 0.14)
      .attr('stroke', 'rgba(0,0,0,0.12)')
      .attr('stroke-dasharray', null);
  }, 400);
}

export function exit(data, G) {}
