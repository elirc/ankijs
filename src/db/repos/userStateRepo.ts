import { db, type UserState } from "../schema";
import { enqueueOutbox } from "../sync/outbox";
import { validatePracticeEntries } from "./practiceRepo";

export async function saveUserState(
  id: string,
  payload: string,
  stamp = new Date().toISOString(),
) {
  const previous = await db.user_state.get(id);
  const updated_at = new Date(
    Math.max(
      Date.parse(stamp),
      previous ? Date.parse(previous.updated_at) + 1 : 0,
    ),
  ).toISOString();
  await db.user_state.put({
    id,
    user_id: previous?.user_id ?? null,
    payload,
    updated_at,
  });
  await enqueueOutbox("user_state", id, updated_at);
}
export function validateUserState(row: UserState) {
  if (
    !row ||
    typeof row.id !== "string" ||
    !/^(engineering_practice:|review_revoked:|learning_settings$)/.test(
      row.id,
    ) ||
    row.id.length > 200 ||
    typeof row.payload !== "string" ||
    row.payload.length > 100000 ||
    !Number.isFinite(Date.parse(row.updated_at))
  )
    throw new Error("Invalid synced learning record");
}
export async function mergeUserState(row: UserState) {
  validateUserState(row);
  const local = await db.user_state.get(row.id);
  // Revocation is permanent, independent of the other device's clock.
  if (row.id.startsWith("review_revoked:")) {
    await db.review_logs.delete(row.id.slice("review_revoked:".length));
    await db.user_state.put(local ?? row);
    return;
  }
  const mirror = await db.sync_meta.get(row.id);
  let mirrorTime = "";
  try {
    mirrorTime = mirror ? (JSON.parse(mirror.value).updated_at ?? "") : "";
  } catch {
    /* validate incoming payload below */
  }
  if (
    (local && local.updated_at >= row.updated_at) ||
    mirrorTime > row.updated_at
  )
    return;
  const value: unknown = JSON.parse(row.payload);
  if (!value || typeof value !== "object")
    throw new Error("Invalid synced payload");
  if (row.id.startsWith("engineering_practice:")) {
    validatePracticeEntries([value]);
    if (
      row.id !==
      "engineering_practice:" + (value as { mission_id: string }).mission_id
    )
      throw new Error("Practice identity mismatch");
  }
  await db.user_state.put(row);
  await db.sync_meta.put({ key: row.id, value: row.payload });
}
