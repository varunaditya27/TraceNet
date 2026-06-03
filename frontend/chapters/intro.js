export function enter(data, G) {
  G.setChapterInfo('Introduction', 'The Resistance Network');
  G.resetNodes(500);
  G.resetEdges(500);

  // Show role colors with gentle glow on ESKAPE nodes
  setTimeout(() => {
    data.nodes.forEach(n => {
      if (n.role === 'eskape') {
        G.highlightNode(n.id, '#8b1a1a', '#8b1a1a', 'url(#glow-sm)', 600);
      }
    });
    // Edge opacity varies by weight
    d3.select('#edges-layer').selectAll('line.edge')
      .transition().duration(600)
      .attr('opacity', d => 0.05 + d.weight * 0.12);
  }, 300);
}

export function exit(data, G) {
  // nothing — next chapter handles its own reset
}
