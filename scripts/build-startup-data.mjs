// Keep browse metadata separate from lesson bodies.
// Run with Node's --experimental-strip-types; --check verifies generated files.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { originalCurriculum } from "../src/data/original-curriculum.ts";
import { workshopGroups } from "../src/data/workshop-groups.ts";
import { engineeringMissions } from "../src/data/engineering-missions.ts";

const data = new URL("../src/data/", import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, data), "utf8"));
const emit = (name, value) => {
  if (process.argv.includes("--check"))
    assert.deepEqual(
      read(name),
      value,
      `${name} is stale; run scripts/build-startup-data.mjs.`,
    );
  else
    writeFileSync(new URL(name, data), JSON.stringify(value, null, 2) + "\n");
};
emit(
  "engineering-completion-checks.json",
  Object.fromEntries(
    engineeringMissions.map((mission) => [
      mission.id,
      mission.checks.map((check) => check.id),
    ]),
  ),
);
emit(
  "original-deck-catalog.json",
  originalCurriculum.map(({ cards, ...info }) => ({
    ...info,
    cardCount: cards.length,
  })),
);
const units = read("workshop-units.json");
emit(
  "workshop-deck-catalog.json",
  workshopGroups.map((group) => {
    const matches = units.filter((unit) => unit.group === group);
    assert(matches.length > 0, `Missing workshop group ${group}`);
    return {
      id: matches[0].deckId,
      name: group + " · Workshop",
      description: "Apply, verify and explain " + group.toLowerCase() + ".",
      track: "Workshop",
      icon: "bug",
      color: "mint",
      topics: [group],
      resource: { label: "Open guided workshop", url: "/workshop" },
      cardCount: matches.length * 2,
    };
  }),
);
// Fresh installs bypass historical migrations, so published cards must already
// contain the reviewed text that an upgrade would apply.
const shipped = new Map(
  [
    ...originalCurriculum.flatMap((deck) =>
      deck.cards.map(([front, back], index) => ({
        id: `b0000000-0000-4000-8000-${String(Number(deck.id.slice(-12)) * 1000 + index + 1).padStart(12, "0")}`,
        front,
        back,
      })),
    ),
    ...read("expanded-cards.json").flatMap((deck) => deck.cards),
  ].map((card) => [card.id, card]),
);
for (const revision of read("content-corrections.json")) {
  const card = shipped.get(revision.id);
  if (!card || (card.front === revision.front && card.back === revision.back))
    continue;
  assert(
    !revision.previous.some(
      (previous) =>
        previous.front === card.front && previous.back === card.back,
    ),
    `Shipped card ${card.id} still needs an archived correction.`,
  );
}
console.log(
  `Startup catalogs verified: ${originalCurriculum.length} original decks and ${workshopGroups.length} workshop decks.`,
);
