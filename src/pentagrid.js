// The geometry is independent of the DOM and uses the poster's ceiling convention.
export const PHI = (1 + Math.sqrt(5)) / 2;
export const VECTORS = Array.from({ length: 5 }, (_, j) => [Math.cos(2 * Math.PI * j / 5), Math.sin(2 * Math.PI * j / 5)]);
export const DEFAULT_SHIFTS = [0.137, -0.241, 0.319, -0.173, -0.042];
export function balanceShifts(firstFour) {
  if (firstFour.length !== 4 || firstFour.some(v => !Number.isFinite(v))) throw new Error('Four finite shifts are required.');
  return [...firstFour, -firstFour.reduce((a, b) => a + b, 0)];
}
export function project(k) {
  return k.reduce((p, n, j) => [p[0] + n * VECTORS[j][0], p[1] + n * VECTORS[j][1]], [0, 0]);
}
function construct(shifts, radius, trackedCrossing) {
  const tiles = [];
  let singular = false;
  for (let r = 0; r < 5; r++) for (let s = r + 1; s < 5; s++) {
    const [a, b] = VECTORS[r], [c, d] = VECTORS[s], det = a * d - b * c;
    const tracked = trackedCrossing?.r === r && trackedCrossing?.s === s ? trackedCrossing : null;
    for (let kr = Math.min(Math.ceil(shifts[r] - radius), tracked?.kr ?? Infinity); kr <= Math.max(Math.floor(shifts[r] + radius), tracked?.kr ?? -Infinity); kr++) {
      for (let ks = Math.min(Math.ceil(shifts[s] - radius), tracked?.ks ?? Infinity); ks <= Math.max(Math.floor(shifts[s] + radius), tracked?.ks ?? -Infinity); ks++) {
        const u = kr - shifts[r], v = ks - shifts[s];
        const x = (u * d - b * v) / det, y = (a * v - u * c) / det;
        const outsidePatch = x * x + y * y > radius * radius;
        if (outsidePatch && !(tracked?.kr === kr && tracked?.ks === ks)) continue;
        const k = VECTORS.map(([vx, vy], j) => {
          if (j === r) return kr;
          if (j === s) return ks;
          const q = x * vx + y * vy + shifts[j];
          if (Math.abs(q - Math.round(q)) < 1e-9) singular = true;
          return Math.ceil(q);
        });
        const coordinates = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([er, es]) => k.map((n, j) => n + (j === r ? er : j === s ? es : 0)));
        const points = coordinates.map(project);
        const delta = s - r;
        tiles.push({ id: `${r}:${kr}/${s}:${ks}`, r, s, kr, ks, crossing: [x, y], outsidePatch, k, coordinates, points, type: delta === 1 || delta === 4 ? 'thick' : 'thin' });
      }
    }
  }
  return { tiles, singular };
}
export function generate({ shifts = DEFAULT_SHIFTS, radius = 7, trackedCrossing = null } = {}) {
  if (shifts.length !== 5 || shifts.some(v => !Number.isFinite(v) || Math.abs(v) > 10)) throw new Error('Five finite shifts between -10 and 10 are required.');
  if (Math.abs(shifts.reduce((a, b) => a + b, 0)) > 1e-8) throw new Error('The five shifts must sum to zero.');
  if (!Number.isFinite(radius) || radius < 2 || radius > 20) throw new Error('Radius must be between 2 and 20.');
  if (trackedCrossing && (!Number.isInteger(trackedCrossing.r) || !Number.isInteger(trackedCrossing.s) || trackedCrossing.r < 0 || trackedCrossing.s > 4 || trackedCrossing.r >= trackedCrossing.s || !Number.isInteger(trackedCrossing.kr) || !Number.isInteger(trackedCrossing.ks) || Math.abs(trackedCrossing.kr) > 100 || Math.abs(trackedCrossing.ks) > 100)) throw new Error('Invalid tracked crossing.');
  let effectiveShifts = [...shifts];
  let result = construct(effectiveShifts, radius, trackedCrossing);
  let regularized = false;
  // Singular grids have ambiguous duals. Choose a reproducible nearby regular grid,
  // preserving sum(gamma) = 0, and return its exact shifts for inspection/export.
  for (let attempt = 1; result.singular && attempt <= 8; attempt++) {
    regularized = true;
    const direction = [Math.SQRT2, -Math.sqrt(3), Math.sqrt(5), -Math.sqrt(7)];
    effectiveShifts = balanceShifts(shifts.slice(0, 4).map((v, j) => v + direction[j] * attempt * 1e-6));
    result = construct(effectiveShifts, radius, trackedCrossing);
  }
  if (result.singular) throw new Error('Could not resolve this singular grid. Try another shift.');
  const thick = result.tiles.filter(t => t.type === 'thick').length;
  return { ...result, shifts: [...shifts], effectiveShifts, regularized, radius, thick, thin: result.tiles.length - thick };
}
