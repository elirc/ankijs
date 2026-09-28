import { beforeEach, expect, it } from "vitest";
import { db, resetDatabaseForTests } from "../db/schema";
import { createDeck } from "../db/repos/deckRepo";
import { createCard, applyReview } from "../db/repos/cardRepo";
import { rate } from "../srs/scheduler";
import {
  getLearningSettings,
  saveLearningSettings,
  normalizeLearning,
} from "../db/repos/learningRepo";
import { learningDiagnostics } from "./LearningDiagnostics";
import { workshopUnits, workshopGroups } from "../data/workshop";
beforeEach(resetDatabaseForTests);
it("persists a selected path and bounds untrusted reading preferences", async () => {
  await saveLearningSettings({ path: "Backend", fontSize: 20, theme: "dark" });
  expect(await getLearningSettings()).toMatchObject({
    path: "Backend",
    fontSize: 20,
    theme: "dark",
  });
  expect(normalizeLearning({ path: "unknown", fontSize: 1000 })).toMatchObject({
    path: "",
    fontSize: 16,
  });
});
it("separates first review attempts from repeated same-day ratings", async () => {
  const deck = await createDeck("test");
  const original = await createCard({
    deck_id: deck.id,
    front: "Q",
    back: "A",
  });
  const now = new Date("2026-09-26T12:00:00");
  const card = {
    ...original,
    state: "review" as const,
    reps: 5,
    last_review: "2026-09-01T00:00:00Z",
  };
  const first = rate(card, 1, now);
  await applyReview(first.card, first.log);
  const next = rate(first.card, 3, new Date(now.getTime() + 60000));
  await applyReview(next.card, next.log);
  const data = await learningDiagnostics(new Date(now.getTime() + 120000));
  expect(data.attempts).toBe(1);
  expect(data.successful).toBe(0);
  expect(data.retries).toBe(1);
  expect(await db.review_logs.count()).toBe(2);
});
it("ships all seven areas with both capstones and unique card links", () => {
  expect(workshopGroups).toHaveLength(7);
  expect(workshopUnits.filter((u) => u.group === "Capstones")).toHaveLength(2);
  for (const group of workshopGroups.filter((g) => g !== "Capstones"))
    expect(workshopUnits.filter((u) => u.group === group)).toHaveLength(6);
  expect(new Set(workshopUnits.flatMap((u) => u.cardIds)).size).toBe(76);
});
