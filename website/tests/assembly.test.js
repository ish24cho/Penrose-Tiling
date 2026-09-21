import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/pentagrid.js';
import { assemblyPlan, assemblyPose } from '../src/assembly.js';

test('assembly ends at the exact geometry without mutating any vertices', () => {
  const { tiles } = generate({ radius: 3 });
  const before = JSON.stringify(tiles);
  const plan = assemblyPlan(tiles);
  assert.equal(plan.length, tiles.length);
  for (const item of plan) {
    const end = assemblyPose(item, 1);
    assert.equal(end.dx, 0); assert.equal(end.dy, 0);
    assert.equal(end.scale, 1); assert.equal(end.settled, true);
    assert.ok(assemblyPose(item, 0).scale < 1);
    for (const t of [0, .25, .5, .75, 1]) {
      const p = assemblyPose(item, t);
      assert.ok(Number.isFinite(p.dx) && Number.isFinite(p.dy));
    }
  }
  assert.equal(JSON.stringify(tiles), before);
});
test('assembly starts at the selected rhombus and spreads through shared edges', () => {
  const { tiles } = generate({ radius: 3 });
  const selected = tiles[100];
  const plan = assemblyPlan(tiles, selected.id);
  assert.equal(plan.find(p => p.id === selected.id).delay, 0);
  assert.ok(plan.some(p => p.delay > .3));
  assert.deepEqual(plan, assemblyPlan(tiles, selected.id));
});
