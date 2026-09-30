import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDatabaseForTests } from "../schema";
import { mergeUserState } from "./userStateRepo";
import engineeringChecks from "../../data/engineering-completion-checks.json";

describe("deferred practice validation during sync", () => {
  beforeEach(resetDatabaseForTests);

  it("loads validation inside the merge transaction and commits matching evidence", async () => {
    const [mission_id, checked] = Object.entries(engineeringChecks)[0];
    const updated_at = "2026-09-29T12:00:00.000Z";
    const row = {
      id: `engineering_practice:${mission_id}`,
      user_id: null,
      updated_at,
      payload: JSON.stringify({
        mission_id,
        checked,
        outcome: "Changed the handler",
        verification: "Ran the failure case",
        tradeoff: "Kept the existing contract",
        completed: true,
        updated_at,
      }),
    };
    await db.transaction(
      "rw",
      db.user_state,
      db.sync_meta,
      db.review_logs,
      () => mergeUserState(row),
    );
    expect(await db.user_state.get(row.id)).toEqual(row);
    expect((await db.sync_meta.get(row.id))?.value).toBe(row.payload);
  });

  it("rolls back the enclosing transaction when a completed entry omits required checks", async () => {
    const mission_id = Object.keys(engineeringChecks)[0];
    const updated_at = "2026-09-29T12:00:00.000Z";
    const row = {
      id: `engineering_practice:${mission_id}`,
      user_id: null,
      updated_at,
      payload: JSON.stringify({
        mission_id,
        checked: [],
        outcome: "Changed the handler",
        verification: "Ran the failure case",
        tradeoff: "Kept the existing contract",
        completed: true,
        updated_at,
      }),
    };
    await expect(
      db.transaction(
        "rw",
        db.user_state,
        db.sync_meta,
        db.review_logs,
        async () => {
          await db.sync_meta.put({
            key: "transaction-probe",
            value: "must roll back",
          });
          await mergeUserState(row);
        },
      ),
    ).rejects.toThrow("Completed practice needs evidence");
    expect(await db.sync_meta.get("transaction-probe")).toBeUndefined();
    expect(await db.user_state.get(row.id)).toBeUndefined();
  });
});
