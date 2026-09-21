import { generate, balanceShifts, DEFAULT_SHIFTS, VECTORS, belongsToLine } from './pentagrid.js';
import { createAnimationControls } from './animation-controls.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const palettes = { poster: ['#e98576', '#97cbe7', '#ffffff'], mono: ['#c4c4c4', '#fafafa', '#ffffff'], lagoon: ['#77aaa0', '#e8d6a9', '#f0f1e8'], clay: ['#be7461', '#ecc6af', '#f5ede3'], ink: ['#52646c', '#dbe0db', '#f0f1ed'], iris: ['#8586b7', '#d5c5df', '#eeedf3'] };
const familyColors = ['#507da8', '#6e92b5', '#8395ba', '#657f9e', '#8b9baf'];
const presets = { original: DEFAULT_SHIFTS, rosette: balanceShifts([.19, .19, .19, .19]), ribbons: balanceShifts([-.42, .28, -.11, .37]), singular: [0, 0, 0, 0, 0] };
const state = { shifts: [...DEFAULT_SHIFTS], radius: 7, palette: 'poster', edges: true, view: 'tiling' };
let activeFamily = null, shiftTimer;
let data, selected, frame, camera = { x: 0, y: 0, size: 42 };
let animation, animationCamera;
let selectedLine = null;

