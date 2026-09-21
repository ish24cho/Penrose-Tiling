import { assemblyPlan, assemblyPose } from './assembly.js';

export function createAnimationControls({ svg, onViewport, getSeed }) {
  const $ = id => document.getElementById(id);
  let plan = [], elements = [], tiles = [], progress = 1, playing = false, raf = 0, last = null;
  function draw() {
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
    setTiles(nextTiles, selectedId) {
      pause(); progress = 1;
      tiles = nextTiles;
      plan = assemblyPlan(tiles, selectedId);
      const byId = new Map([...svg.querySelectorAll('polygon')].map(el => [el.dataset.id, el]));
      elements = plan.map(item => byId.get(item.id));
      draw();
    }
  };
}
