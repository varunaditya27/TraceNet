/**
 * main.js — Entry point for TraceNet frontend
 *
 * Loads data, initialises the D3 graph, and sets up IntersectionObserver
 * to dispatch enter/exit calls to chapter modules as the user scrolls.
 */

import { Graph } from './graph.js';
import * as intro  from './chapters/intro.js';
import * as ch1    from './chapters/ch1_bfs.js';
import * as ch2    from './chapters/ch2_scc.js';
import * as ch3    from './chapters/ch3_topo.js';
import * as ch4    from './chapters/ch4_bm.js';
import * as ch5    from './chapters/ch5_dijkstra.js';
import * as ch6    from './chapters/ch6_floyd.js';
import * as ch7    from './chapters/ch7_greedy.js';
import * as ch8    from './chapters/ch8_bnb.js';
import * as outro  from './chapters/outro.js';

const CHAPTERS = { intro, ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, outro };

let _data = null;
let _activeChapter = null;

function _showError(msg, detail) {
  const narrative = document.querySelector('#narrative');
  const box = document.createElement('div');
  box.style.cssText = 'padding:24px 28px;font-family:Inter,sans-serif;border-left:4px solid #c00;margin:20px;background:#fff5f5';
  const h = document.createElement('strong');
  h.style.cssText = 'display:block;color:#c00;font-size:14px;margin-bottom:6px';
  h.textContent = msg;
  const d = document.createElement('code');
  d.style.cssText = 'font-size:11px;color:#666;white-space:pre-wrap;display:block';
  d.textContent = detail || '';
  box.appendChild(h);
  if (detail) box.appendChild(d);
  narrative.prepend(box);
}

async function init() {
  // Guard: D3 must be loaded from CDN before this module runs
  if (typeof d3 === 'undefined') {
    _showError(
      'D3.js failed to load from CDN.',
      'Check your internet connection. The visualization requires D3 v7.\nFallback: download d3.min.js locally and update the <script> src in index.html.'
    );
    return;
  }

  try {
    const resp = await fetch('./data/hgt_graph.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`Server returned HTTP ${resp.status} for /data/hgt_graph.json`);
    _data = await resp.json();
  } catch (err) {
    console.error('TraceNet data load failed:', err);
    _showError(
      'Could not load graph data: ' + err.message,
      'Make sure you are serving from the frontend/ directory:\n  cd frontend && python3 -m http.server 8080\nThen open http://localhost:8080 (not via file://)'
    );
    return;
  }

  // Initialise D3 graph
  try {
    Graph.init(_data);
  } catch (err) {
    console.error('Graph initialisation failed:', err);
    _showError('Graph rendering failed: ' + err.message, err.stack);
    return;
  }

  // Close inset on button click
  document.getElementById('inset-close').addEventListener('click', () => {
    Graph.hideInset();
    Graph.undimForInset();
  });

  // Show intro chapter immediately (no scroll needed)
  _enterChapter('intro');

  // Set up IntersectionObserver within the narrative scroll container
  const narrative = document.getElementById('narrative');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const chId = entry.target.dataset.chapter;
        if (chId && chId !== _activeChapter) {
          _enterChapter(chId);
        }
      }
    });
  }, {
    root: narrative,
    // trigger when chapter crosses the middle 40% of the scroll window
    rootMargin: '-25% 0px -25% 0px',
    threshold: 0,
  });

  document.querySelectorAll('.chapter').forEach(el => observer.observe(el));
}

function _enterChapter(chId) {
  // Exit previous
  if (_activeChapter && CHAPTERS[_activeChapter]?.exit) {
    CHAPTERS[_activeChapter].exit(_data, Graph);
  }

  _activeChapter = chId;
  Graph.setActiveProgDot(chId);

  // Mark active section
  document.querySelectorAll('.chapter').forEach(el =>
    el.classList.toggle('active-chapter', el.dataset.chapter === chId)
  );

  // Enter new
  if (CHAPTERS[chId]?.enter) {
    CHAPTERS[chId].enter(_data, Graph);
  }
}

init();
