// All tiling figures use the very same construction as the interactive website.
import { generate, DEFAULT_SHIFTS, VECTORS, belongsToLine } from '../../website/src/pentagrid.js';
import { writeFileSync, mkdirSync } from 'node:fs';
const patch = generate({ radius: 5 });
// Choose a crossing well separated from the other three families for legible labels.
const candidates = patch.tiles.filter(t => t.r === 0 && t.s === 1 && Math.hypot(...t.crossing) < 2.5);
const clearance = t => Math.min(...VECTORS.map((v, j) => {
  if (j === t.r || j === t.s) return Infinity;
  const q = v[0] * t.crossing[0] + v[1] * t.crossing[1] + DEFAULT_SHIFTS[j];
  return Math.abs(q - Math.round(q));
}));
const selected = candidates.sort((a, b) => clearance(b) - clearance(a))[0];
const payload = {
  shifts: DEFAULT_SHIFTS, vectors: VECTORS, radius: patch.radius,
  tiles: patch.tiles, selected,
  counts: { thick: patch.thick, thin: patch.thin },
  ribbon: { family: 0, index: 0, tileIds: patch.tiles.filter(t => belongsToLine(t, 0, 0)).map(t => t.id) }
};
const build = new URL('../build/', import.meta.url);
mkdirSync(build, { recursive: true });
writeFileSync(new URL('geometry.json', build), JSON.stringify(payload));
console.log(`Exported ${patch.tiles.length} website tiles; selected crossing ${selected.id}.`);

writeFileSync(new URL('../figures/parameters.json', import.meta.url), JSON.stringify({
  engine: 'website/src/pentagrid.js', radius: patch.radius, shifts: DEFAULT_SHIFTS,
  selectedCrossing: {r: selected.r, s: selected.s, kr: selected.kr, ks: selected.ks},
  counts: payload.counts, ribbon: payload.ribbon,
  colours: {navy: '#003e72', thick: '#e98576', thin: '#97cbe7'}
}, null, 2) + '\n');
