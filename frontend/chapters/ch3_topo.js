/**
 * ch3_topo.js — Kahn's topological sort on ARG dependency DAG
 * Renders the 10-node DAG in the inset panel and animates Kahn's algorithm.
 */

const DAG_W = 318;
const DAG_H = 220;
const NODE_H = 20;
const NODE_W = 62;

// Hand-tuned positions for a clean left-to-right DAG layout
const NODE_POS = {
  tetM:      { x: 14,  y: 20 },
  sul1:      { x: 14,  y: 60 },
  aac6Ib:   { x: 14,  y: 100 },
  vanA:      { x: 14,  y: 140 },
  blaTEM:    { x: 100, y: 40 },
  blaSHV:    { x: 180, y: 40 },
  blaCTXM:   { x: 254, y: 40 },
  blaOXA48:  { x: 254, y: 100 },
  blaNDM1:   { x: 254, y: 160 },
  mcr1:      { x: 254, y: 190 },
};

// Display labels for the node names used in arg_dag.txt
const DISPLAY = {
  tetM:     'tetM',      sul1:     'sul1',
  aac6Ib:   "aac(6')-Ib", vanA:   'vanA',
  blaTEM:   'blaTEM',    blaSHV:   'blaSHV',
  blaCTXM:  'blaCTX-M',  blaOXA48: 'blaOXA-48',
  blaNDM1:  'blaNDM-1',  mcr1:     'mcr-1',
};

function buildInset(topoData) {
  const { dag_nodes, dag_edges, order } = topoData;

  const container = document.createElement('div');
  container.id = 'dag-container';

  const svg = d3.select(container)
    .append('svg')
    .attr('id', 'dag-svg')
    .attr('viewBox', `0 0 ${DAG_W} ${DAG_H}`)
    .attr('width', '100%')
    .attr('height', DAG_H);

  svg.append('defs')
    .append('marker')
    .attr('id', 'dag-arrow')
    .attr('markerWidth', 7).attr('markerHeight', 7)
    .attr('refX', 5).attr('refY', 3)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,0.5 L0,5.5 L6,3 z')
    .attr('fill', '#999');

  const edgeG = svg.append('g').attr('id', 'dag-edges');
  const nodeG = svg.append('g').attr('id', 'dag-nodes');

  // Draw edges
  dag_edges.forEach(([si, ti]) => {
    const sName = dag_nodes[si], tName = dag_nodes[ti];
    const sp = NODE_POS[sName], tp = NODE_POS[tName];
    if (!sp || !tp) return;
    const x1 = sp.x + NODE_W, y1 = sp.y + NODE_H / 2;
    const x2 = tp.x, y2 = tp.y + NODE_H / 2;
    edgeG.append('line')
      .attr('class', 'dag-edge')
      .attr('id', `dag-e-${si}-${ti}`)
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('marker-end', 'url(#dag-arrow)');
  });

  // Draw nodes
  dag_nodes.forEach((name, idx) => {
    const pos = NODE_POS[name];
    if (!pos) return;
    const g = nodeG.append('g')
      .attr('class', 'dag-node')
      .attr('id', `dag-n-${name}`)
      .attr('transform', `translate(${pos.x},${pos.y})`);

    g.append('rect')
      .attr('width', NODE_W)
      .attr('height', NODE_H)
      .attr('fill', '#c8c3bb')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('rx', 3);

    g.append('text')
      .attr('class', 'dag-label')
      .attr('x', NODE_W / 2)
      .attr('y', NODE_H / 2)
      .text(DISPLAY[name] || name);
  });

  // Animate Kahn's sequence
  const orderColors = d3.scaleSequential()
    .domain([0, order.length - 1])
    .interpolator(d3.interpolateRgb('#c4950a', '#1e3a5f'));

  order.forEach((name, step) => {
    setTimeout(() => {
      d3.select(`#dag-n-${name}`).select('rect')
        .transition().duration(350)
        .attr('fill', orderColors(step))
        .attr('stroke', orderColors(step));
      // highlight outgoing edges from this node
      const si = dag_nodes.indexOf(name);
      dag_edges.forEach(([s, t]) => {
        if (s === si) {
          d3.select(`#dag-e-${s}-${t}`)
            .transition().delay(200).duration(300)
            .attr('stroke', '#c4950a')
            .attr('stroke-width', 1.8);
        }
      });
    }, 600 + step * 380);
  });

  return container;
}

export function enter(data, G) {
  G.setChapterInfo('03 / 08 · Unit II', "Kahn's Topological Sort");
  G.dimForInset(400);

  const container = buildInset(data.algorithms.topo_sort);
  G.showInset('ARG Dependency DAG', container);
}

export function exit(data, G) {
  G.hideInset();
  G.undimForInset(300);
}
