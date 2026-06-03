/**
 * graph.js — D3 SVG graph rendering and animation API
 *
 * Exports a single Graph object. All chapter modules call Graph methods
 * to animate the visualization. The SVG elements are created once at init
 * and updated in-place via D3 transitions.
 */

export const Graph = {
  data: null,
  svg: null,
  _edges: null,
  _nodes: null,
  _labels: null,
  _edgeMap: null,   // "src-tgt" → d3 selection
  _nodeMap: null,   // id → d3 selection
  _xScale: null,
  _yScale: null,
  _nodeR: 20,

  // ── Initialization ─────────────────────────────────────────────

  init(data) {
    this.data = data;
    this.svg = d3.select('#graph-svg');

    // Build coordinate scales from NODE_META ranges to SVG viewBox
    this._xScale = d3.scaleLinear().domain([110, 1020]).range([80, 1140]);
    this._yScale = d3.scaleLinear().domain([110, 620]).range([45, 595]);

    this._buildEdges();
    this._buildNodes();
    this._buildLabels();
    this._buildEdgeMap();
    this._buildNodeMap();
  },

  _px(n) { return this._xScale(n.x); },
  _py(n) { return this._yScale(n.y); },

  // shorten endpoint to circle boundary
  _edgeEndpoints(src, tgt, r) {
    const x1 = this._px(src), y1 = this._py(src);
    const x2 = this._px(tgt), y2 = this._py(tgt);
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ox = (dx / dist) * (r + 4);
    const oy = (dy / dist) * (r + 4);
    return { x1: x1 + ox, y1: y1 + oy, x2: x2 - ox, y2: y2 - oy };
  },

  _buildEdges() {
    const edgesLayer = this.svg.select('#edges-layer');
    const nodes = this.data.nodes;

    this._edges = edgesLayer
      .selectAll('line.edge')
      .data(this.data.edges)
      .join('line')
      .attr('class', 'edge')
      .each((d, i, els) => {
        const src = nodes[d.src], tgt = nodes[d.tgt];
        const ep = this._edgeEndpoints(src, tgt, this._nodeR);
        d3.select(els[i])
          .attr('x1', ep.x1).attr('y1', ep.y1)
          .attr('x2', ep.x2).attr('y2', ep.y2)
          .attr('data-src', d.src)
          .attr('data-tgt', d.tgt);
      })
      .attr('stroke', 'rgba(0,0,0,0.07)')
      .attr('stroke-width', d => 0.4 + d.weight * 1.2);
  },

  _buildNodes() {
    const nodesLayer = this.svg.select('#nodes-layer');
    const nodes = this.data.nodes;

    const g = nodesLayer
      .selectAll('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${this._px(d)},${this._py(d)})`);

    // outer ring for gram+ indicator
    g.append('circle')
      .attr('class', d => `node-ring ${d.gram === 'positive' ? 'gram-pos' : 'gram-neg'}`)
      .attr('r', this._nodeR + 4)
      .attr('fill', 'none')
      .attr('stroke', d => d.gram === 'positive' ? 'rgba(0,0,0,0.2)' : 'none')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d.gram === 'positive' ? '4 3' : 'none');

    g.append('circle')
      .attr('class', 'node-circle')
      .attr('r', this._nodeR)
      .attr('fill', d => this._roleColor(d.role))
      .attr('stroke', d => this._roleColor(d.role))
      .attr('stroke-width', 2);

    this._nodes = nodesLayer.selectAll('g.node');
  },

  _buildLabels() {
    const labelsLayer = this.svg.select('#labels-layer');
    const nodes = this.data.nodes;

    this._labels = labelsLayer
      .selectAll('text.node-label')
      .data(nodes)
      .join('text')
      .attr('class', 'node-label')
      .attr('x', d => this._px(d))
      .attr('y', d => this._py(d) + this._nodeR + 11)
      .text(d => d.short);
  },

  _buildEdgeMap() {
    this._edgeMap = {};
    this.svg.selectAll('line.edge').each((d, i, els) => {
      this._edgeMap[`${d.src}-${d.tgt}`] = d3.select(els[i]);
    });
  },

  _buildNodeMap() {
    this._nodeMap = {};
    this._nodes.each((d, i, els) => {
      this._nodeMap[d.id] = d3.select(els[i]);
    });
  },

  _roleColor(role) {
    const c = { eskape: '#8b1a1a', bridge: '#1e3a5f', environmental: '#2d6a4f' };
    return c[role] || '#bbb';
  },

  // ── Chapter metadata ──────────────────────────────────────────────

  setChapterInfo(tag, title) {
    d3.select('#chapter-tag').text(tag);
    d3.select('#chapter-title-display').text(title);
  },

  setActiveProgDot(chId) {
    d3.selectAll('.prog-dot').classed('active', false);
    d3.select(`.prog-dot[data-ch="${chId}"]`).classed('active', true);
  },

  // ── Reset helpers ─────────────────────────────────────────────────

  resetNodes(duration = 500) {
    this._nodes.selectAll('circle.node-circle')
      .transition().duration(duration)
      .attr('fill', d => this._roleColor(d.role))
      .attr('stroke', d => this._roleColor(d.role))
      .attr('stroke-width', 2)
      .attr('opacity', 1)
      .attr('filter', null);
    return this;
  },

  grayAllNodes(duration = 400) {
    this._nodes.selectAll('circle.node-circle')
      .transition().duration(duration)
      .attr('fill', '#c8c3bb')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1.5);
    return this;
  },

  resetEdges(duration = 400) {
    this._edges
      .transition().duration(duration)
      .attr('stroke', 'rgba(0,0,0,0.07)')
      .attr('stroke-width', d => 0.4 + d.weight * 1.2)
      .attr('stroke-dasharray', null)
      .attr('opacity', 1)
      .attr('marker-end', null);
    return this;
  },

  fadeEdgesExcept(pairs, duration = 300) {
    const set = new Set(pairs.map(([s, t]) => `${s}-${t}`));
    this._edges.transition().duration(duration)
      .attr('opacity', d => set.has(`${d.src}-${d.tgt}`) ? 1 : 0.04);
    return this;
  },

  // ── Node highlighting ─────────────────────────────────────────────

  highlightNode(id, fill, stroke, filter, duration = 350) {
    const g = this._nodeMap[id];
    if (!g) return;
    g.select('circle.node-circle')
      .transition().duration(duration)
      .attr('fill', fill)
      .attr('stroke', stroke || fill)
      .attr('stroke-width', 2.5)
      .attr('filter', filter || null);
  },

  highlightNodeSet(ids, fill, filter, duration = 350) {
    ids.forEach(id => this.highlightNode(id, fill, fill, filter, duration));
    return this;
  },

  // ── Edge highlighting ─────────────────────────────────────────────

  highlightEdge(src, tgt, stroke, width, marker, duration = 350) {
    const e = this._edgeMap[`${src}-${tgt}`];
    if (!e) return;
    e.transition().duration(duration)
      .attr('stroke', stroke)
      .attr('stroke-width', width || 2.5)
      .attr('opacity', 1)
      .attr('marker-end', marker || null);
  },

  highlightEdgeSet(pairs, stroke, width, duration = 350) {
    pairs.forEach(([s, t]) => this.highlightEdge(s, t, stroke, width, null, duration));
    return this;
  },

  // ── BFS Animation ─────────────────────────────────────────────────

  animateBFS(bfsData, onDone) {
    const { distances, parent } = bfsData;
    const maxDist = Math.max(...distances.filter(d => d >= 0));

    // group by distance
    const byDist = {};
    distances.forEach((d, i) => {
      if (d >= 0) (byDist[d] = byDist[d] || []).push(i);
    });

    // unreachable nodes
    const unreachable = distances.map((d, i) => d === -1 ? i : null).filter(i => i !== null);

    this.grayAllNodes(300);
    this.resetEdges(300);

    // fade all edges low
    this._edges.transition().delay(200).duration(300)
      .attr('opacity', 0.04);

    let delay = 400;

    for (let dist = 0; dist <= maxDist; dist++) {
      const ids = byDist[dist] || [];
      const fill = dist === 0 ? '#8b1a1a' : dist === 1 ? '#e07b20' : '#c4950a';
      const filter = dist === 0 ? 'url(#glow-lg)' : 'url(#glow-sm)';

      ids.forEach((id, idx) => {
        setTimeout(() => {
          this.highlightNode(id, fill, fill, filter, 350);
          // show BFS tree edge
          if (parent[id] >= 0) {
            const p = parent[id];
            const e = this._edgeMap[`${p}-${id}`];
            if (e) e.transition().duration(400)
              .attr('stroke', '#c4950a')
              .attr('stroke-width', 2)
              .attr('opacity', 0.85)
              .attr('marker-end', 'url(#arr-gold)');
          }
        }, delay + idx * 80);
      });
      delay += ids.length * 80 + 200;
    }

    // dim unreachable with dashed border
    setTimeout(() => {
      unreachable.forEach(id => {
        const g = this._nodeMap[id];
        if (g) g.select('circle.node-circle')
          .transition().duration(300)
          .attr('fill', '#ddd')
          .attr('stroke', '#bbb')
          .attr('stroke-dasharray', '5,3');
      });
      if (onDone) onDone();
    }, delay + 200);
  },

  // ── SCC Animation ─────────────────────────────────────────────────

  animateSCC(sccData) {
    const { groups, component_of } = sccData;

    this.resetEdges(300);
    this.grayAllNodes(200);

    // groups[0] = Gram-positive cluster (4 nodes), groups[1] = Gram-negative (12 nodes)
    const compColors = ['#8b1a1a', '#1e3a5f'];
    const compNames  = ['Component A — 12 Gram− species', 'Component B — 4 Gram+ species'];

    const totalNodes = groups.reduce((s, g) => s + g.length, 0);

    groups.forEach((group, ci) => {
      setTimeout(() => {
        group.forEach((id, idx) => {
          setTimeout(() => {
            this.highlightNode(id, compColors[ci], compColors[ci], 'url(#glow-sm)', 400);
          }, idx * 60);
        });
      }, ci * 1400);
    });

    // Single-pass edge coloring after all node animations finish
    setTimeout(() => {
      this._edges.each((d, i, els) => {
        if (component_of[d.src] === component_of[d.tgt]) {
          const ci2 = component_of[d.src];
          d3.select(els[i])
            .transition().duration(400)
            .attr('stroke', compColors[ci2])
            .attr('opacity', 0.20)
            .attr('stroke-width', d.weight * 2);
        } else {
          d3.select(els[i]).transition().duration(400).attr('opacity', 0.02);
        }
      });
    }, groups.length * 1400 + totalNodes * 30 + 300);
  },

  // ── Dijkstra Animation ────────────────────────────────────────────

  animateDijkstra(dijkData, highlightPair) {
    const { distances, parent } = dijkData;
    const INF = Infinity;

    this.grayAllNodes(300);
    this.resetEdges(200);
    this._edges.transition().delay(150).duration(300).attr('opacity', 0.04);

    // Sort reachable nodes by distance
    const reachable = distances
      .map((d, i) => ({ id: i, dist: d }))
      .filter(x => x.dist !== null && x.dist < 1e9)
      .sort((a, b) => a.dist - b.dist);

    // color ramp: gold (close) → navy (far)
    const maxDist = Math.max(...reachable.map(x => x.dist));
    const colorScale = d3.scaleSequential()
      .domain([0, maxDist])
      .interpolator(d3.interpolateRgb('#c4950a', '#1e3a5f'));

    let delay = 300;
    reachable.forEach(({ id, dist }, idx) => {
      setTimeout(() => {
        const fill = colorScale(dist);
        this.highlightNode(id, fill, fill, 'url(#glow-sm)', 400);
        if (parent[id] >= 0) {
          this.highlightEdge(parent[id], id, '#c4950a', 2, 'url(#arr-gold)', 400);
        }
      }, delay + idx * 60);
    });

    // Highlight the highest-risk pair after settling
    if (highlightPair) {
      const totalDelay = delay + reachable.length * 60 + 600;
      setTimeout(() => {
        const { src, tgt } = highlightPair;
        this.highlightNode(src, '#8b1a1a', '#8b1a1a', 'url(#glow-lg)', 500);
        this.highlightNode(tgt, '#2d6a4f', '#2d6a4f', 'url(#glow-lg)', 500);
        this.highlightEdge(src, tgt, '#8b1a1a', 3.5, 'url(#arr-crimson)', 500);
        this.highlightEdge(tgt, src, '#8b1a1a', 3.5, 'url(#arr-crimson)', 500);
      }, totalDelay);
    }
  },

  // ── Floyd-Warshall visualization ──────────────────────────────────
  // (handled in chapter module — graph just dims to background)

  dimForInset(duration = 400) {
    this._nodes.selectAll('circle.node-circle')
      .transition().duration(duration)
      .attr('opacity', 0.4);
    this._edges.transition().duration(duration).attr('opacity', 0.03);
    this._labels.transition().duration(duration).attr('opacity', 0.4);
    return this;
  },

  undimForInset(duration = 400) {
    this._nodes.selectAll('circle.node-circle')
      .transition().duration(duration).attr('opacity', 1);
    this._edges.transition().duration(duration)
      .attr('opacity', d => 0.04 + d.weight * 0.15);
    this._labels.transition().duration(duration).attr('opacity', 1);
    return this;
  },

  // ── Greedy Containment Animation ──────────────────────────────────

  animateGreedy(removedEdges, sources, targets, onDone) {
    // Highlight sources and targets first
    this.resetEdges(400);
    this.grayAllNodes(400);

    setTimeout(() => {
      // sources = env reservoirs (green), targets = ESKAPE (crimson)
      sources.forEach(id => this.highlightNode(id, '#2d6a4f', '#2d6a4f', 'url(#glow-sm)', 400));
      targets.forEach(id => this.highlightNode(id, '#8b1a1a', '#8b1a1a', 'url(#glow-sm)', 400));
    }, 500);

    // Batch-animate removal (group into 8 batches for visual clarity)
    const batchSize = Math.ceil(removedEdges.length / 8);
    let delay = 1000;

    for (let b = 0; b < 8; b++) {
      const batch = removedEdges.slice(b * batchSize, (b + 1) * batchSize);
      setTimeout(() => {
        batch.forEach(({ src, tgt }) => {
          const e = this._edgeMap[`${src}-${tgt}`];
          if (e) e.transition().duration(200)
            .attr('stroke', '#cc3333')
            .attr('stroke-dasharray', '4 3')
            .attr('opacity', 0.35)
            .attr('stroke-width', 1);
        });
      }, delay + b * 300);
    }

    setTimeout(() => { if (onDone) onDone(); }, delay + 8 * 300 + 400);
  },

  // ── B&B hospital subgraph (rendered via inset) ────────────────────

  // Main graph: highlight only the hospital nodes
  highlightHospitalNodes(hospNodeNames) {
    this.grayAllNodes(400);
    this.resetEdges(300);
    this._edges.transition().delay(200).duration(300).attr('opacity', 0.03);

    const mainNodes = this.data.nodes;
    mainNodes.forEach((n, id) => {
      if (hospNodeNames.includes(n.name)) {
        const color = n.role === 'environmental' ? '#2d6a4f'
          : n.role === 'eskape' ? '#8b1a1a' : '#1e3a5f';
        this.highlightNode(id, color, color, 'url(#glow-sm)', 500);
      }
    });
  },

  // ── Inset panel management ────────────────────────────────────────

  showInset(title, contentNode) {
    d3.select('#inset-title').text(title);
    const body = document.getElementById('inset-body');
    body.replaceChildren(contentNode);
    d3.select('#inset-panel').classed('hidden', false);
  },

  hideInset() {
    d3.select('#inset-panel').classed('hidden', true);
    setTimeout(() => {
      document.getElementById('inset-body').replaceChildren();
    }, 350);
  },
};