function svgElement(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.append(el);
  return el;
}
function loadLink() {
  try {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.size) return;
    const g = params.get('g')?.split(',').map(Number);
    if (g?.length === 4 && g.every(v => Number.isFinite(v) && Math.abs(v) <= 1)) state.shifts = balanceShifts(g);
    const r = Number(params.get('r'));
    if (Number.isInteger(r) && r >= 3 && r <= 15) state.radius = r;
    if (palettes[params.get('p')]) state.palette = params.get('p');
    if (['tiling', 'both', 'grid'].includes(params.get('v'))) state.view = params.get('v');
    state.edges = params.get('e') !== '0';
  } catch { /* Invalid links fall back to a usable default. */ }
}
function syncControls() {
  state.shifts.slice(0, 4).forEach((v, j) => { $(`gamma${j}`).value = v; $(`gamma-value${j}`).value = v.toFixed(3); });
  $('shift4').value = state.shifts[4].toFixed(3);
  $('radius').value = state.radius; $('radius-value').value = state.radius;
  $('palette').value = state.palette; $('edges').checked = state.edges;
  $('preset').value = Object.keys(presets).find(key => presets[key].every((v, j) => Math.abs(v - state.shifts[j]) < 1e-9)) || 'custom';
  $('stages').dataset.view = state.view;
  document.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === state.view));
}
function applyCamera() {
  $('tiling').setAttribute('viewBox', `${camera.x - camera.size / 2} ${camera.y - camera.size / 2} ${camera.size} ${camera.size}`);
}
function patchSize() {
  return Math.max(state.radius * 5 + 6, selected ? 2.3 * Math.max(...selected.points.flatMap(p => p.map(Math.abs))) : 0);
}
function fit() { camera = { x: 0, y: 0, size: patchSize() }; applyCamera(); }
function setMessage(text) { $('message').textContent = text; }
function regenerate() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    try {
      const selectedId = selected?.id;
      data = generate({ ...state, trackedCrossing: selected });
      selected = data.tiles.find(tile => tile.id === selectedId) || null;
      if (selected) {
        const extent = Math.max(...selected.points.flatMap(([x, y]) => [Math.abs(x - camera.x), Math.abs(-y - camera.y)]));
        camera.size = Math.max(camera.size, extent * 2.3);
      }
      render();
    } catch (error) { setMessage(error.message); }
  });
}
function render() {
  const [thick, thin, background] = palettes[state.palette];
  document.documentElement.style.setProperty('--thick', thick);
  document.documentElement.style.setProperty('--thin', thin);
  $('stages').style.background = background;
  const svg = $('tiling'); svg.replaceChildren();
  const group = svgElement('g', { transform: 'scale(1,-1)' }, svg);
  for (const tile of data.tiles) {
    const el = svgElement('polygon', { points: tile.points.map(p => p.join(',')).join(' '), fill: tile.type === 'thick' ? thick : thin, stroke: state.edges ? '#222222' : 'none', 'stroke-width': '.65', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke', 'data-id': tile.id }, group);
    svgElement('title', {}, el).textContent = `${tile.type === 'thick' ? 'Thick' : 'Thin'} rhombus · grids ${tile.r}, ${tile.s}`;
  }
  renderGrid();
  $('total').textContent = data.tiles.length.toLocaleString();
  $('thick').textContent = data.thick.toLocaleString();
  $('thin').textContent = data.thin.toLocaleString();
  $('ratio').textContent = (data.thick / data.thin).toFixed(3);
  $('singular-note').hidden = !data.regularized;
  $('singular-note').textContent = 'These shifts create a singular grid in this patch (three or more lines meet). A tiny, deterministic, zero-sum shift resolves the ambiguity. Effective γ = [' + data.effectiveShifts.map(n => n.toFixed(9)).join(', ') + ']. JSON exports include these effective shifts.';
  $('status').textContent = data.regularized ? 'Singular grid resolved' : 'Regular grid in this patch';
  $('inspect').textContent = 'Select a rhombus to reveal its grid crossing and five-dimensional coordinates.';
  if (selected) inspect(selected);
  if (selectedLine) highlightRibbon();
  animation?.setTiles(data.tiles, selected?.id);
  applyCamera();
}
function renderGrid() {
  const svg = $('grid'), radius = Math.max(state.radius + 1, selected ? Math.hypot(...selected.crossing) + 1 : 0);
  svg.replaceChildren(); svg.setAttribute('viewBox', `${-radius} ${-radius} ${2 * radius} ${2 * radius}`);
  const g = svgElement('g', { transform: 'scale(1,-1)' }, svg);
  const extent = 2 * radius;
  VECTORS.forEach(([vx, vy], j) => {
    for (let k = Math.ceil(data.effectiveShifts[j] - extent); k <= Math.floor(data.effectiveShifts[j] + extent); k++) {
      const d = k - data.effectiveShifts[j];
      svgElement('line', { x1: d * vx - vy * extent, y1: d * vy + vx * extent, x2: d * vx + vy * extent, y2: d * vy - vx * extent, stroke: familyColors[j], 'stroke-width': '.8', opacity: '.65', 'vector-effect': 'non-scaling-stroke', 'data-family': j, 'data-line': k }, g);
      svgElement('path', { d: `M ${d * vx - vy * extent} ${d * vy + vx * extent} L ${d * vx + vy * extent} ${d * vy - vx * extent}`, stroke: 'transparent', 'stroke-width': '10', fill: 'none', 'vector-effect': 'non-scaling-stroke', 'data-family': j, 'data-line': k, class: 'grid-hit' }, g);
    }
  });
  highlightMovingGrid();
}
function highlightMovingGrid() {
  $('grid').querySelectorAll('line').forEach(line => {
    const family = +line.dataset.family;
    const active = family === activeFamily;
    const balanced = activeFamily !== null && family === 4;
    line.setAttribute('stroke', active ? '#111111' : balanced ? '#555555' : familyColors[family]);
    line.setAttribute('stroke-width', active ? '2.2' : balanced ? '1.3' : '.8');
    line.setAttribute('opacity', active ? '1' : balanced ? '.85' : activeFamily !== null ? '.2' : '.65');
    const inspected = selected && ((family === selected.r && +line.dataset.line === selected.kr) || (family === selected.s && +line.dataset.line === selected.ks));
    if (inspected) {
      line.setAttribute('stroke', active ? '#111111' : '#003e72');
      line.setAttribute('stroke-width', '2.6');
      line.setAttribute('opacity', '1');
    }
    if (selectedLine && family === selectedLine.family && +line.dataset.line === selectedLine.index) {
      line.setAttribute('stroke', '#003e72'); line.setAttribute('stroke-width', '3'); line.setAttribute('opacity', '1');
    }
  });
  $('grid-motion').textContent = activeFamily === null ? 'One crossing ↔ one rhombus' : `Moving γ${'₀₁₂₃'[activeFamily]}: black lines · γ₄ compensates in dark grey`;
}
function endShift() {
  if (activeFamily === null) return;
  clearTimeout(shiftTimer);
  activeFamily = null;
  if (selected) inspect(selected); else highlightMovingGrid();
}
function inspect(tile) {
  selectedLine = null;
  resetTileEmphasis();
  selected = tile;
  $('tiling').querySelector('.selected')?.classList.remove('selected');
  const element = [...$('tiling').querySelectorAll('polygon')].find(el => el.dataset.id === tile.id);
  element?.classList.add('selected');
  $('inspect').textContent = `${tile.type === 'thick' ? 'Thick rhombus (72° / 108°)' : 'Thin rhombus (36° / 144°)'} · grids ${tile.r} & ${tile.s}, lines ${tile.kr} & ${tile.ks}. Crossing (${tile.crossing.map(v => v.toFixed(3)).join(', ')}). Base K = (${tile.k.join(', ')}); four vertices: f(K), f(K + e${tile.r}), f(K + e${tile.r} + e${tile.s}), f(K + e${tile.s}).`;
  if (tile.outsidePatch) $('inspect').textContent += ' This tracked rhombus is outside the radius and is retained in the view and exports.';
  renderGrid();
  svgElement('circle', { cx: tile.crossing[0], cy: -tile.crossing[1], r: .14, fill: '#fff', stroke: '#222222', 'stroke-width': '2', 'vector-effect': 'non-scaling-stroke' }, $('grid'));
}
function resetTileEmphasis() {
  $('tiling').querySelectorAll('polygon').forEach(el => {
    el.classList.remove('selected', 'ribbon-selected'); el.removeAttribute('opacity');
    el.setAttribute('stroke', state.edges ? '#222222' : 'none'); el.setAttribute('stroke-width', '.65');
  });
}
function highlightRibbon() {
  const { family, index } = selectedLine;
  const ids = new Set(data.tiles.filter(t => belongsToLine(t, family, index)).map(t => t.id));
  resetTileEmphasis();
  $('tiling').querySelectorAll('polygon').forEach(el => {
    const hit = ids.has(el.dataset.id);
    el.setAttribute('opacity', hit ? '1' : '.22');
    if (hit) { el.classList.add('ribbon-selected'); el.setAttribute('stroke', '#003e72'); el.setAttribute('stroke-width', '2'); }
  });
  $('inspect').textContent = `Grid line L${'₀₁₂₃₄'[family]}(${index}) · ${ids.size} rhombi in this patch form its ribbon. Each selected rhombus is generated where this line crosses another family. The line and ribbon remain selected as offsets change.`;
  if (!ids.size) $('inspect').textContent += ' No crossings on this line lie in the current patch; increase the radius or choose a nearer line.';
  highlightMovingGrid();
}
function inspectLine(family, index) {
  if (!Number.isInteger(family) || family < 0 || family > 4 || !Number.isInteger(index) || Math.abs(index) > 100) { setMessage('Choose a family from 0 to 4 and an integer line index between -100 and 100.'); return; }
  selected = null; selectedLine = { family, index };
  $('line-family').value = family; $('line-index').value = index;
  state.view = 'both'; syncControls();
  if (data.tiles.some(tile => tile.outsidePatch)) { data = generate(state); render(); }
  else { renderGrid(); highlightRibbon(); }
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportSvg() {
  const clone = $('tiling').cloneNode(true), size = patchSize();
  clone.setAttribute('xmlns', NS); clone.setAttribute('width', '2000'); clone.setAttribute('height', '2000');
  clone.setAttribute('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`);
  clone.removeAttribute('id'); clone.querySelector('.selected')?.classList.remove('selected');
  clone.querySelectorAll('polygon').forEach(el => el.removeAttribute('transform'));
  const background = svgElement('rect', { x: -size / 2, y: -size / 2, width: size, height: size, fill: palettes[state.palette][2] });
  clone.prepend(background);
  const metadata = svgElement('metadata', {}, clone);
  metadata.textContent = JSON.stringify({ method: 'de Bruijn pentagrid', ...state, selectedLine, trackedCrossing: selected ? { r: selected.r, s: selected.s, kr: selected.kr, ks: selected.ks } : null, effectiveShifts: data.effectiveShifts });
  return new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
}

loadLink();
state.shifts.slice(0, 4).forEach((v, j) => {
  const div = document.createElement('div'); div.className = 'shift';
  div.innerHTML = `<label class="shift-label" for="gamma${j}"><span><i class="dot" style="--dot:${familyColors[j]}"></i>γ${'₀₁₂₃'[j]}</span><output id="gamma-value${j}"></output></label><input id="gamma${j}" type="range" min="-1" max="1" step="0.001" aria-label="Grid ${j} shift">`;
  $('shifts').append(div);
  $(`gamma${j}`).addEventListener('input', () => {
    activeFamily = j;
    clearTimeout(shiftTimer);
    shiftTimer = setTimeout(endShift, 800);
    state.shifts = balanceShifts(Array.from({ length: 4 }, (_, i) => +$(`gamma${i}`).value));
    syncControls(); regenerate();
  });
  for (const name of ['change', 'blur', 'pointercancel']) $(`gamma${j}`).addEventListener(name, endShift);
});
document.addEventListener('pointerup', endShift);
$('preset').addEventListener('change', event => { state.shifts = [...presets[event.target.value]]; syncControls(); regenerate(); });
$('random').addEventListener('click', () => {
  const numbers = crypto.getRandomValues(new Uint32Array(4));
  state.shifts = balanceShifts([...numbers].map(n => Math.round((n / 4294967295 - .5) * 1800) / 1000));
  syncControls(); regenerate();
});
$('radius').addEventListener('input', event => { state.radius = +event.target.value; syncControls(); fit(); regenerate(); });
$('palette').addEventListener('change', event => { state.palette = event.target.value; render(); });
$('edges').addEventListener('change', event => { state.edges = event.target.checked; render(); });
document.querySelectorAll('button[data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; syncControls(); }));
$('inspect-first').addEventListener('click', () => {
  const tile = data.tiles.reduce((best, t) => Math.hypot(...t.crossing) < Math.hypot(...best.crossing) ? t : best);
  state.view = 'both'; syncControls(); inspect(tile);
});
$('fit').addEventListener('click', fit);
$('grid').addEventListener('click', event => {
  const line = event.target.closest('[data-family][data-line]');
  if (line) inspectLine(+line.dataset.family, +line.dataset.line);
});
$('select-line').addEventListener('click', () => inspectLine(+$('line-family').value, +$('line-index').value));
$('clear-selection').addEventListener('click', () => { selected = null; selectedLine = null; data = generate(state); render(); });
function zoom(factor) { camera.size = Math.max(4, Math.min(200, camera.size * factor)); applyCamera(); }
$('zoom-in').addEventListener('click', () => zoom(.8));
$('zoom-out').addEventListener('click', () => zoom(1.25));
$('tiling').addEventListener('wheel', event => { event.preventDefault(); zoom(Math.exp(event.deltaY * .001)); }, { passive: false });
let drag;
$('tiling').addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, cx: camera.x, cy: camera.y, moved: false, id: event.target.closest('polygon')?.dataset.id };
  $('tiling').setPointerCapture(event.pointerId);
});
$('tiling').addEventListener('pointermove', event => {
  if (!drag) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (Math.hypot(dx, dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  const bounds = $('tiling').getBoundingClientRect(), scale = camera.size / Math.min(bounds.width, bounds.height);
  camera.x = drag.cx - dx * scale; camera.y = drag.cy - dy * scale; applyCamera();
});
$('tiling').addEventListener('pointerup', () => {
  if (drag && !drag.moved && drag.id) inspect(data.tiles.find(t => t.id === drag.id));
  drag = null;
});
$('tiling').addEventListener('pointercancel', () => { drag = null; });
$('svg-export').addEventListener('click', () => { download(exportSvg(), 'penrose-pattern.svg'); setMessage('SVG exported: the complete patch.'); });
$('png-export').addEventListener('click', async () => {
  const url = URL.createObjectURL(exportSvg());
  try {
    const img = new Image(); img.src = url; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2000;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    download(blob, 'penrose-pattern.png'); setMessage('PNG exported at 2000 × 2000 pixels.');
  } catch { setMessage('PNG export failed. Please try SVG export.'); }
  finally { URL.revokeObjectURL(url); }
});
$('json-export').addEventListener('click', () => {
  download(new Blob([JSON.stringify({ version: 1, method: 'de Bruijn pentagrid', settings: state, selectedLine, effectiveShifts: data.effectiveShifts, regularized: data.regularized, tiles: data.tiles }, null, 2)], { type: 'application/json' }), 'penrose-pattern.json');
  setMessage('Geometry and settings exported.');
});
$('share').addEventListener('click', async () => {
  const params = new URLSearchParams({ g: state.shifts.slice(0, 4).join(','), r: state.radius, p: state.palette, e: state.edges ? 1 : 0, v: state.view });
  history.replaceState(null, '', '#' + params);
  try { await navigator.clipboard.writeText(location.href); setMessage('Pattern link copied. Local links work on this computer.'); }
  catch { setMessage('Your pattern is saved in the address bar. Copy that URL to keep it.'); }
});
animation = createAnimationControls({
  svg: $('tiling'),
  getSeed: () => selected?.id,
  onViewport(isAssembling) {
    if (isAssembling) {
      if (!animationCamera) animationCamera = { ...camera };
      camera = { x: 0, y: 0, size: Math.max(patchSize(), Math.max(...data.tiles.map(t => Math.hypot(...t.crossing))) * 8.5 + 6) };
      if (state.view === 'grid') { state.view = 'both'; syncControls(); }
    } else if (animationCamera) {
      camera = animationCamera; animationCamera = null;
    }
    applyCamera();
  }
});
syncControls(); fit(); data = generate(state); render();
