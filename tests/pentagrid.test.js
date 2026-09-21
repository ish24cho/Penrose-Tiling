import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, balanceShifts, project, PHI, DEFAULT_SHIFTS } from '../src/pentagrid.js';

const key = p => p.map(x => x.toFixed(7)).join(',');
const edgeKey = (a, b) => [key(a), key(b)].sort().join('|');
const area = points => Math.abs(points.reduce((a, p, i) => { const q = points[(i + 1) % points.length]; return a + p[0] * q[1] - p[1] * q[0]; }, 0) / 2);
test('rhombi have unit edges, correct area and the poster’s projected integer vertices', () => {
  const patch = generate();
  for (const tile of patch.tiles) {
    tile.points.forEach((p, i) => {
      const q = tile.points[(i + 1) % 4];
      assert.ok(Math.abs(Math.hypot(p[0] - q[0], p[1] - q[1]) - 1) < 1e-12);
      assert.deepEqual(p, project(tile.coordinates[i]));
    });
    assert.ok(Math.abs(area(tile.points) - Math.sin((tile.type === 'thick' ? 72 : 36) * Math.PI / 180)) < 1e-10);
  }
});
test('patch is a connected disk with no interior boundary or multiply shared edges', () => {
  for (const shifts of [DEFAULT_SHIFTS, balanceShifts([.19, .19, .19, .19]), [0, 0, 0, 0, 0]]) {
    const patch = generate({ shifts, radius: 5 }), edges = new Map(), vertices = new Set();
    for (const tile of patch.tiles) tile.points.forEach((p, i) => {
      vertices.add(key(p));
      const q = tile.points[(i + 1) % 4], k = edgeKey(p, q);
      if (!edges.has(k)) edges.set(k, { count: 0, midpoint: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] });
      edges.get(k).count++;
    });
    for (const edge of edges.values()) {
      assert.ok(edge.count === 1 || edge.count === 2);
      if (edge.count === 1) assert.ok(Math.hypot(...edge.midpoint) > 5 * 2.5 - 2, 'unmatched edge must be on patch perimeter');
    }
    assert.equal(vertices.size - edges.size + patch.tiles.length, 1, 'Euler characteristic of a disk');
  }
});
function overlaps(a, b) {
  for (const polygon of [a, b]) for (let i = 0; i < 4; i++) {
    const p = polygon[i], q = polygon[(i + 1) % 4], axis = [q[1] - p[1], p[0] - q[0]];
    const pa = a.map(v => v[0] * axis[0] + v[1] * axis[1]), pb = b.map(v => v[0] * axis[0] + v[1] * axis[1]);
    if (Math.max(...pa) <= Math.min(...pb) + 1e-8 || Math.max(...pb) <= Math.min(...pa) + 1e-8) return false;
  }
  return true;
}
test('distinct tile interiors do not overlap, including a resolved singular grid', () => {
  for (const shifts of [DEFAULT_SHIFTS, [0, 0, 0, 0, 0]]) {
    const { tiles } = generate({ shifts, radius: 3 });
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
      assert.equal(overlaps(tiles[i].points, tiles[j].points), false, `${tiles[i].id} overlaps ${tiles[j].id}`);
    }
  }
});
test('singular handling is deterministic, reported and preserves zero-sum shifts', () => {
  const a = generate({ shifts: [0, 0, 0, 0, 0] }), b = generate({ shifts: [0, 0, 0, 0, 0] });
  assert.ok(a.regularized); assert.deepEqual(a, b);
  assert.ok(Math.abs(a.effectiveShifts.reduce((x, y) => x + y, 0)) < 1e-12);
  assert.equal(generate().regularized, false);
});
test('shifts change geometry and large patches approach the golden tile ratio', () => {
  assert.notDeepEqual(generate().tiles, generate({ shifts: balanceShifts([.3, -.1, .2, -.4]) }).tiles);
  const p = generate({ radius: 15 });
  assert.ok(Math.abs(p.thick / p.thin - PHI) < .03);
});
test('invalid parameters fail explicitly', () => {
  assert.throws(() => generate({ shifts: [1, 1, 1, 1, 1] }), /sum to zero/);
  assert.throws(() => generate({ radius: Infinity }), /Radius/);
  assert.throws(() => balanceShifts([NaN, 0, 0, 0]), /finite/);
});
