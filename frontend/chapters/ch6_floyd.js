/**
 * ch6_floyd.js — Floyd-Warshall all-pairs distance matrix heatmap
 *
 * Renders a 16×16 heatmap in the inset panel.
 * Cells colored by -log(w) distance:
 *   close → red, far → steel blue, unreachable → #111, diagonal → white.
 */

const CELL = 15;  // px per cell
const MARGIN = { top: 22, left: 22, right: 4, bottom: 4 };

// Short 3-char abbreviations for axis labels
const SHORT3 = [
  'Kpn','Ecl','Pae','Efa','Sau','Aba',
  'Eco','Sen','Kox','Cfr','Pmi','Sma',
  'Api','Ppu','Efs','Cje',
];

function buildInset(fwData) {
  const { dist_matrix, vulnerability_scores, most_vulnerable } = fwData;
  const n = dist_matrix.length;

  // Determine color scale bounds (ignore nulls and zeros)
  const vals = dist_matrix.flat().filter(v => v !== null && v > 0);
  const maxVal = d3.max(vals) || 4;
  const colorScale = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateRgb('#b91c1c', '#1e40af'));

  const svgW = MARGIN.left + n * CELL + MARGIN.right;
  const svgH = MARGIN.top  + n * CELL + MARGIN.bottom;

  const container = document.createElement('div');
  container.id = 'matrix-container';

  const svg = d3.select(container)
    .append('svg')
    .attr('id', 'matrix-svg')
    .attr('viewBox', `0 0 ${svgW} ${svgH}`)
    .attr('width', '100%')
    .attr('height', svgH)
    .style('display', 'block');

  // Draw cells
  const cellG = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const val = dist_matrix[i][j];
      let fill;
      if (i === j)        fill = '#fff';
      else if (val === null) fill = '#111';
      else                fill = colorScale(val);

      const x = j * CELL, y = i * CELL;

      cellG.append('rect')
        .attr('class', 'matrix-cell')
        .attr('x', x).attr('y', y)
        .attr('width', CELL - 1).attr('height', CELL - 1)
        .attr('fill', fill)
        .attr('opacity', 0)
        .transition()
        .delay((i * n + j) * 4)
        .duration(120)
        .attr('opacity', 1);

      // Highlight most-vulnerable column
      if (j === most_vulnerable && val !== null && i !== j) {
        cellG.append('rect')
          .attr('x', x).attr('y', y)
          .attr('width', CELL - 1).attr('height', CELL - 1)
          .attr('fill', 'none')
          .attr('stroke', '#c4950a')
          .attr('stroke-width', 0.8)
          .attr('pointer-events', 'none');
      }
    }
  }

  // Row axis labels (short species names)
  SHORT3.forEach((lbl, i) => {
    svg.append('text')
      .attr('class', 'matrix-axis-label')
      .attr('x', MARGIN.left - 2)
      .attr('y', MARGIN.top + i * CELL + CELL / 2 + 2)
      .attr('text-anchor', 'end')
      .text(lbl);
  });

  // Column axis labels (rotated)
  SHORT3.forEach((lbl, j) => {
    svg.append('text')
      .attr('class', 'matrix-axis-label')
      .attr('transform',
        `translate(${MARGIN.left + j * CELL + CELL / 2},${MARGIN.top - 3}) rotate(-60)`)
      .attr('text-anchor', 'start')
      .text(lbl);
  });

  // Legend
  const legendG = svg.append('g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top + n * CELL + 4})`);

  const gradient = legendG.append('defs').append('linearGradient')
    .attr('id', 'fw-grad')
    .attr('x1', '0%').attr('x2', '100%');
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#b91c1c');
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#1e40af');

  legendG.append('rect')
    .attr('width', n * CELL).attr('height', 5)
    .attr('fill', 'url(#fw-grad)');

  return container;
}

export function enter(data, G) {
  G.setChapterInfo('06 / 08 · Unit IV', 'Floyd-Warshall');
  G.dimForInset(400);

  const container = buildInset(data.algorithms.floyd_warshall);
  G.showInset('All-Pairs Vulnerability Matrix', container);
}

export function exit(data, G) {
  G.hideInset();
  G.undimForInset(300);
}
