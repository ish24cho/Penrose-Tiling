import { assemblyPlan, assemblyPose, ASSEMBLY_GRID_SCALE } from './assembly.js';
import { VECTORS } from './pentagrid.js';

export function createAnimationControls({ svg, onViewport, getSeed }) {
  const $ = id => document.getElementById(id);
  let plan = [], elements = [], tiles = [], progress = 1, playing = false, raf = 0, last = null;
  let grid;
  function buildGrid(shifts) {
    grid?.remove();
    const namespace = 'http://www.w3.org/2000/svg';
    grid = document.createElementNS(namespace, 'g');
    grid.setAttribute('data-assembly-grid', '');
    grid.setAttribute('aria-hidden', 'true');
    grid.setAttribute('pointer-events', 'none');
    // The same scale as the starting rhombus centres, with the SVG y-axis inverted.
    grid.setAttribute('transform', `scale(${ASSEMBLY_GRID_SCALE},${-ASSEMBLY_GRID_SCALE})`);
    const extent = Math.max(...tiles.map(tile => Math.hypot(...tile.crossing))) + 2;
    VECTORS.forEach(([vx, vy], j) => {
      for (let k = Math.ceil(shifts[j] - extent * 1.5); k <= Math.floor(shifts[j] + extent * 1.5); k++) {
        const d = k - shifts[j], line = document.createElementNS(namespace, 'line');
        const attrs = { x1: d * vx - vy * extent * 2, y1: d * vy + vx * extent * 2,
          x2: d * vx + vy * extent * 2, y2: d * vy - vx * extent * 2,
          stroke: '#507da8', 'stroke-width': '1', 'vector-effect': 'non-scaling-stroke' };
        for (const [name, value] of Object.entries(attrs)) line.setAttribute(name, value);
        grid.append(line);
      }
    });
    svg.prepend(grid);
  }
  function draw() {
    const gridOpacity = .8 * Math.max(0, Math.min(1, (.65 - progress) / .5));
    grid.setAttribute('opacity', gridOpacity);
    grid.setAttribute('display', gridOpacity > 0 ? 'inline' : 'none');
    let count = 0;
    plan.forEach((item, i) => {
      const pose = assemblyPose(item, progress), [cx, cy] = item.center;
      if (pose.settled) { elements[i].removeAttribute('transform'); count++; }
      else elements[i].setAttribute('transform', `translate(${pose.dx + cx} ${pose.dy + cy}) scale(${pose.scale}) translate(${-cx} ${-cy})`);
    });
    $('animation-progress').value = Math.round(progress * 1000);
    $('animation-readout').textContent = `${count.toLocaleString()} / ${plan.length.toLocaleString()} rhombi placed`;
    $('animation-play').textContent = playing ? 'Pause' : progress >= 1 ? 'Animate assembly' : 'Continue';
    $('animation-play').setAttribute('aria-pressed', String(playing));
    onViewport(progress < 1);
  }
  function pause() { playing = false; cancelAnimationFrame(raf); last = null; }
  function tick(now) {
    if (!playing) return;
    if (last !== null) progress = Math.min(1, progress + Math.min(now - last, 100) / 8000 * Number($('animation-speed').value));
    last = now;
    if (progress >= 1) pause();
    draw();
    if (playing) raf = requestAnimationFrame(tick);
  }
  function play(restart = false) {
    pause();
    if (restart || progress >= 1) { progress = 0; plan = assemblyPlan(tiles, getSeed()); }
    playing = true; draw(); raf = requestAnimationFrame(tick);
  }
  $('animation-play').addEventListener('click', () => { if (playing) { pause(); draw(); } else play(); });
  $('animation-replay').addEventListener('click', () => play(true));
  $('animation-reset').addEventListener('click', () => { pause(); progress = 1; draw(); });
  $('animation-progress').addEventListener('input', event => { pause(); progress = Number(event.target.value) / 1000; draw(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); draw(); } });
  return {
    setTiles(nextTiles, selectedId, shifts) {
      pause(); progress = 1;
      tiles = nextTiles;
      buildGrid(shifts);
      plan = assemblyPlan(tiles, selectedId);
      const byId = new Map([...svg.querySelectorAll('polygon')].map(el => [el.dataset.id, el]));
      elements = plan.map(item => byId.get(item.id));
      draw();
    }
  };
}
