// Original explanatory animation. Final positions are the exact pentagrid dual;
// intermediate positions illustrate assembly and are not a tiling.
export function assemblyPlan(tiles, seedId) {
  const edges = new Map(), neighbours = tiles.map(() => []);
  const key = p => p.join(',');
  tiles.forEach((tile, index) => tile.coordinates.forEach((p, i) => {
    const edge = [key(p), key(tile.coordinates[(i + 1) % 4])].sort().join('|');
    if (edges.has(edge)) {
      const other = edges.get(edge); neighbours[index].push(other); neighbours[other].push(index);
    } else edges.set(edge, index);
  }));
  let root = tiles.findIndex(t => t.id === seedId);
  if (root < 0) root = tiles.reduce((best, tile, i) => Math.hypot(...tile.crossing) < Math.hypot(...tiles[best].crossing) ? i : best, 0);
  const levels = new Array(tiles.length).fill(-1), queue = [root];
  levels[root] = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const i = queue[cursor];
    for (const j of neighbours[i]) if (levels[j] < 0) { levels[j] = levels[i] + 1; queue.push(j); }
  }
  const depth = Math.max(...levels, 1);
  return tiles.map((tile, i) => {
    const center = tile.points.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
    return { id: tile.id, center, dx: tile.crossing[0] * 3.8 - center[0], dy: tile.crossing[1] * 3.8 - center[1], delay: .7 * (levels[i] < 0 ? 1 : levels[i] / depth) };
  });
}
export function assemblyPose(plan, progress) {
  if (progress >= 1) return { dx: 0, dy: 0, scale: 1, settled: true };
  const t = Math.max(0, Math.min(1, (progress - plan.delay) / .3));
  const eased = t * t * (3 - 2 * t);
  return { dx: plan.dx * (1 - eased), dy: plan.dy * (1 - eased), scale: .72 + .28 * eased, settled: t >= 1 - 1e-9 };
}
