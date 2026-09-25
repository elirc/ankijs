// Render the "Build real apps" guided lessons (applied-decks.json + applied-lessons.json) into
// applied-expansion.json and merge them into the shipped catalog, card packs, and baseline.
//
// Usage: node scripts/build-applied-lessons.mjs
// Idempotent: a second run changes nothing. Then run export-retrieval-baseline.mjs and
// build-reviewed-content.mjs so the manifest and reports pick up the new decks.
//
// Card identities are permanent. If a lesson's text changes after it has shipped, the new text
// is written to reviewed-corrections.json (never directly over the shipped card) so that
// build-reviewed-content.mjs records a correction and installed apps receive the update.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = join(root, 'src/data');
const read = name => JSON.parse(readFileSync(join(data, name), 'utf8'));
const writeIfChanged = (name, text) => {
  const path = join(data, name);
  let current;
  try { current = readFileSync(path, 'utf8').replace(/\r\n/g, '\n'); } catch { current = undefined; }
  if (current === text) return false;
  writeFileSync(path, text);
  return true;
};
const pretty = value => JSON.stringify(value, null, 2) + '\n';
const compact = value => JSON.stringify(value) + '\n';
const sha256 = text => createHash('sha256').update(text).digest('hex');
const deckNumber = id => Number(id.slice(-12));

// Same renderer as the teaching, practical, and .NET lessons (artifacts/content-v16/render.mjs).
export function renderLesson(lesson, variant) {
  const d = createHash('sha256').update(lesson.key).digest('hex');
  const id = `e0000000-${d.slice(0,4)}-4${d.slice(4,7)}-8${d.slice(7,10)}-${d.slice(10,21)}${variant}`;
  const first = variant === 0 ? lesson.plain : lesson.answer + '\n\n### Why this happens\n\n' + lesson.plain;
  const practice = variant === 0 ? [lesson.check, lesson.answer] : [lesson.question, lesson.plain];
  const pages = [
    [variant === 0 ? 'Plain English' : 'The answer, explained', first],
    ['A worked example', lesson.example],
    ['Picture it another way', lesson.analogy],
    ['A common mistake', lesson.mistake],
    [variant === 0 ? 'Try a small exercise' : 'Explain it in your own words', practice[0] + '\n\n<!-- recall:solution -->\n\n' + practice[1]],
  ];
  const back = '<!-- recall:teaching:v1 -->\n\n' + pages.map(([t, b]) => '## ' + t + '\n\n' + b).join('\n\n');
  return { id, front: variant === 0 ? lesson.question : lesson.check, back };
}

const FIELDS = ['question', 'plain', 'example', 'analogy', 'mistake', 'check', 'answer'];
const decks = read('applied-decks.json');
const lessons = read('applied-lessons.json');

// Lesson keys must be unique across every guided-lesson file: they determine card identities.
const seen = new Map();
for (const file of ['teaching-lessons.json', 'practical-lessons.json', 'dotnet-lessons.json', 'applied-lessons.json'])
  for (const lesson of read(file)) {
    assert(!seen.has(lesson.key), `Duplicate lesson key ${lesson.key} in ${file} and ${seen.get(lesson.key)}`);
    seen.set(lesson.key, file);
  }

