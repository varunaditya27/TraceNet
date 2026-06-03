/**
 * ch4_bm.js — Boyer-Moore bad-character heuristic demonstration
 *
 * Builds a DNA strip inset showing:
 *   - a text row of characters
 *   - a sliding pattern row
 *   - animated alignment steps with mismatch highlighting
 * Uses synthetic text based on the real BM result statistics.
 */

// Generate a synthetic but realistic DNA demo sequence
// (real sequence is 813bp; we show first 50 chars with embedded pattern)
const DNA_ALPHA = 'ATCG';

function rndDNA(len, seed) {
  let s = '';
  for (let i = 0; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    s += DNA_ALPHA[(seed >>> 0) % 4];
  }
  return s;
}

const PATTERN_DEMO = 'ATGGATTCGGGCAGATCGAT';  // 20-char illustrative NDM-1 primer
const PREFIX = rndDNA(5, 42);
const SUFFIX = rndDNA(25 - PATTERN_DEMO.length, 99);
const DEMO_TEXT = PREFIX + PATTERN_DEMO + SUFFIX + rndDNA(25, 77);
const TEXT_VISIBLE = 50; // chars shown

// Compute simple BM steps on DEMO_TEXT/PATTERN_DEMO for animation
function computeBMSteps(text, pat) {
  const n = text.length, m = pat.length;
  const badChar = {};
  for (let i = 0; i < m; i++) badChar[pat[i]] = i;

  const steps = [];
  let s = 0;
  while (s <= n - m && steps.length < 12) {
    let j = m - 1, mismatchAt = -1, mismatchChar = '';
    while (j >= 0) {
      if (pat[j] !== text[s + j]) {
        mismatchAt = j;
        mismatchChar = text[s + j];
        break;
      }
      j--;
    }
    if (j < 0) {
      steps.push({ pos: s, isMatch: true, skip: 1 });
      s += 1;
    } else {
      const bc = badChar[mismatchChar] ?? -1;
      const skip = Math.max(1, j - bc);
      steps.push({ pos: s, isMatch: false, mismatchAt, mismatchChar, skip });
      s += skip;
    }
  }
  return steps;
}

function buildInset(bmData) {
  const container = document.createElement('div');
  container.id = 'bm-container';

  // Stat line
  const stats = document.createElement('div');
  stats.className = 'bm-stats';

  const s1 = document.createElement('div');
  s1.className = 'bm-counter';
  s1.textContent = 'BM comparisons: ';
  const v1 = document.createElement('span');
  v1.textContent = bmData.comparisons_bm.toLocaleString();
  s1.appendChild(v1);

  const s2 = document.createElement('div');
  s2.className = 'bm-counter';
  s2.textContent = 'Naive: ';
  const v2 = document.createElement('span');
  v2.textContent = bmData.comparisons_naive.toLocaleString();
  s2.appendChild(v2);

  const s3 = document.createElement('div');
  s3.className = 'bm-counter';
  s3.textContent = 'Speedup: ';
  const v3 = document.createElement('span');
  v3.textContent = bmData.speedup + '×';
  s3.appendChild(v3);

  stats.appendChild(s1);
  stats.appendChild(s2);
  stats.appendChild(s3);
  container.appendChild(stats);

  // Track area
  const track = document.createElement('div');
  track.id = 'bm-track';
  container.appendChild(track);

  // Build text row
  const textRow = document.createElement('div');
  textRow.className = 'bm-text-row';
  const chars = [];
  for (let i = 0; i < TEXT_VISIBLE; i++) {
    const span = document.createElement('span');
    span.className = 'bm-char';
    span.textContent = DEMO_TEXT[i] || '';
    textRow.appendChild(span);
    chars.push(span);
  }
  track.appendChild(textRow);

  // Pattern row
  const patRow = document.createElement('div');
  patRow.className = 'bm-pattern-row';
  const patChars = [];
  for (let j = 0; j < PATTERN_DEMO.length; j++) {
    const span = document.createElement('span');
    span.className = 'bm-pat-char';
    span.textContent = PATTERN_DEMO[j];
    patRow.appendChild(span);
    patChars.push(span);
  }
  track.appendChild(patRow);

  // Caption
  const cap = document.createElement('div');
  cap.style.cssText = 'font-family:Inter,sans-serif;font-size:10px;color:#888;padding:4px 2px 0';
  cap.textContent = `Pattern: ${PATTERN_DEMO.slice(0, 12)}… (30bp NDM-1 primer demo)`;
  container.appendChild(cap);

  // Animate steps
  const steps = computeBMSteps(DEMO_TEXT, PATTERN_DEMO);
  const CHAR_W = 13; // px per character (12px + 1px gap)
  let delay = 400;

  steps.forEach(step => {
    setTimeout(() => {
      // Move pattern row
      patRow.style.left = `${8 + step.pos * CHAR_W}px`;

      // Reset char highlights
      chars.forEach(c => { c.className = 'bm-char'; });
      patChars.forEach(c => { c.style.background = 'rgba(30,58,95,0.15)'; c.style.color = '#1e3a5f'; });

      if (step.isMatch) {
        // Highlight match
        for (let i = step.pos; i < step.pos + PATTERN_DEMO.length && i < TEXT_VISIBLE; i++) {
          if (chars[i]) chars[i].className = 'bm-char match';
        }
        patChars.forEach(c => { c.style.background = '#d1fae5'; c.style.color = '#065f46'; });
      } else {
        // Highlight mismatch position
        const ti = step.pos + step.mismatchAt;
        if (chars[ti]) chars[ti].className = 'bm-char mismatch';
        if (patChars[step.mismatchAt]) {
          patChars[step.mismatchAt].style.background = '#fee2e2';
          patChars[step.mismatchAt].style.color = '#991b1b';
        }
      }
    }, delay);
    delay += step.isMatch ? 900 : 450;
  });

  return container;
}

export function enter(data, G) {
  G.setChapterInfo('04 / 08 · Unit III', 'Boyer-Moore');
  G.dimForInset(400);

  const container = buildInset(data.algorithms.boyer_moore);
  G.showInset('Boyer-Moore — NDM-1 Pattern Search', container);
}

export function exit(data, G) {
  G.hideInset();
  G.undimForInset(300);
}
