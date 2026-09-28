import { beforeEach, expect, it } from "vitest";
import { db, resetDatabaseForTests } from "../schema";
import { createDeck } from "./deckRepo";
import { createCard, applyReview, undoReview } from "./cardRepo";
import { rate } from "../../srs/scheduler";
import { exportData, importData } from "./dataRepo";
import { saveLearningSettings, getLearningSettings } from "./learningRepo";
import {
  savePracticeEntry,
  emptyPracticeEntry,
  listPracticeEntries,
} from "./practiceRepo";
import { mergeUserState } from "./userStateRepo";
beforeEach(resetDatabaseForTests);
it("backs up preferences and durable review revocations", async () => {
  const deck = await createDeck("Test");
  const card = await createCard({ deck_id: deck.id, front: "Q", back: "A" });
  const result = rate(card, 3, new Date());
  await applyReview(result.card, result.log);
  const staleBackup = await exportData();
  await undoReview(card, result.log.id);
  await saveLearningSettings({
    path: "Backend",
    theme: "dark",
    favorites: [deck.id],
  });
  const backup = await exportData();
  await resetDatabaseForTests();
  await importData(backup);
  await importData(staleBackup);
  expect(await db.review_logs.count()).toBe(0);
  expect((await getLearningSettings()).theme).toBe("dark");
  expect((await getLearningSettings()).path).toBe("Backend");
});
it("queues journal changes and merges a remote journal", async () => {
  const draft = {
    ...emptyPracticeEntry("trace-a-request"),
    outcome: "local evidence",
  };
  await savePracticeEntry(draft);
  expect(
    await db.outbox.filter((e) => e.table_name === "user_state").count(),
  ).toBe(1);
  const entry = {
    ...draft,
    outcome: "new remote evidence",
    updated_at: "2099-01-01T00:00:00Z",
  };
  await db.transaction(
    "rw",
    db.user_state,
    db.sync_meta,
    db.review_logs,
    async () =>
      mergeUserState({
        id: "engineering_practice:" + entry.mission_id,
        user_id: "alice",
        payload: JSON.stringify(entry),
        updated_at: entry.updated_at,
      }),
  );
  expect((await listPracticeEntries())[0].outcome).toBe("new remote evidence");
});
it("rejects malformed synced journals before writing their mirror", async () => {
  await expect(
    mergeUserState({
      id: "engineering_practice:trace-a-request",
      user_id: "alice",
      payload: "{}",
      updated_at: new Date().toISOString(),
    }),
  ).rejects.toThrow();
  expect(
    await db.sync_meta.get("engineering_practice:trace-a-request"),
  ).toBeUndefined();
});
