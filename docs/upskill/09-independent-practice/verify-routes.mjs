import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const root = new URL('../../../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const plan = await read('docs/upskill/09-independent-practice/routes.json');
const catalogs = await Promise.all(['original-deck-catalog.json', 'expanded-catalog.json', 'workshop-deck-catalog.json'].map(name => read('src/data/' + name)));
const decks = new Set(catalogs.flat().map(deck => deck.id));
const units = new Map((await read('src/data/workshop-units.json')).map(unit => [unit.id, unit]));
assert.equal(new Set(plan.routes.map(route => route.id)).size, plan.routes.length);
let count = 0;
for (const route of plan.routes) {
  assert.ok(route.deckIds.length > 0, route.id + ': missing prerequisite deck');
  for (const deck of route.deckIds) assert.ok(decks.has(deck), 'Unknown deck ' + deck);
  for (const ref of route.units) {
    const unit = units.get(ref.id);
    assert.ok(unit, 'Unknown unit ' + ref.id);
    assert.equal(ref.missionId, 'lab-' + unit.id);
    assert.equal(ref.deckId, unit.deckId);
    assert.ok(decks.has(ref.deckId));
    assert.deepEqual(ref.cardIds, unit.cardIds);
    assert.equal(ref.fixture, unit.fixture);
    assert.ok(ref.fixture.startsWith('/workshop/'));
    assert.ok((await stat(new URL('public' + ref.fixture, root))).isFile());
    count++;
  }
}
console.log(`PASS ${plan.routes.length} routes; ${count} workshop references; deck, card, mission and fixture identities agree`);
