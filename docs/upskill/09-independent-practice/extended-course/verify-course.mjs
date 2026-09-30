import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
const course = new URL('./', import.meta.url);
const root = new URL('../../../../', import.meta.url);
const json = async url => JSON.parse(await readFile(url, 'utf8'));
const plan = await json(new URL('course-map.json', course));
const units = new Map((await json(new URL('src/data/workshop-units.json', root))).map(u => [u.id,u]));
const decks = new Set((await Promise.all(['original','expanded','workshop'].map(async name => {
 const file = name === 'expanded' ? 'expanded-catalog.json' : name + '-deck-catalog.json';
 return json(new URL('src/data/' + file, root));
}))).flat().map(d => d.id));
assert.equal(new Set(plan.chapters).size, plan.chapters.length);
for (const file of plan.chapters) {
 assert.ok((await stat(new URL(file, course))).isFile());
 assert.ok((await stat(new URL('reviews/' + file, course))).isFile());
}
for (const ref of plan.workshopUnits) {
 const actual = units.get(ref.id);
 assert.ok(actual, ref.id);
 for (const key of ['deckId','cardIds','fixture']) assert.deepEqual(ref[key], actual[key], ref.id + ': ' + key);
 assert.equal(ref.missionId, 'lab-' + ref.id);
 assert.ok(decks.has(ref.deckId));
 assert.ok((await stat(new URL('public' + ref.fixture, root))).isFile());
}
for (const path of plan.sourceFiles ?? []) assert.ok((await stat(new URL(path, root))).isFile(), path);
console.log(`PASS ${plan.chapters.length} chapter/review pairs; ${plan.workshopUnits.length} source identities`);