assert.equal(new Set(decks.map(deck => deck.id)).size, decks.length, 'Duplicate applied deck');
for (const deck of decks) {
  assert.equal(deck.track, 'Build real apps', `${deck.id}: wrong track`);
  for (const field of ['id', 'name', 'icon', 'color', 'description']) assert(typeof deck[field] === 'string' && deck[field], `${deck.id}: missing ${field}`);
}
const deckIds = new Set(decks.map(deck => deckNumber(deck.id)));
for (const lesson of lessons) {
  assert(deckIds.has(lesson.deck), `${lesson.key}: unknown deck ${lesson.deck}`);
  assert(!lesson.key.includes('crud-'), `${lesson.key}: crud- keys are reserved`);
  for (const field of FIELDS) {
    const text = lesson[field];
    assert(typeof text === 'string' && text.trim().length > 15, `${lesson.key}: missing ${field}`);
    assert.equal(text, text.trim(), `${lesson.key}: untrimmed ${field}`);
    // build-reviewed-content.mjs would normalise these and record a spurious correction.
    assert(!/\n{3,}/.test(text), `${lesson.key}: blank-line run in ${field}`);
    assert(!/^<\/?code-tabs\b/m.test(text), `${lesson.key}: code-tabs wrapper in ${field}`);
    assert.equal((text.match(/```/g) ?? []).length % 2, 0, `${lesson.key}: unbalanced fence in ${field}`);
  }
}

const expansion = decks.map(deck => {
  const own = lessons.filter(lesson => lesson.deck === deckNumber(deck.id));
  assert(own.length > 0, `${deck.id}: no lessons`);
  const cards = own.flatMap(lesson => [0, 1].map(variant => ({ ...renderLesson(lesson, variant), kind: variant === 0 ? 'concept' : 'practice' })));
  for (const card of cards) assert(!/\n{3,}/.test(card.back), `${card.id}: blank-line run`);
  return { ...deck, cards };
});
const allCards = expansion.flatMap(deck => deck.cards);
assert.equal(new Set(allCards.map(card => card.id)).size, allCards.length, 'Duplicate applied card identity');
const changed = [];
if (writeIfChanged('applied-expansion.json', pretty(expansion))) changed.push('applied-expansion.json');

// Catalog: deck metadata plus base card count, appended after the existing authored decks.
const catalog = read('expanded-catalog.json');
for (const { cards, ...info } of expansion) {
  const entry = { ...info, cardCount: cards.length };
  const index = catalog.findIndex(deck => deck.id === info.id);
  if (index === -1) catalog.push(entry); else catalog[index] = entry;
}
if (writeIfChanged('expanded-catalog.json', pretty(catalog))) changed.push('expanded-catalog.json');

// Card packs: new identities are appended; shipped identities are never rewritten in place.
const packs = read('expanded-cards.json');
const overrides = read('reviewed-corrections.json');
let overridesChanged = false;
for (const deck of expansion) {
  let pack = packs.find(pack => pack.id === deck.id);
  if (!pack) { pack = { id: deck.id, cards: [] }; packs.push(pack); }
  for (const card of deck.cards) {
    const shipped = pack.cards.find(existing => existing.id === card.id);
    if (!shipped) { pack.cards.push(card); continue; }
    if (shipped.front === card.front && shipped.back === card.back) continue;
    const override = overrides.find(existing => existing.id === card.id);
    if (override?.front === card.front && override?.back === card.back) continue;
    if (override) { override.front = card.front; override.back = card.back; }
    else overrides.push({ id: card.id, front: card.front, back: card.back });
    overridesChanged = true;
  }
}
if (writeIfChanged('expanded-cards.json', compact(packs))) changed.push('expanded-cards.json');
if (overridesChanged && writeIfChanged('reviewed-corrections.json', pretty(overrides))) changed.push('reviewed-corrections.json');

// Baseline: per-deck base card count; contentHash fingerprints the first shipped content.
const baseline = read('section-expansion-baseline.json');
for (const deck of expansion) {
  const pack = packs.find(pack => pack.id === deck.id);
  const index = baseline.findIndex(entry => entry.id === deck.id);
  const contentHash = index === -1
    ? sha256(JSON.stringify(pack.cards.map(card => [card.id, card.front, card.back])))
    : baseline[index].contentHash;
  const entry = { id: deck.id, name: deck.name, track: deck.track, cardCount: pack.cards.length, contentHash };
  if (index === -1) baseline.push(entry); else baseline[index] = entry;
}
if (writeIfChanged('section-expansion-baseline.json', pretty(baseline))) changed.push('section-expansion-baseline.json');

const report = read('content-report.json');
report.appliedCards = allCards.length;
report.appliedLessons = lessons.length;
report.teachingLessons = seen.size;
if (writeIfChanged('content-report.json', pretty(report))) changed.push('content-report.json');

console.log(`Applied lessons: ${decks.length} decks, ${lessons.length} lessons, ${allCards.length} cards; ` +
  `${seen.size} guided lessons in total. ${changed.length ? 'Updated: ' + changed.join(', ') : 'No changes.'}`);
