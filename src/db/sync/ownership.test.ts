import { beforeEach, expect, it, vi } from "vitest";
import { db, resetDatabaseForTests } from "../schema";
import { assertOwnership } from "./ownership";
import { syncNow, getSyncState } from "./engine";
import * as clientModule from "./supabaseClient";
import { captureNote } from "../repos/noteRepo";
beforeEach(resetDatabaseForTests);
it("blocks a different account even when every local row is unowned", async () => {
  await assertOwnership("alice");
  await captureNote("private draft");
  await expect(assertOwnership("bob")).rejects.toThrow("another account");
  expect((await db.sync_meta.get("local_owner"))?.value).toBe("alice");
});
it("blocks legacy foreign-owned records before assigning an owner", async () => {
  const note = await captureNote("private");
  await db.notes.update(note.id, { user_id: "alice" });
  await expect(assertOwnership("bob")).rejects.toThrow();
  expect(await db.sync_meta.get("local_owner")).toBeUndefined();
});
it("does not make remote calls when account ownership differs", async () => {
  await assertOwnership("alice");
  await captureNote("unsynced secret");
  const from = vi.fn(),
    rpc = vi.fn();
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue({
    from,
    rpc,
  } as unknown as ReturnType<typeof clientModule.getSupabaseClient>);
  vi.spyOn(clientModule, "getSession").mockResolvedValue({
    user: { id: "bob" },
  } as Awaited<ReturnType<typeof clientModule.getSession>>);
  await syncNow();
  expect(getSyncState().phase).toBe("error");
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(null);
  await syncNow();
});
